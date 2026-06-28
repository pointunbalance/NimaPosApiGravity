from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.common import ApiResponse
from app.repositories import return_reasons_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/return-reasons", tags=["Inventory"])

@router.get("", response_model=ApiResponse, summary="List return reasons")
def list_reasons(type: str = Query(None, description="Filter by type: customer, supplier, both")):
    reasons = return_reasons_repo.get_all(type)
    return ApiResponse(ok=True, data=reasons)

@router.post("", response_model=ApiResponse, summary="Create a new return reason")
def create_reason(
    reason_text: str,
    type: str = "both",
    user: dict = Depends(require_role(["manager", "owner"]))
):
    reason_id = return_reasons_repo.create(reason_text, type)
    return ApiResponse(ok=True, data={"id": reason_id})

@router.delete("/{reason_id}", response_model=ApiResponse, summary="Delete a return reason")
def delete_reason(reason_id: int, user: dict = Depends(require_role(["owner"]))):
    return_reasons_repo.delete(reason_id)
    return ApiResponse(ok=True, data={"success": True})
