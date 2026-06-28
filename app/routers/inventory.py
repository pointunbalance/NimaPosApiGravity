"""Inventory router — Stock adjustment, movements, summary."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.inventory import StockAdjustRequest
from app.models.common import ApiResponse
from app.repositories import product_repo, stock_movement_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta
from app.config import LOW_STOCK_THRESHOLD

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.post("/adjust", response_model=ApiResponse, summary="Adjust stock")
def adjust_stock(
    payload: StockAdjustRequest,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    product = product_repo.get_by_id(payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product_repo.update_stock(payload.product_id, payload.qty_delta)
    stock_movement_repo.create_movement(
        product_id=payload.product_id,
        movement_type="adjustment",
        qty_delta=payload.qty_delta,
        reference_type="manual",
        user_id=user.get("user_id"),
        branch_id=user.get("branch_id", 1),
        notes=payload.notes,
    )
    updated = product_repo.get_by_id(payload.product_id)
    return ApiResponse(ok=True, data={
        "product_id": payload.product_id,
        "qty_delta": payload.qty_delta,
        "new_stock_qty": updated["stock_qty"],
    })


@router.get("/movements", response_model=ApiResponse, summary="List stock movements")
def list_movements(
    date_from: str = None,
    date_to: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    items, total = stock_movement_repo.get_all(date_from, date_to, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/movements/{product_id}", response_model=ApiResponse, summary="Product movements")
def product_movements(
    product_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    items, total = stock_movement_repo.get_by_product(product_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/low-stock", response_model=ApiResponse, summary="Low stock alert")
def low_stock(
    threshold: int = Query(LOW_STOCK_THRESHOLD, ge=1),
    user: dict = Depends(get_current_user),
):
    items = product_repo.get_low_stock(threshold)
    return ApiResponse(ok=True, data=items)


@router.get("/summary", response_model=ApiResponse, summary="Inventory summary")
def summary(user: dict = Depends(get_current_user)):
    from app.database.connection import get_connection
    conn = get_connection()
    row = conn.execute(
        "SELECT COUNT(*) as total_products, "
        "COALESCE(SUM(price * stock_qty), 0) as total_stock_value "
        "FROM products WHERE is_active = 1"
    ).fetchone()
    low = conn.execute(
        "SELECT COUNT(*) FROM products WHERE is_active = 1 AND stock_qty < ?",
        (LOW_STOCK_THRESHOLD,),
    ).fetchone()[0]
    return ApiResponse(ok=True, data={
        "total_products": row[0],
        "total_stock_value": round(row[1], 2),
        "low_stock_count": low,
    })
