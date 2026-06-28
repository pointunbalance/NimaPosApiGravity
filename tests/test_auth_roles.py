from fastapi import HTTPException

from app.middleware.auth_middleware import require_role


def test_admin_role_satisfies_owner_routes():
    checker = require_role(["owner"])

    user = checker({"role": "admin", "username": "system-admin"})

    assert user["role"] == "admin"


def test_admin_role_satisfies_manager_routes():
    checker = require_role(["manager", "owner"])

    user = checker({"role": "admin", "username": "system-admin"})

    assert user["role"] == "admin"


def test_cashier_role_still_blocked_from_owner_routes():
    checker = require_role(["owner"])

    try:
        checker({"role": "cashier", "username": "cashier"})
    except HTTPException as exc:
        assert exc.status_code == 403
    else:
        raise AssertionError("cashier should not satisfy owner-only routes")
