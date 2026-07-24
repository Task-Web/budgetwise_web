import copy
import mimetypes
import os
import platform
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from mcp.server.fastmcp import FastMCP

from .config import Settings, get_settings
from .file_store import FileStore
from .schemas import (
    BudgetwiseCartUpdateRequest,
    BudgetwiseCoverageDraftRequest,
    BudgetwiseDeviceCheckRequest,
    BudgetwiseFamilyCartRequest,
    BudgetwiseFamilyRequest,
    BudgetwiseFamilyValidationRequest,
    BudgetwiseNewsletterDraftRequest,
    BudgetwisePlanCartRequest,
    BudgetwisePreferencesRequest,
    BudgetwisePromoApplyRequest,
    BudgetwisePromoDraftRequest,
    FileMetadata,
    InfoResponse,
    StatePatchRequest,
    StateRequest,
    StateResponse,
)
from .state_store import StateStore

settings = get_settings()
store = StateStore()
file_store = FileStore("files", settings.api_prefix)

tags_metadata = [
    {"name": "files", "description": "Upload and fetch files scoped to a user cookie"},
    {"name": "system", "description": "Environment and health information"},
]

DEFAULT_BUDGETWISE = {
    "view": "home", "selectedPlan": "unlimited", "selectedTerm": "3",
    "selectedSim": "esim", "factsTerm": "3", "selectedBrand": "",
    "selectedModel": "", "cartItems": [], "faqOpenId": "",
    "family": {
        "lines": 1, "planType": "", "simTypes": ["esim"], "brands": [""],
        "models": [""], "includesOpen": False, "message": "", "discountType": "",
        "discountModalOpen": False,
    },
    "coverage": {"zip": "", "message": "", "deviceMessage": ""},
    "promo": {"open": False, "code": "", "discount": 0, "applied": False, "adOpen": True, "message": ""},
    "newsletter": {"email": "", "subscribedAt": "", "message": ""},
}


def _resolve_user_cookie(provided: Optional[str]) -> str:
    return provided if provided else str(uuid.uuid4())


def _set_user_cookie(response: Response, user_id: str, settings: Settings) -> None:
    response.set_cookie(
        settings.cookie_name,
        user_id,
        max_age=settings.cookie_max_age,
        httponly=False,
        samesite="lax",
    )


# MCP server mirrors REST API operations via Streamable HTTP
mcp_server = FastMCP(
    name=f"{settings.app_name} MCP",
    instructions=(
        "Streamable HTTP MCP interface mirroring the REST API. "
        "Supply user_cookie to reuse the same per-user state; "
        "omit to generate a new cookie-backed state."
    ),
    host="0.0.0.0",
    streamable_http_path="/",
)

mcp_http_app = mcp_server.streamable_http_app()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start MCP session manager so Streamable HTTP transport works when mounted
    mcp_ctx = mcp_server.session_manager.run()
    await mcp_ctx.__aenter__()
    try:
        yield
    finally:
        await mcp_ctx.__aexit__(None, None, None)


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    openapi_tags=tags_metadata,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_user_id(
    request: Request, response: Response, settings: Settings = Depends(get_settings)
) -> str:
    cookie_override = request.query_params.get("cookie")
    user_id = cookie_override or request.cookies.get(settings.cookie_name)
    if not user_id:
        user_id = str(uuid.uuid4())
    _set_user_cookie(response, user_id, settings)
    return user_id


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    # Minimal middleware that ensures each response carries a request id header.
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    response: JSONResponse = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


@app.get("/health", tags=["system"])
async def health() -> Dict[str, str]:
    return {"status": "ok"}


# when build on the basesite, the below endpoints about state management should remain unchanged
@app.get(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    include_in_schema=False,
)
async def get_state(user_id: str = Depends(get_user_id)) -> StateResponse:
    state = await store.get_state(user_id)
    return StateResponse(user_id=user_id, state=state)


@app.put(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    summary="Replace state",
    include_in_schema=False,
)
async def put_state(payload: StateRequest, user_id: str = Depends(get_user_id)) -> StateResponse:
    next_state = {"data": payload.data, "note": payload.note}
    if payload.meta is not None:
        next_state["meta"] = payload.meta
    state = await store.replace_state(user_id, next_state)
    return StateResponse(user_id=user_id, state=state)


@app.patch(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    summary="Merge into existing state",
    include_in_schema=False,
)
async def patch_state(
    payload: StatePatchRequest, user_id: str = Depends(get_user_id)
) -> StateResponse:
    state = await store.patch_state(user_id, patch=payload.data, note=payload.note)
    return StateResponse(user_id=user_id, state=state)


@app.delete(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    summary="Reset and clear state",
    include_in_schema=False,
)
async def delete_state(user_id: str = Depends(get_user_id)) -> StateResponse:
    file_store.delete_user_files(user_id)
    state = await store.reset_state(user_id)
    return StateResponse(user_id=user_id, state=state)


@app.get(f"{settings.api_prefix}/budgetwise/session", tags=["budgetwise"])
async def get_budgetwise_session(user_id: str = Depends(get_user_id)) -> Dict[str, Any]:
    state = await store.get_state(user_id)
    session = state.data.get("budgetwise")
    if session is None:
        state = await store.patch_state(user_id, {"budgetwise": DEFAULT_BUDGETWISE}, None)
        session = state.data["budgetwise"]
    return {"user_id": user_id, "session": session}


async def _patch_budgetwise(user_id: str, patch: Dict[str, Any], note: str) -> Dict[str, Any]:
    state = await store.patch_state(user_id, {"budgetwise": patch}, note)
    return state.data["budgetwise"]


async def _mutate_budgetwise(user_id: str, mutator, note: str) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        session = data.get("budgetwise") or copy.deepcopy(DEFAULT_BUDGETWISE)
        data["budgetwise"] = mutator(session)
        return data

    state = await store.mutate_data(user_id, mutate, note=note)
    return state.data["budgetwise"]


@app.put(f"{settings.api_prefix}/budgetwise/preferences", tags=["budgetwise"])
async def save_budgetwise_preferences(
    payload: BudgetwisePreferencesRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    preferences = payload.model_dump()
    await _patch_budgetwise(user_id, preferences, "Updated shopping preferences")
    return {"user_id": user_id, "preferences": preferences}


@app.put(f"{settings.api_prefix}/budgetwise/family", tags=["budgetwise"])
async def save_budgetwise_family(
    payload: BudgetwiseFamilyRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    if not (len(payload.simTypes) == len(payload.brands) == len(payload.models) == payload.lines):
        raise HTTPException(status_code=422, detail="Family line selections must match line count")
    family = payload.model_dump()
    family["message"] = ""
    await _patch_budgetwise(user_id, {"family": family}, "Updated family plan configuration")
    return {"user_id": user_id, "family": family}


@app.post(f"{settings.api_prefix}/budgetwise/family/validate", tags=["budgetwise"])
async def validate_budgetwise_family(
    payload: BudgetwiseFamilyValidationRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    suffix = "continuing" if payload.action == "continue" else "adding to cart"
    if payload.lines < 1:
        message = f"Select at least one line before {suffix}."
    elif payload.plan_id not in {"premium", "plus", "essentials"}:
        message = f"Please select a plan before {suffix}."
    else:
        message = ""
    await _patch_budgetwise(user_id, {"family": {"message": message}}, "Validated family plan")
    return {"user_id": user_id, "valid": not message, "message": message}


@app.put(f"{settings.api_prefix}/budgetwise/coverage", tags=["budgetwise"])
async def save_budgetwise_coverage_draft(
    payload: BudgetwiseCoverageDraftRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    await _patch_budgetwise(user_id, {"coverage": {"zip": payload.zip}}, "Updated coverage ZIP")
    return {"user_id": user_id, "zip": payload.zip}


@app.post(f"{settings.api_prefix}/budgetwise/coverage/check", tags=["budgetwise"])
async def check_budgetwise_coverage(
    payload: BudgetwiseCoverageDraftRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    zip_code = payload.zip.strip()
    message = (
        f"Coverage looks strong in {zip_code}."
        if len(zip_code) == 5 and zip_code.isdigit()
        else "Enter a 5-digit ZIP code."
    )
    await _patch_budgetwise(user_id, {"coverage": {"zip": zip_code, "message": message}}, "Checked coverage")
    return {"user_id": user_id, "zip": zip_code, "message": message}


@app.post(f"{settings.api_prefix}/budgetwise/devices/check", tags=["budgetwise"])
async def check_budgetwise_device(
    payload: BudgetwiseDeviceCheckRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    message = (
        f"{payload.brand} {payload.model} is compatible. You can activate with eSIM if supported."
        if payload.brand and payload.model
        else "Select a brand and model to check compatibility."
    )
    await _patch_budgetwise(user_id, {"coverage": {"deviceMessage": message}}, "Checked device compatibility")
    return {"user_id": user_id, "message": message}


@app.put(f"{settings.api_prefix}/budgetwise/promo", tags=["budgetwise"])
async def save_budgetwise_promo_draft(
    payload: BudgetwisePromoDraftRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    promo = payload.model_dump()
    await _patch_budgetwise(user_id, {"promo": promo}, "Updated promo draft")
    return {"user_id": user_id, "promo": promo}


@app.post(f"{settings.api_prefix}/budgetwise/promo/apply", tags=["budgetwise"])
async def apply_budgetwise_promo(
    payload: BudgetwisePromoApplyRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    code = payload.code.strip().upper()
    promo: Dict[str, Any] = {}

    def mutate(session: Dict[str, Any]) -> Dict[str, Any]:
        nonlocal promo
        if not session.get("cartItems"):
            applied, discount, message = False, 0, "Add a plan before applying a code."
        elif not code:
            applied, discount, message = False, 0, "Enter a promo code."
        elif code == "BUDGETWISE":
            applied, discount, message = True, 5, "Promo applied: 5% off."
        else:
            applied, discount, message = (
                False,
                0,
                "Promo code not recognized. Use BUDGETWISE for 5% off.",
            )
        promo = {"code": code, "applied": applied, "discount": discount, "message": message}
        session["promo"] = {**session.get("promo", {}), **promo}
        return session

    await _mutate_budgetwise(user_id, mutate, "Applied promo code")
    return {"user_id": user_id, "promo": promo}


@app.put(f"{settings.api_prefix}/budgetwise/newsletter", tags=["budgetwise"])
async def save_budgetwise_newsletter_draft(
    payload: BudgetwiseNewsletterDraftRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    await _patch_budgetwise(user_id, {"newsletter": {"email": payload.email}}, "Updated newsletter email")
    return {"user_id": user_id, "email": payload.email}


@app.post(f"{settings.api_prefix}/budgetwise/newsletter/subscribe", tags=["budgetwise"])
async def subscribe_budgetwise_newsletter(
    payload: BudgetwiseNewsletterDraftRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    email = payload.email.strip()
    subscribed_at = datetime.now(timezone.utc).isoformat() if email else ""
    message = "Thanks for subscribing!" if email else "Enter an email address."
    newsletter = {"email": email, "subscribedAt": subscribed_at, "message": message}
    await _patch_budgetwise(user_id, {"newsletter": newsletter}, "Updated newsletter subscription")
    return {"user_id": user_id, "newsletter": newsletter}


@app.post(f"{settings.api_prefix}/budgetwise/cart/plans", tags=["budgetwise"])
async def add_budgetwise_plan(
    payload: BudgetwisePlanCartRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    if payload.sim_type == "esim" and payload.device is None:
        raise HTTPException(status_code=422, detail="Device is required for eSIM")
    item = {
        "id": f"cart-{uuid.uuid4().hex[:12]}", "itemType": "plan",
        "planId": payload.plan_id, "term": payload.term, "simType": payload.sim_type,
        "quantity": 1, "device": payload.device.model_dump() if payload.device else None,
        "discountPercent": 0, "bundleId": "", "bundleLines": [],
        "addedAt": datetime.now(timezone.utc).isoformat(),
    }
    def mutate(session: Dict[str, Any]) -> Dict[str, Any]:
        session.setdefault("cartItems", []).append(item)
        return session

    await _mutate_budgetwise(user_id, mutate, "Added plan to cart")
    return {"user_id": user_id, "item": item}


FAMILY_PRICING = {
    "premium": {1: (100, 105), 2: (170, 180), 3: (170, 230), 4: (215, 280), 5: (260, 330)},
    "plus": {1: (85, 90), 2: (140, 150), 3: (140, 185), 4: (170, 220), 5: (200, 255)},
    "essentials": {1: (60, 65), 2: (90, 100), 3: (90, 120), 4: (100, 120), 5: (125, 150)},
}
FAMILY_DISCOUNT_PRICING = {
    "premium": {1: (85, 90), 2: (130, 140), 3: (165, 180), 4: (200, 220), 5: (235, 260)},
    "plus": {1: (70, 75), 2: (100, 110), 3: (120, 135), 4: (140, 160), 5: (160, 185)},
    "essentials": {1: (45, 50), 2: (80, 90), 3: (90, 105), 4: (100, 120), 5: (110, 135)},
}
FAMILY_NAMES = {"premium": "BudgetWise Premium", "plus": "BudgetWise Plus", "essentials": "BudgetWise Essentials"}


@app.post(f"{settings.api_prefix}/budgetwise/cart/family", tags=["budgetwise"])
async def add_budgetwise_family_plan(
    payload: BudgetwiseFamilyCartRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    lines = len(payload.line_details)
    if len(payload.sim_types) != lines:
        raise HTTPException(status_code=422, detail="SIM selections must match family lines")
    table = FAMILY_DISCOUNT_PRICING if payload.discount_type in {"military", "first_responder"} else FAMILY_PRICING
    monthly, original = table[payload.plan_id][lines]
    bundle_id = f"family-{uuid.uuid4().hex[:12]}"
    item = {
        "id": f"cart-{bundle_id}", "itemType": "family", "planId": payload.plan_id,
        "planName": FAMILY_NAMES[payload.plan_id], "term": "1", "simTypes": payload.sim_types,
        "lineDetails": [line.model_dump() for line in payload.line_details], "quantity": 1,
        "lines": lines, "pricePerLine": monthly / lines, "monthlyTotal": monthly,
        "originalTotal": original, "upfrontTotal": monthly, "bundleId": bundle_id,
        "addedAt": datetime.now(timezone.utc).isoformat(),
    }
    def mutate(session: Dict[str, Any]) -> Dict[str, Any]:
        session.setdefault("cartItems", []).append(item)
        return session

    await _mutate_budgetwise(user_id, mutate, "Added family plan to cart")
    return {"user_id": user_id, "item": item}


@app.patch(f"{settings.api_prefix}/budgetwise/cart/items/{{item_id}}", tags=["budgetwise"])
async def update_budgetwise_cart_item(
    item_id: str, payload: BudgetwiseCartUpdateRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    item: Dict[str, Any] = {}

    def mutate(session: Dict[str, Any]) -> Dict[str, Any]:
        nonlocal item
        match = next(
            (entry for entry in session.get("cartItems", []) if entry.get("id") == item_id),
            None,
        )
        if match is None:
            raise HTTPException(status_code=404, detail="Cart item not found")
        if match.get("itemType") == "family" and (
            payload.sim_type is not None or payload.device is not None
        ):
            raise HTTPException(status_code=409, detail="Family SIMs are updated per line")
        if payload.quantity is not None:
            match["quantity"] = payload.quantity
        if payload.sim_type is not None:
            if payload.sim_type == "esim" and payload.device is None and not match.get("device"):
                raise HTTPException(status_code=422, detail="Device is required for eSIM")
            match["simType"] = payload.sim_type
            match["device"] = (
                None
                if payload.sim_type == "psim"
                else payload.device.model_dump() if payload.device else match.get("device")
            )
        item = match
        return session

    await _mutate_budgetwise(user_id, mutate, "Updated cart item")
    return {"user_id": user_id, "item": item}


@app.delete(f"{settings.api_prefix}/budgetwise/cart/items/{{item_id}}", tags=["budgetwise"])
async def remove_budgetwise_cart_item(item_id: str, user_id: str = Depends(get_user_id)) -> Dict[str, Any]:
    def mutate(session: Dict[str, Any]) -> Dict[str, Any]:
        items = session.get("cartItems", [])
        remaining = [item for item in items if item.get("id") != item_id]
        if len(remaining) == len(items):
            raise HTTPException(status_code=404, detail="Cart item not found")
        session["cartItems"] = remaining
        return session

    await _mutate_budgetwise(user_id, mutate, "Removed cart item")
    return {"user_id": user_id, "removed_item_id": item_id}


@app.post(f"{settings.api_prefix}/budgetwise/cart/checkout", tags=["budgetwise"])
async def checkout_budgetwise_cart(user_id: str = Depends(get_user_id)) -> Dict[str, Any]:
    def mutate(session: Dict[str, Any]) -> Dict[str, Any]:
        if not session.get("cartItems"):
            raise HTTPException(status_code=409, detail="Cart is empty")
        session["cartItems"] = []
        return session

    await _mutate_budgetwise(user_id, mutate, "Completed checkout")
    return {"user_id": user_id, "completed": True}


@app.post(
    f"{settings.api_prefix}/files",
    response_model=List[FileMetadata],
    tags=["files"],
    summary="Upload files for the current user",
)
async def upload_files(
    files: List[UploadFile] = File(...), user_id: str = Depends(get_user_id)
) -> List[FileMetadata]:
    return [file_store.save_upload(upload, user_id) for upload in files]


@app.get(
    f"{settings.api_prefix}/files",
    response_model=List[FileMetadata],
    tags=["files"],
    summary="List files for the current user",
)
async def list_files(user_id: str = Depends(get_user_id)) -> List[FileMetadata]:
    return file_store.list_files(user_id)


@app.get(
    f"{settings.api_prefix}/files/{{filename}}",
    tags=["files"],
    summary="Fetch a stored file for the current user",
)
async def get_file(filename: str, user_id: str = Depends(get_user_id)) -> FileResponse:
    target_path = file_store.get_file_path(user_id, filename)
    if not target_path:
        raise HTTPException(status_code=404, detail="File not found")
    display_name = filename.split("__", 1)[1] if "__" in filename else filename
    media_type = mimetypes.guess_type(display_name)[0] or "application/octet-stream"
    response = FileResponse(target_path, media_type=media_type, filename=display_name)
    _set_user_cookie(response, user_id, settings)
    return response


@app.get(
    f"{settings.api_prefix}/info",
    response_model=InfoResponse,
    tags=["system"],
    summary="System and request info",
)
async def info(request: Request, user_id: str = Depends(get_user_id)) -> InfoResponse:
    runtime_env = {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "env_mode": os.getenv("ENV", "dev"),
    }
    request_info: Dict[str, Any] = {
        "client": request.client.host if request.client else "unknown",
        "headers": dict(request.headers),
        "path": request.url.path,
        "method": request.method,
        "user_id": user_id,
    }
    return InfoResponse(
        app_name=settings.app_name,
        python_version=runtime_env["python_version"],
        env=runtime_env,
        request=request_info,
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "request_id": request.headers.get("x-request-id")},
    )


@mcp_server.tool(
    name="info",
    description="Return backend environment info and the resolved user id.",
)
async def mcp_info(user_cookie: Optional[str] = None) -> Dict[str, Any]:
    user_id = _resolve_user_cookie(user_cookie)
    runtime_env = {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "env_mode": os.getenv("ENV", "dev"),
    }
    return {
        "app_name": settings.app_name,
        "user_id": user_id,
        "env": runtime_env,
    }


# Mount MCP Streamable HTTP app at /mcp for remote access
app.mount("/mcp", mcp_http_app)
