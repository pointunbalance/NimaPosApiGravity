"""Customers router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.customer import CustomerCreate, CustomerUpdate
from app.models.common import ApiResponse
from app.repositories import customer_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(prefix="/customers", tags=["Customers / CRM"])


@router.get("", response_model=ApiResponse, summary="List customers")
def list_customers(
    search: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    items, total = customer_repo.get_all_active(search=search, offset=offset, limit=limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/export/all", response_model=ApiResponse, summary="Export all customers")
def export_customers(user: dict = Depends(require_role(["manager", "owner"]))):
    data = customer_repo.export_all()
    return ApiResponse(ok=True, data=data)


@router.get("/{customer_id}", response_model=ApiResponse, summary="Get customer")
def get_customer(customer_id: int, user: dict = Depends(get_current_user)):
    c = customer_repo.get_by_id(customer_id)
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return ApiResponse(ok=True, data=c)


@router.get("/{customer_id}/invoices", response_model=ApiResponse, summary="Customer invoices")
def customer_invoices(
    customer_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    items, total = customer_repo.get_invoices(customer_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.post("", response_model=ApiResponse, summary="Create customer")
def create_customer(payload: CustomerCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    customer_id = customer_repo.create(payload.model_dump())
    return ApiResponse(ok=True, data=customer_repo.get_by_id(customer_id))


@router.put("/{customer_id}", response_model=ApiResponse, summary="Update customer")
def update_customer(customer_id: int, payload: CustomerUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not customer_repo.get_by_id(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    customer_repo.update(customer_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=customer_repo.get_by_id(customer_id))


@router.post("/{customer_id}/opening-balance", response_model=ApiResponse, summary="Set opening balance")
def set_opening_balance(customer_id: int, balance: float = Query(...), user: dict = Depends(require_role(["owner"]))):
    if not customer_repo.get_by_id(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    customer_repo.set_opening_balance(customer_id, balance)
    return ApiResponse(ok=True, data=customer_repo.get_by_id(customer_id))


@router.post("/{customer_id}/wallet/topup", response_model=ApiResponse, summary="Top up wallet")
def wallet_topup(customer_id: int, amount: float = Query(..., gt=0), user: dict = Depends(require_role(["manager", "owner"]))):
    from app.repositories import customer_payment_repo
    if not customer_repo.get_by_id(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    customer_payment_repo.create_payment({
        "customer_id": customer_id,
        "amount": amount,
        "type": "wallet_topup",
        "note": "Wallet top-up via API",
        "recorded_by": user.get("username", "system")
    })
    return ApiResponse(ok=True, data=customer_repo.get_by_id(customer_id))


@router.get("/{customer_id}/wallet/history", response_model=ApiResponse, summary="Wallet transaction history")
def wallet_history(customer_id: int, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    if not customer_repo.get_by_id(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    offset, limit, page = paginate(page, limit)
    data = customer_repo.get_wallet_history(customer_id, offset, limit)
    return ApiResponse(ok=True, data=data)


@router.get("/{customer_id}/returns", response_model=ApiResponse, summary="Customer returns")
def customer_returns(customer_id: int, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = customer_repo.get_returns(customer_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/{customer_id}/payments", response_model=ApiResponse, summary="Customer payment history")
def customer_payments(customer_id: int, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    from app.repositories import customer_payment_repo
    offset, limit, page = paginate(page, limit)
    items, total = customer_payment_repo.list_payments(customer_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.delete("/{customer_id}", response_model=ApiResponse, summary="Delete customer")
def delete_customer(customer_id: int, user: dict = Depends(require_role(["owner"]))):
    if not customer_repo.get_by_id(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    customer_repo.soft_delete(customer_id)
    return ApiResponse(ok=True, data={"message": "Customer deleted"})
