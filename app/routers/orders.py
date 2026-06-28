"""Orders / Fulfillment / Kitchen router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.order import OrderStatusUpdate, OrderFilter, PartialRefundItem
from app.models.common import ApiResponse
from app.repositories import order_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(tags=["Orders"])


# ─── Full Order List ───
@router.get("/orders", response_model=ApiResponse, summary="List and filter all orders")
def list_orders(
    order_type: str = None,
    fulfillment_status: str = None,
    customer_id: int = None,
    date_from: str = None,
    date_to: str = None,
    is_void: int = 0,
    page: int = 1,
    limit: int = 50,
    user=Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    rows, total = order_repo.list_orders(
        order_type=order_type, fulfillment_status=fulfillment_status,
        customer_id=customer_id, date_from=date_from, date_to=date_to,
        is_void=is_void, offset=offset, limit=limit,
    )
    return ApiResponse(ok=True, data={"items": rows, "pagination": pagination_meta(total, page, limit)})


# ─── Get Order Detail ───
@router.get("/orders/{order_id}", response_model=ApiResponse, summary="Get complete order details")
def get_order(order_id: int, user=Depends(get_current_user)):
    order, items = order_repo.get_order(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    order["items"] = items
    return ApiResponse(ok=True, data=order)


# ─── Order Statistics ───
@router.get("/orders/stats/summary", response_model=ApiResponse, summary="Retrieve order statistics")
def order_stats(date_from: str = None, date_to: str = None, user=Depends(get_current_user)):
    return ApiResponse(ok=True, data=order_repo.get_order_stats(date_from, date_to))


# ─── Update Fulfillment Status ───
@router.put("/orders/{order_id}/fulfillment", response_model=ApiResponse, summary="Update order fulfillment status")
def update_fulfillment(order_id: int, body: OrderStatusUpdate, user=Depends(get_current_user)):
    if body.fulfillment_status not in ("pending", "ready", "served"):
        raise HTTPException(400, "Invalid status. Must be: pending, ready, served")
    result = order_repo.update_fulfillment_status(order_id, body.fulfillment_status)
    if not result:
        raise HTTPException(404, "Order not found")
    return ApiResponse(ok=True, data=result)


# ─── Kitchen Display ───
@router.get("/kitchen", response_model=ApiResponse, summary="Fetch active orders for Kitchen Display System (KDS)")
def kitchen_display(user=Depends(get_current_user)):
    """Get all pending + ready orders for kitchen display."""
    orders = order_repo.get_kitchen_orders()
    pending = [o for o in orders if o.get("fulfillment_status") == "pending"]
    ready = [o for o in orders if o.get("fulfillment_status") == "ready"]
    return ApiResponse(ok=True, data={"pending": pending, "ready": ready})


# ─── Partial Refund ───
@router.post("/orders/{order_id}/partial-refund", response_model=ApiResponse, summary="Issue a partial refund for specific items")
def partial_refund(order_id: int, items: list[PartialRefundItem], user=Depends(get_current_user)):
    items_dicts = [i.model_dump() for i in items]
    result = order_repo.create_partial_refund(
        order_id, items_dicts,
        user_id=user["user_id"], user_name=user.get("username", ""),
    )
    return ApiResponse(ok=True, data=result)
