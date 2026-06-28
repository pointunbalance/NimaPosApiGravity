from fastapi import APIRouter, Depends, Query
from app.database.connection import get_connection
from app.middleware.auth_middleware import require_role
from app.models.common import ApiResponse
from app.repositories import accounting_repo

router = APIRouter(prefix="/arap", tags=["Elite Finance"])

@router.get("/aging", dependencies=[Depends(require_role(["owner", "admin"]))])
def get_aging_report(party_type: str = Query(..., pattern="^(customer|supplier)$")):
    if party_type == "customer":
        return ApiResponse(ok=True, data=accounting_repo.get_receivables_aging())
    return ApiResponse(ok=True, data=accounting_repo.get_payables_aging())

@router.get("/matching", dependencies=[Depends(require_role(["owner", "admin"]))])
def get_po_grn_matching():
    with get_connection() as conn:
        cursor = conn.cursor()
        # PO vs Received Total (Simple matching)
        cursor.execute("""
            SELECT
                po.po_number,
                po.total_amount as ordered_total,
                COALESCE(p.total_amount, 0) as matched_total,
                (po.total_amount - COALESCE(p.total_amount, 0)) as variance,
                po.status
            FROM purchase_orders po
            LEFT JOIN purchases p ON p.id = po.purchase_id
            WHERE po.status IN ('submitted', 'received', 'completed')
        """)
        return ApiResponse(ok=True, data=[dict(row) for row in cursor.fetchall()])
