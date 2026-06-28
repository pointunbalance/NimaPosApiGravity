"""Payroll processing router."""
from fastapi import APIRouter, Depends, HTTPException
from app.models.payroll import PayrollProcess, PayrollFilter
from app.repositories import payroll_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(tags=["HR & Payroll"])


@router.post("/payroll/process", summary="Process monthly salaries for an employee")
def process_salary(body: PayrollProcess, user=Depends(require_role(["owner", "admin"]))):
    result, error = payroll_repo.process_salary(
        user_id=body.user_id, month=body.month,
        base_salary=body.base_salary, days_worked=body.days_worked,
        bonus=body.bonus, deductions=body.deductions,
        payment_method=body.payment_method, notes=body.notes or "",
    )
    if error:
        raise HTTPException(400, error)
    return {"ok": True, "data": result}


@router.get("/payroll", summary="List payroll records")
def list_payroll(
    month: str = None,
    user_id: int = None,
    page: int = 1,
    limit: int = 50,
    user=Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    rows, total = payroll_repo.list_payroll(month=month, user_id=user_id, offset=offset, limit=limit)
    return {"ok": True, "data": rows, "meta": pagination_meta(total, page, limit)}


@router.get("/payroll/summary/{month}", summary="Get overall payroll summary for a specific month")
def payroll_summary(month: str, user=Depends(get_current_user)):
    return {"ok": True, "data": payroll_repo.get_payroll_summary(month)}
