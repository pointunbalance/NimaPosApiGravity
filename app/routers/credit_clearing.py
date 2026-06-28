from fastapi import APIRouter, Depends, HTTPException
from app.models.credit_clearing import CreditClearingCreate, CreditClearingOut
from app.models.common import ApiResponse
from app.repositories import credit_clearing_repo, invoice_repo, returns_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/credit-clearing", tags=["Accounting / Clearing"])

@router.post("", response_model=ApiResponse, summary="Settle an invoice using a return credit record")
def settle_invoice_with_return(
    payload: CreditClearingCreate,
    user: dict = Depends(require_role(["manager", "owner"]))
):
    # Verify both exist
    inv = invoice_repo.get_by_id(payload.invoice_id)
    ret = returns_repo.get_by_id(payload.return_id)
    
    if not inv or not ret:
        raise HTTPException(status_code=404, detail="Invoice or Return record not found")
        
    # Check if amount is valid (cannot clear more than return total or invoice pending)
    # Simple check for now
    if payload.amount > ret["refund_amount"]:
        raise HTTPException(status_code=400, detail="Clearing amount exceeds return credit")
        
    clearing_id = credit_clearing_repo.create_clearing(payload.model_dump())
    return ApiResponse(ok=True, data={"clearing_id": clearing_id})

@router.get("/invoice/{invoice_id}", response_model=ApiResponse, summary="Get clearing records for an invoice")
def get_invoice_clearings(invoice_id: int, user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=credit_clearing_repo.get_by_invoice(invoice_id))
