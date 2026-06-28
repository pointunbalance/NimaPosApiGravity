"""Cheque Management router — lifecycle of financial papers."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.common import ApiResponse
from app.repositories import cheque_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/cheques", tags=["Accounting / Clearing"])

@router.get("", response_model=ApiResponse, summary="List cheques")
def list_cheques(
    type: str = Query(None, description="'payable' or 'receivable'"),
    status: str = Query(None, description="'pending', 'collected', etc."),
    user: dict = Depends(require_role(["manager", "owner"]))
):
    return ApiResponse(ok=True, data=cheque_repo.list_cheques(type, status))

@router.post("", response_model=ApiResponse, summary="Record new cheque")
def create_cheque(payload: dict, user: dict = Depends(require_role(["manager", "owner"]))):
    cheque_id = cheque_repo.create_cheque(payload)
    return ApiResponse(ok=True, data=cheque_repo.get_cheque(cheque_id))

@router.put("/{cheque_id}", response_model=ApiResponse, summary="Update cheque status/details")
def update_cheque(cheque_id: int, payload: dict, user: dict = Depends(require_role(["manager", "owner"]))):
    cheque_repo.update_cheque(cheque_id, payload)
    return ApiResponse(ok=True, data=cheque_repo.get_cheque(cheque_id))

@router.get("/reports/overdue", response_model=ApiResponse, summary="Get overdue pending cheques")
def get_overdue(user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=cheque_repo.get_overdue())
