"""Branches router."""
from fastapi import APIRouter, Depends, HTTPException
from app.models.branch import BranchCreate, BranchUpdate
from app.models.common import ApiResponse
from app.repositories import branch_repo
from app.middleware.auth_middleware import require_role, get_current_user

router = APIRouter(prefix="/branches", tags=["Inventory"])


@router.get("", response_model=ApiResponse, summary="List branches")
def list_branches(user: dict = Depends(get_current_user)):
    items = branch_repo.get_all()
    return ApiResponse(ok=True, data=items)


@router.get("/{branch_id}", response_model=ApiResponse, summary="Get branch")
def get_branch(branch_id: int, user: dict = Depends(get_current_user)):
    b = branch_repo.get_by_id(branch_id)
    if not b:
        raise HTTPException(status_code=404, detail="Branch not found")
    return ApiResponse(ok=True, data=b)


@router.post("", response_model=ApiResponse, summary="Create branch")
def create_branch(payload: BranchCreate, user: dict = Depends(require_role(["owner"]))):
    branch_id = branch_repo.create(payload.code, payload.name)
    return ApiResponse(ok=True, data=branch_repo.get_by_id(branch_id))


@router.put("/{branch_id}", response_model=ApiResponse, summary="Update branch")
def update_branch(branch_id: int, payload: BranchUpdate, user: dict = Depends(require_role(["owner"]))):
    if not branch_repo.get_by_id(branch_id):
        raise HTTPException(status_code=404, detail="Branch not found")
    branch_repo.update(branch_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=branch_repo.get_by_id(branch_id))
