"""Returns router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.returns import CreateReturnRequest
from app.models.common import ApiResponse
from app.repositories import returns_repo, invoice_repo, product_repo, stock_movement_repo, ops_log_repo, customer_repo
from app.middleware.auth_middleware import get_current_user, require_role
from app.utils.helpers import paginate, pagination_meta

router = APIRouter(prefix="/returns", tags=["Invoices / Sales"])


@router.post("", response_model=ApiResponse, summary="Create a return")
def create_return(
    payload: CreateReturnRequest,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    # Validate invoice
    inv = invoice_repo.get_by_id(payload.invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv["is_void"]:
        raise HTTPException(status_code=400, detail="Cannot return a voided invoice")

    # Check eligible quantities
    eligible = returns_repo.get_eligible_items(payload.invoice_id)
    eligible_map = {e["product_id"]: e for e in eligible}

    return_items = []
    total_refund = 0.0
    for item in payload.items:
        elig = eligible_map.get(item.product_id)
        if not elig:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not in this invoice")
        available = elig["sold_qty"] - elig["already_returned"]
        if item.qty > available:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot return {item.qty} of product {item.product_id}. Available: {available}",
            )
        # Calculate proportional refund based on original discounts
        # unit_price in elig is original unit_price (gross). 
        # But we need net_unit_price (after item discount).
        original_net_line = elig.get("net_line_total", elig["unit_price"] * elig["sold_qty"])
        net_unit_price = original_net_line / elig["sold_qty"] if elig["sold_qty"] > 0 else elig["unit_price"]
        
        line_total = item.qty * net_unit_price
        total_refund += line_total
        return_items.append({
            "product_id": item.product_id,
            "qty": item.qty,
            "unit_price": elig["unit_price"], # Keep original gross price for reference
            "net_unit_price": round(net_unit_price, 2),
            "line_total": round(line_total, 2),
        })

    return_data = {
        "original_invoice_id": payload.invoice_id,
        "customer_id": inv.get("customer_id"),
        "user_id": user["user_id"],
        "refund_method": payload.refund_method,
        "refund_amount": round(total_refund, 2),
        "notes": payload.notes,
        "branch_id": user.get("branch_id", 1),
        "items": return_items,
    }
    return_id = returns_repo.create_return(return_data)
    
    # ACCT-06: Update customer debt balance if it's a credit invoice
    if inv.get("payment_method") == "credit":
        customer_repo.update_balance(inv["customer_id"], -total_refund)


    ops_log_repo.log_event(
        branch_id=user.get("branch_id", 1),
        user_id=user["user_id"],
        role=user["role"],
        event_type="create_return",
        entity_type="return",
        entity_id=return_id,
        payload={"refund_amount": round(total_refund, 2)},
    )

    return ApiResponse(ok=True, data={
        "success": True,
        "return_id": return_id,
        "refund_amount": round(total_refund, 2),
    })


@router.get("", response_model=ApiResponse, summary="List returns")
def list_returns(
    date_from: str = None,
    date_to: str = None,
    customer_id: int = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    items, total = returns_repo.get_list(date_from, date_to, customer_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})


@router.get("/summary", response_model=ApiResponse, summary="Returns summary")
def returns_summary(
    date_from: str = None,
    date_to: str = None,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = returns_repo.get_summary(date_from, date_to)
    return ApiResponse(ok=True, data=data)


@router.get("/invoice/{invoice_id}/eligible", response_model=ApiResponse, summary="Eligible return items")
def eligible_items(invoice_id: int, user: dict = Depends(get_current_user)):
    inv = invoice_repo.get_by_id(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    eligible = returns_repo.get_eligible_items(invoice_id)
    for e in eligible:
        e["available_qty"] = e["sold_qty"] - e["already_returned"]
    return ApiResponse(ok=True, data=eligible)


@router.get("/{return_id}", response_model=ApiResponse, summary="Get return details")
def get_return(return_id: int, user: dict = Depends(get_current_user)):
    ret = returns_repo.get_by_id(return_id)
    if not ret:
        raise HTTPException(status_code=404, detail="Return not found")
    ret["items"] = returns_repo.get_items(return_id)
    return ApiResponse(ok=True, data=ret)
