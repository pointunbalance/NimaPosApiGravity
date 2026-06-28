"""Users management router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.common import ApiResponse
from app.repositories import user_repo, ops_log_repo
from app.middleware.auth_middleware import require_role, get_current_user
from app.utils.helpers import paginate, pagination_meta
from app.utils.security import hash_pin
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/users", tags=["System & Settings"])


class UserCreate(BaseModel):
    username: str
    pin: str
    role: str = "cashier"
    full_name: Optional[str] = ""
    phone: Optional[str] = ""


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[int] = None


@router.get("", response_model=ApiResponse, summary="List all users")
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_role(["manager", "owner"])),
):
    offset, limit, page = paginate(page, limit)
    items, total = user_repo.get_all(offset=offset, limit=limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/{user_id}", response_model=ApiResponse, summary="Get user details")
def get_user(user_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    u = user_repo.get_by_id(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    # Remove sensitive fields
    u.pop("pin_hash", None)
    u.pop("pin_salt", None)
    return ApiResponse(ok=True, data=u)


@router.post("", response_model=ApiResponse, summary="Create new user")
def create_user(payload: UserCreate, user: dict = Depends(require_role(["owner"]))):
    # Check duplicate username
    existing = user_repo.find_by_username(payload.username)
    if existing:
        raise HTTPException(status_code=409, detail=f"Username '{payload.username}' already exists")
    pin_hash, pin_salt = hash_pin(payload.pin)
    user_id = user_repo.create({
        "username": payload.username,
        "pin_hash": pin_hash,
        "pin_salt": pin_salt,
        "role": payload.role,
        "full_name": payload.full_name,
        "phone": payload.phone,
    })
    return ApiResponse(ok=True, data={"user_id": user_id, "username": payload.username})


@router.put("/{user_id}", response_model=ApiResponse, summary="Update user")
def update_user(user_id: int, payload: UserUpdate, user: dict = Depends(require_role(["owner"]))):
    u = user_repo.get_by_id(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    user_repo.update(user_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data={"message": "User updated"})


@router.delete("/{user_id}", response_model=ApiResponse, summary="Deactivate user")
def deactivate_user(user_id: int, user: dict = Depends(require_role(["owner"]))):
    u = user_repo.get_by_id(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.get("id") == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user_repo.deactivate(user_id)
    return ApiResponse(ok=True, data={"message": "User deactivated"})


@router.put("/{user_id}/reset-pin", response_model=ApiResponse, summary="Reset user PIN")
def reset_pin(user_id: int, new_pin: str = Query(..., min_length=4), user: dict = Depends(require_role(["owner"]))):
    u = user_repo.get_by_id(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    pin_hash, pin_salt = hash_pin(new_pin)
    user_repo.update_pin(user_id, pin_hash, pin_salt)
    return ApiResponse(ok=True, data={"message": "PIN reset successfully"})


@router.get("/{user_id}/activity-log", response_model=ApiResponse, summary="User activity log")
def user_activity(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_role(["manager", "owner"])),
):
    offset, limit, page = paginate(page, limit)
    items, total = ops_log_repo.get_user_log(user_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})
