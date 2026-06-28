from fastapi import APIRouter, Depends, HTTPException
from app.models.common import ApiResponse
from app.repositories import permission_repo, user_repo
from app.middleware.auth_middleware import get_current_user, require_role
from pydantic import BaseModel

router = APIRouter(prefix="/permissions", tags=["System & Settings"])

class PermissionSet(BaseModel):
    user_id: int
    module: str
    level: int # 0-5

@router.get("/{user_id}", response_model=ApiResponse, summary="Get all module permissions for a user")
def get_user_permissions(user_id: int, user: dict = Depends(get_current_user)):
    perms = permission_repo.get_user_permissions(user_id)
    return ApiResponse(ok=True, data=perms)

@router.post("", response_model=ApiResponse, summary="Set user permission level for a module")
def set_user_permission(payload: PermissionSet, user: dict = Depends(require_role(["owner"]))):
    if not user_repo.get_by_id(payload.user_id):
        raise HTTPException(status_code=404, detail="User not found")
    permission_repo.set_permission(payload.user_id, payload.module, payload.level)
    return ApiResponse(ok=True, data={"success": True})
