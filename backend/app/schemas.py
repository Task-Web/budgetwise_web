from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from .models import StateMeta, UserState


class StateRequest(BaseModel):
    data: Dict[str, Any] = Field(default_factory=dict)
    note: Optional[str] = None
    meta: Optional[StateMeta] = None


class StatePatchRequest(BaseModel):
    data: Dict[str, Any] = Field(default_factory=dict)
    note: Optional[str] = None


class StateResponse(BaseModel):
    user_id: str
    state: UserState


class InfoResponse(BaseModel):
    app_name: str
    python_version: str
    env: Dict[str, str]
    request: Dict[str, Any]


class FileMetadata(BaseModel):
    id: str
    name: str
    size: int
    type: str
    url: str
    filename: str


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class BudgetwiseDevice(StrictModel):
    brand: str
    model: str


class BudgetwiseLine(StrictModel):
    lineNumber: int = Field(ge=1, le=20)
    simType: Literal["esim", "psim"]
    brand: str
    model: str


class BudgetwiseCartItem(StrictModel):
    id: str = Field(min_length=1)
    itemType: Literal["plan", "family"]
    planId: str
    planName: Optional[str] = None
    term: str
    simType: Optional[Literal["esim", "psim"]] = None
    simTypes: Optional[list[Literal["esim", "psim"]]] = None
    quantity: int = Field(ge=1, le=20)
    device: Optional[BudgetwiseDevice] = None
    lineDetails: Optional[list[BudgetwiseLine]] = None
    lines: Optional[int] = Field(default=None, ge=1, le=20)
    discountPercent: Optional[float] = Field(default=None, ge=0, le=100)
    pricePerLine: Optional[float] = Field(default=None, ge=0)
    monthlyTotal: Optional[float] = Field(default=None, ge=0)
    originalTotal: Optional[float] = Field(default=None, ge=0)
    upfrontTotal: Optional[float] = Field(default=None, ge=0)
    bundleId: str = ""
    bundleLines: Optional[list[str]] = None
    addedAt: str


class BudgetwisePreferencesRequest(StrictModel):
    view: Literal["home", "plan", "family", "family-confirm", "cart", "checkout"]
    selectedPlan: Literal["5gb", "15gb", "20gb", "unlimited"]
    selectedTerm: Literal["3", "6", "12"]
    selectedSim: Literal["esim", "psim"]
    factsTerm: Literal["3", "6", "12"]
    selectedBrand: str
    selectedModel: str
    faqOpenId: str


class BudgetwiseFamilyRequest(StrictModel):
    lines: int = Field(ge=1, le=5)
    planType: Literal["", "premium", "plus", "essentials"]
    simTypes: list[Literal["esim", "psim"]]
    brands: list[str]
    models: list[str]
    includesOpen: bool
    discountType: Literal["", "military", "first_responder"] = ""
    discountModalOpen: bool = False


class BudgetwiseCoverageDraftRequest(StrictModel):
    zip: str


class BudgetwisePromoDraftRequest(StrictModel):
    open: bool
    code: str
    adOpen: bool


class BudgetwiseNewsletterDraftRequest(StrictModel):
    email: str


class BudgetwiseFamilyValidationRequest(StrictModel):
    action: Literal["continue", "add_to_cart"]
    lines: int = Field(ge=0, le=5)
    plan_id: str


class BudgetwiseDeviceCheckRequest(StrictModel):
    brand: str
    model: str


class BudgetwisePromoApplyRequest(StrictModel):
    code: str


class BudgetwisePlanCartRequest(StrictModel):
    plan_id: Literal["5gb", "15gb", "20gb", "unlimited"]
    term: Literal["3", "6", "12"]
    sim_type: Literal["esim", "psim"]
    device: Optional[BudgetwiseDevice] = None


class BudgetwiseFamilyCartRequest(StrictModel):
    plan_id: Literal["premium", "plus", "essentials"]
    sim_types: list[Literal["esim", "psim"]]
    line_details: list[BudgetwiseLine]
    discount_type: Literal["", "military", "first_responder"] = ""


class BudgetwiseCartUpdateRequest(StrictModel):
    quantity: Optional[int] = Field(default=None, ge=1, le=20)
    sim_type: Optional[Literal["esim", "psim"]] = None
    device: Optional[BudgetwiseDevice] = None
