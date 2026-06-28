"""Quotations router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.quotation import QuotationCreate, QuotationUpdate
from app.models.common import ApiResponse
from app.repositories import quotation_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(prefix="/quotations", tags=["Invoices / Sales"])

@router.get("", response_model=ApiResponse, summary="List quotations")
def list_quotations(status: str = None, customer_id: int = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = quotation_repo.get_all(status, customer_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.get("/{q_id}", response_model=ApiResponse, summary="Get quotation")
def get_quotation(q_id: int, user: dict = Depends(get_current_user)):
    q = quotation_repo.get_by_id(q_id)
    if not q: raise HTTPException(404, "Quotation not found")
    return ApiResponse(ok=True, data=q)

@router.post("/{q_id}/convert", response_model=ApiResponse, summary="Convert Quotation to Invoice", tags=["Invoices / Sales"])
def convert_quotation(q_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    invoice_id = quotation_repo.convert_to_invoice(q_id)
    if not invoice_id:
        raise HTTPException(status_code=400, detail="Quotation not found or already converted")
    return ApiResponse(ok=True, data={"invoice_id": invoice_id})

@router.post("", response_model=ApiResponse, summary="Create quotation")
def create_quotation(payload: QuotationCreate, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    q_id = quotation_repo.create(payload.model_dump())
    return ApiResponse(ok=True, data=quotation_repo.get_by_id(q_id))

@router.put("/{q_id}", response_model=ApiResponse, summary="Update quotation")
def update_quotation(q_id: int, payload: QuotationUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    if not quotation_repo.get_by_id(q_id): raise HTTPException(404, "Quotation not found")
    quotation_repo.update(q_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(ok=True, data=quotation_repo.get_by_id(q_id))

@router.delete("/{q_id}", response_model=ApiResponse, summary="Delete quotation")
def delete_quotation(q_id: int, user: dict = Depends(require_role(["owner"]))):
    if not quotation_repo.get_by_id(q_id): raise HTTPException(404, "Quotation not found")
    quotation_repo.delete(q_id)
    return ApiResponse(ok=True, data={"message": "Quotation deleted"})
