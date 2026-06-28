from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.common import ApiResponse
from app.repositories import financial_voucher_repo
from app.middleware.auth_middleware import get_current_user, require_role
from pydantic import BaseModel

class VoucherCreate(BaseModel):
    type: str # 'opening_balance', 'discount_earned', 'discount_allowed'
    entity_type: str # 'customer', 'supplier'
    entity_id: int
    amount: float
    date: str
    notes: str = ""

router = APIRouter(prefix="/vouchers", tags=["Accounting / Vouchers"])

@router.post("", response_model=ApiResponse, summary="Create an accounting/settlement voucher")
def create_voucher(payload: VoucherCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    vid = financial_voucher_repo.create_voucher(payload.model_dump())
    return ApiResponse(ok=True, data={"id": vid})

@router.get("", response_model=ApiResponse, summary="List settlement vouchers")
def list_vouchers(
    entity_type: str = None,
    entity_id: int = None,
    user: dict = Depends(get_current_user)
):
    items = financial_voucher_repo.get_list(entity_type, entity_id)
    return ApiResponse(ok=True, data=items)
