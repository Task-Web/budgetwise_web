import pytest


@pytest.mark.asyncio
async def test_session_and_cart_preserve_legacy_fixture_fields(async_client):
    cookie = "budgetwise-api-cart"
    legacy_mint = {
        "view": "individual",
        "cartItems": [],
        "family": {"lines": 1, "simTypes": [""]},
    }
    seeded = {
        "examples": {"fixture": True},
        "uploads": [],
        "mint": legacy_mint,
        "evaluator_marker": {"keep": True},
        "developer_tools_open": False,
    }
    await async_client.put(
        "/api/state", params={"cookie": cookie}, json={"data": seeded}
    )

    session = await async_client.get(
        "/api/budgetwise/session", params={"cookie": cookie}
    )
    assert session.status_code == 200
    assert set(session.json()) == {"user_id", "session"}
    assert "evaluator_marker" not in session.json()["session"]

    created = await async_client.post(
        "/api/budgetwise/cart/plans",
        params={"cookie": cookie},
        json={"plan_id": "15gb", "term": "6", "sim_type": "psim"},
    )
    assert created.status_code == 200
    item = created.json()["item"]
    assert item["id"].startswith("cart-")
    assert item["quantity"] == 1
    assert item["device"] is None

    state = (
        await async_client.get("/api/state", params={"cookie": cookie})
    ).json()["state"]["data"]
    assert state["mint"] == legacy_mint
    assert state["evaluator_marker"] == {"keep": True}
    assert state["developer_tools_open"] is False
    assert state["budgetwise"]["cartItems"] == [item]


@pytest.mark.asyncio
async def test_cart_rejects_arbitrary_internal_and_invalid_fields(async_client):
    cookie = "budgetwise-api-validation"
    valid = {"plan_id": "15gb", "term": "6", "sim_type": "psim"}

    for field in ("arbitrary_state", "developer_tools_open", "cartItems"):
        response = await async_client.post(
            "/api/budgetwise/cart/plans",
            params={"cookie": cookie},
            json={**valid, field: True},
        )
        assert response.status_code == 422

    invalid_plan = await async_client.post(
        "/api/budgetwise/cart/plans",
        params={"cookie": cookie},
        json={**valid, "plan_id": "arbitrary"},
    )
    assert invalid_plan.status_code == 422

    missing_item = await async_client.patch(
        "/api/budgetwise/cart/items/missing",
        params={"cookie": cookie},
        json={"quantity": 2},
    )
    assert missing_item.status_code == 404


@pytest.mark.asyncio
async def test_promo_checkout_transition_and_cookie_isolation(async_client):
    first_cookie = "budgetwise-api-first"
    second_cookie = "budgetwise-api-second"

    empty_checkout = await async_client.post(
        "/api/budgetwise/cart/checkout", params={"cookie": first_cookie}
    )
    assert empty_checkout.status_code == 409

    added = await async_client.post(
        "/api/budgetwise/cart/plans",
        params={"cookie": first_cookie},
        json={"plan_id": "unlimited", "term": "3", "sim_type": "psim"},
    )
    assert added.status_code == 200

    promo = await async_client.post(
        "/api/budgetwise/promo/apply",
        params={"cookie": first_cookie},
        json={"code": "budgetwise"},
    )
    assert promo.status_code == 200
    assert promo.json()["promo"]["applied"] is True
    assert promo.json()["promo"]["discount"] == 5

    other_session = (
        await async_client.get(
            "/api/budgetwise/session", params={"cookie": second_cookie}
        )
    ).json()["session"]
    assert other_session["cartItems"] == []

    checkout = await async_client.post(
        "/api/budgetwise/cart/checkout", params={"cookie": first_cookie}
    )
    assert checkout.status_code == 200

    state = (
        await async_client.get("/api/state", params={"cookie": first_cookie})
    ).json()["state"]["data"]
    assert state["budgetwise"]["cartItems"] == []
    assert state["budgetwise"]["promo"]["applied"] is True


@pytest.mark.asyncio
async def test_control_plane_is_hidden_from_public_openapi(async_client):
    schema = (await async_client.get("/api/openapi.json")).json()
    assert "/api/state" not in schema["paths"]
    assert all(tag.get("name") != "state" for tag in schema.get("tags", []))
