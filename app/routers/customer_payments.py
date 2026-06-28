"""Customer Payments router — manage debt payments and balance tracking."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.common import ApiResponse
from app.repositories import customer_payment_repo, customer_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/customer-payments", tags=["Customers / CRM"])


class PaymentCreate(BaseModel):
    customer_id: int
    amount: float
    date: Optional[str] = None
    type: str = "debt_payment"
    note: Optional[str] = ""


@router.get("/{customer_id}", response_model=ApiResponse, summary="List customer payments")
def list_payments(
    customer_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    if not customer_repo.get_by_id(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    offset, limit, page = paginate(page, limit)
    items, total = customer_payment_repo.list_payments(customer_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.post("", response_model=ApiResponse, summary="Record a customer payment")
def create_payment(payload: PaymentCreate, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    if not customer_repo.get_by_id(payload.customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    data = payload.model_dump()
    data["recorded_by"] = user.get("username", "")
    payment_id = customer_payment_repo.create_payment(data)
    return ApiResponse(ok=True, data={"payment_id": payment_id, "message": "Payment recorded"})


@router.get("/{customer_id}/summary", response_model=ApiResponse, summary="Get customer balance summary")
def balance_summary(customer_id: int, user: dict = Depends(get_current_user)):
    summary = customer_payment_repo.get_balance_summary(customer_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Customer not found")
    return ApiResponse(ok=True, data=summary)
