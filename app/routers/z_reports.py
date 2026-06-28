"""Z-Reports router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.models.common import ApiResponse
from app.repositories import z_report_repo, reports_repo
from app.middleware.auth_middleware import require_role, get_current_user
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(prefix="/z-reports", tags=["Reports"])


class CloseZRequest(BaseModel):
    business_date: str
    notes: Optional[str] = ""


@router.post("/close", response_model=ApiResponse, summary="Close business day")
def close_day(payload: CloseZRequest, user: dict = Depends(require_role(["manager", "owner"]))):
    existing = z_report_repo.get_by_date(payload.business_date)
    if existing:
        raise HTTPException(status_code=409, detail=f"Z-report already exists for {payload.business_date}")
    summary = reports_repo.sales_summary(payload.business_date, payload.business_date)
    trading = reports_repo.get_trading_summary(payload.business_date, payload.business_date)
    
    # Get Return Count and Expense Count
    from app.database.connection import get_connection
    conn = get_connection()
    ret_count = conn.execute("SELECT COUNT(*) FROM returns WHERE date(created_at) = ?", (payload.business_date,)).fetchone()[0]
    exp_count = conn.execute("SELECT COUNT(*) FROM expenses WHERE date = ?", (payload.business_date,)).fetchone()[0]

    z_data = {
        "business_date": payload.business_date,
        "from_ts": f"{payload.business_date} 00:00:00",
        "to_ts": f"{payload.business_date} 23:59:59",
        "invoices_count": summary.get("invoices_count", 0),
        "gross_sales": summary.get("gross_sales", 0),
        "subtotal_sum": summary.get("subtotal_sum", 0),
        "tax_sum": summary.get("tax_sum", 0),
        "returns_count": ret_count,
        "returns_total": trading["revenue"]["returns"],
        "expenses_count": exp_count,
        "expenses_total": trading["costs"]["expenses"],
        "net_profit": trading["net_trading_profit"],
        "notes": payload.notes,
        "branch_id": user.get("branch_id", 1),
    }
    z_id = z_report_repo.create_z_report(z_data)
    return ApiResponse(ok=True, data={
        "success": True, 
        "z_id": z_id, 
        "business_date": payload.business_date, 
        "net_profit": round(trading["net_trading_profit"], 2)
    })


@router.get("", response_model=ApiResponse, summary="List Z-reports")
def list_z_reports(page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = z_report_repo.get_list(offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/{date}", response_model=ApiResponse, summary="Get Z-report by date")
def get_z_report(date: str, user: dict = Depends(get_current_user)):
    z = z_report_repo.get_by_date(date)
    if not z:
        raise HTTPException(status_code=404, detail=f"No Z-report for {date}")
    return ApiResponse(ok=True, data=z)
