"""Global Search router — cross-entity keyword search."""
from fastapi import APIRouter, Depends, Query
from app.models.common import ApiResponse
from app.database.connection import get_connection
from app.middleware.auth_middleware import get_current_user
from app.utils.helpers import rows_to_list

router = APIRouter(prefix="/search", tags=["System & Settings"])


@router.get("", response_model=ApiResponse, summary="Global search across products, customers, suppliers, invoices")
def global_search(
    q: str = Query(..., min_length=1, description="Search keyword"),
    limit: int = Query(10, ge=1, le=50),
    user: dict = Depends(get_current_user),
):
    conn = get_connection()
    keyword = f"%{q}%"

    products = rows_to_list(conn.execute(
        "SELECT id, name, sku, barcode, price, stock_qty FROM products WHERE is_active=1 AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?) LIMIT ?",
        (keyword, keyword, keyword, limit),
    ).fetchall())

    customers = rows_to_list(conn.execute(
        "SELECT id, name, code, phone, balance FROM customers WHERE is_active=1 AND (name LIKE ? OR code LIKE ? OR phone LIKE ?) LIMIT ?",
        (keyword, keyword, keyword, limit),
    ).fetchall())

    suppliers = rows_to_list(conn.execute(
        "SELECT id, name, code, phone FROM suppliers WHERE is_active=1 AND (name LIKE ? OR code LIKE ? OR phone LIKE ?) LIMIT ?",
        (keyword, keyword, keyword, limit),
    ).fetchall())

    invoices = rows_to_list(conn.execute(
        "SELECT id, created_at, net_total, payment_method FROM invoices WHERE is_void=0 AND CAST(id AS TEXT) LIKE ? LIMIT ?",
        (keyword, limit),
    ).fetchall())

    return ApiResponse(ok=True, data={
        "products": products,
        "customers": customers,
        "suppliers": suppliers,
        "invoices": invoices,
        "total_results": len(products) + len(customers) + len(suppliers) + len(invoices),
    })
