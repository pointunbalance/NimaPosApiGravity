"""Capital / Financial Center router."""
from fastapi import APIRouter, Depends
from app.repositories import capital_repo
from app.middleware.auth_middleware import get_current_user, require_role
from pydantic import BaseModel

router = APIRouter(tags=["Internal Accounts / Safes"])


class CapitalUpdate(BaseModel):
    amount: float


@router.get("/capital/summary")
def financial_summary(user=Depends(get_current_user)):
    """Get full financial center dashboard data."""
    return {"ok": True, "data": capital_repo.get_financial_summary()}


@router.put("/capital")
def update_capital(body: CapitalUpdate, user=Depends(require_role(["owner", "admin"]))):
    """Update initial capital amount."""
    result = capital_repo.update_initial_capital(body.amount)
    return {"ok": True, "data": {"initial_capital": result}}


@router.get("/capital/cash-flow")
def cash_flow_trend(days: int = 14, user=Depends(get_current_user)):
    """Cash flow trend per day."""
    return {"ok": True, "data": capital_repo.get_cash_flow_trend(days)}


@router.get("/capital/supplier-debts")
def supplier_debts(user=Depends(get_current_user)):
    """List suppliers with outstanding balances."""
    return {"ok": True, "data": capital_repo.get_supplier_debts()}
