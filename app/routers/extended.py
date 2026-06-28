"""Shifts and Stock Adjustments routers."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.shift import ShiftOpen, ShiftClose, StockAdjustmentCreate
from app.models.common import ApiResponse
from app.repositories import extended_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(tags=["Invoices / Sales"])

# ═══════ SHIFTS ═══════
@router.post("/shifts/open", response_model=ApiResponse, summary="Open a shift", tags=["Invoices / Sales"])
def open_shift(payload: ShiftOpen, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    existing = extended_repo.get_open_shift(payload.branch_id)
    if existing: raise HTTPException(409, "A shift is already open")
    s_id = extended_repo.open_shift(payload.start_cash, payload.user_id or user["user_id"], payload.branch_id)
    return ApiResponse(ok=True, data=extended_repo.get_shift(s_id))

@router.post("/shifts/{shift_id}/close", response_model=ApiResponse, summary="Close a shift", tags=["Invoices / Sales"])
def close_shift(shift_id: int, payload: ShiftClose, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    shift = extended_repo.get_shift(shift_id)
    if not shift: raise HTTPException(404, "Shift not found")
    if shift["status"] == "closed": raise HTTPException(400, "Shift already closed")
    extended_repo.close_shift(shift_id, payload.actual_cash, payload.notes)
    return ApiResponse(ok=True, data=extended_repo.get_shift(shift_id))

@router.get("/shifts", response_model=ApiResponse, summary="List shifts", tags=["Invoices / Sales"])
def list_shifts(status: str = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = extended_repo.list_shifts(status, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

@router.get("/shifts/current", response_model=ApiResponse, summary="Get current open shift", tags=["Invoices / Sales"])
def current_shift(branch_id: int = 1, user: dict = Depends(get_current_user)):
    shift = extended_repo.get_open_shift(branch_id)
    return ApiResponse(ok=True, data=shift)

# ═══════ STOCK ADJUSTMENTS ═══════
@router.post("/stock-adjustments", response_model=ApiResponse, summary="Create stock adjustment", tags=["Stock Adjustments"])
def create_adjustment(payload: StockAdjustmentCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    from app.repositories import product_repo, stock_movement_repo
    product = product_repo.get_by_id(payload.product_id)
    if not product: raise HTTPException(404, "Product not found")
    adj_id = extended_repo.create_adjustment(payload.model_dump())
    delta = payload.quantity if payload.type == "increase" else -payload.quantity
    product_repo.update_stock(payload.product_id, delta)
    stock_movement_repo.create_movement(payload.product_id, "adjustment", delta, "stock_adjustment", adj_id, user.get("user_id"), notes=payload.notes)
    return ApiResponse(ok=True, data={"id": adj_id, "product_id": payload.product_id, "delta": delta})

@router.get("/stock-adjustments", response_model=ApiResponse, summary="List adjustments", tags=["Stock Adjustments"])
def list_adjustments(product_id: int = None, date_from: str = None, date_to: str = None, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    offset, limit, page = paginate(page, limit)
    items, total = extended_repo.list_adjustments(product_id, date_from, date_to, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})

