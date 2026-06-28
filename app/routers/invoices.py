"""Invoices router — Checkout, Void, List, Detail."""
from fastapi import APIRouter, Depends, HTTPException, Query
import logging
from app.models.invoice import CheckoutRequest, VoidRequest
from app.models.common import ApiResponse
from app.repositories import invoice_repo, product_repo, stock_movement_repo, ops_log_repo, settings_repo, permission_repo, promotions_repo, hardware_repo
from app.middleware.auth_middleware import get_current_user, require_role, require_permission
from app.utils.helpers import paginate, pagination_meta, now_str
from app.utils.barcode_utils import generate_zatca_qr
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/invoices", tags=["Invoices / Sales"])
logger = logging.getLogger(__name__)

class ZatcaQrResponse(BaseModel):
    invoice_id: int
    qr_base64: str

class ExchangeRequest(BaseModel):
    customer_id: int
    user_id: int
    return_data: dict
    sale_data: dict


@router.post("/checkout", summary="🛒 Process a Sale (Checkout)")
def checkout(
    payload: CheckoutRequest,
    user: dict = Depends(require_role(["cashier", "manager", "owner"])),
):
    """Process a sale checkout — creates invoice, deducts stock, logs movements."""
    # --- Preventive Validation (Phase 11) ---
    prevent_negative = settings_repo.get("prevent_negative_stock") == "1"
    
    # --- Advanced Promotion Engine (Phase 26) ---
    active_promos = promotions_repo.get_active_promotions()
    applied_promos = []
    
    # Calculate totals
    subtotal = 0.0
    tax = 0.0
    items_data = []
    for item in payload.items:
        # --- Scale Barcode Resolution (Phase 28) ---
        if item.barcode and not item.product_id:
            parsed = hardware_repo.parse_any_scale_barcode(item.barcode)
            if parsed:
                # Find product by SKU
                p_by_sku = product_repo.get_by_sku(parsed["sku"])
                if p_by_sku:
                    item.product_id = p_by_sku["id"]
                    if parsed.get("quantity"):
                        item.qty = parsed["quantity"]
                    if parsed.get("total_price") and item.unit_price == 0:
                        # If price is embedded and unit_price not set by UI
                        item.unit_price = parsed["total_price"] / item.qty if item.qty > 0 else 0

        # Verify product exists
        product = product_repo.get_by_id(item.product_id)
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
            
        is_virtual = product.get("type") == 'composite' or product.get("is_bundle")
        
        # --- Check Stock Lock ---
        if not is_virtual and product["stock_qty"] < item.qty:
            if prevent_negative:
                 raise HTTPException(
                    status_code=400,
                    detail=f"Sale Blocked: Insufficient stock for '{product['name']}'. (Available: {product['stock_qty']}, Requested: {item.qty})"
                )

        line_total = item.qty * item.unit_price
        # Item-level discount
        item_discount_amount = 0.0
        if item.item_discount_type == "percent":
            item_discount_amount = line_total * (item.item_discount_value / 100)
        elif item.item_discount_type == "fixed":
            item_discount_amount = item.item_discount_value
        net_line = line_total - item_discount_amount
        
        # --- Advanced Tax Calculation (Phase 8/18) ---
        p_tax_rate = item.tax_rate if hasattr(item, "tax_rate") else product.get("tax_rate", 15)
        line_tax = net_line * (p_tax_rate / 100)
        
        subtotal += net_line
        tax += line_tax

        items_data.append({
            "product_id": item.product_id,
            "qty": item.qty,
            "unit_price": item.unit_price,
            "line_total": line_total,
            "item_discount_type": item.item_discount_type,
            "item_discount_value": item.item_discount_value,
            "item_discount_amount": round(item_discount_amount, 2),
            "net_line_total": round(net_line, 2),
            "tax_rate": p_tax_rate,
            "tax_amount": round(line_tax, 2)
        })

    # --- Apply Automatic Promotions (BOGO, etc.) ---
    for promo in active_promos:
        if promo["rule_type"] == "bogo":
            # If buy_product_id is in cart, add get_product_id for free
            buy_count = sum(i["qty"] for i in items_data if i["product_id"] == promo["buy_product_id"])
            if buy_count >= promo["min_qty"]:
                free_qty = (buy_count // promo["min_qty"])
                get_product = product_repo.get_by_id(promo["get_product_id"])
                if get_product:
                    items_data.append({
                        "product_id": promo["get_product_id"],
                        "qty": free_qty,
                        "unit_price": 0, # Free
                        "line_total": 0,
                        "item_discount_type": "fixed",
                        "item_discount_value": 0,
                        "item_discount_amount": 0,
                        "net_line_total": 0,
                        "tax_rate": 0,
                        "tax_amount": 0,
                        "note": f"PROMO: {promo['name']}"
                    })
                    applied_promos.append(promo["name"])
        
        elif promo["rule_type"] == "cart_total" and subtotal >= promo["min_total_amount"]:
            # Automatic cart discount if not already discounted
            if payload.cart_discount_value == 0:
                if promo["discount_percent"] > 0:
                    payload.cart_discount_type = "percent"
                    payload.cart_discount_value = promo["discount_percent"]
                elif promo["discount_amount"] > 0:
                    payload.cart_discount_type = "fixed"
                    payload.cart_discount_value = promo["discount_amount"]
                applied_promos.append(promo["name"])

    # Cart-level discount
    cart_discount_amount = 0.0
    if payload.cart_discount_type == "percent":
        cart_discount_amount = subtotal * (payload.cart_discount_value / 100)
    elif payload.cart_discount_type == "fixed":
        cart_discount_amount = payload.cart_discount_value

    net_total = (subtotal - cart_discount_amount) + tax
    total_paid = sum(p.amount for p in payload.payments)
    change_due = max(0, total_paid - net_total)

    invoice_data = {
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "total": round(net_total, 2),
        "customer_id": payload.customer_id,
        "payments": [p.model_dump() for p in payload.payments],
        "change_due": round(change_due, 2),
        "discount_type": payload.cart_discount_type,
        "discount_value": payload.cart_discount_value,
        "discount_amount": round(cart_discount_amount, 2),
        "net_total": round(net_total, 2),
        "branch_id": user.get("branch_id", 1),
        "notes": payload.notes,
    }

    try:
        invoice_id = invoice_repo.process_checkout(invoice_data, items_data, user_id=user["user_id"])
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    # Audit log
    ops_log_repo.log_event(
        branch_id=user.get("branch_id", 1),
        user_id=user["user_id"],
        role=user["role"],
        event_type="checkout",
        entity_type="invoice",
        entity_id=invoice_id,
        payload={"net_total": round(net_total, 2), "items_count": len(items_data)},
    )
    
    return ApiResponse(ok=True, data={"success": True, "invoice_id": invoice_id})


@router.get("/{invoice_id}/zatca-qr", response_model=ApiResponse, summary="Get ZATCA TLV QR code", tags=["Invoices / Sales"])
def get_zatca_qr(invoice_id: int, user: dict = Depends(get_current_user)):
    invoice = invoice_repo.get_by_id(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # In a real app, these values come from settings and branch details
    seller_name = settings_repo.get("store_name", "My Store")
    tax_number = settings_repo.get("vat_number", "300000000000003")
    
    qr_code = generate_zatca_qr(
        seller_name=seller_name,
        vat_number=tax_number,
        timestamp=invoice["created_at"],
        total=str(invoice.get("net_total", 0)),
        vat_amount=str(invoice.get("tax", 0))
    )
    return ApiResponse(ok=True, data=ZatcaQrResponse(invoice_id=invoice_id, qr_base64=qr_code))

@router.post("/exchange", response_model=ApiResponse[dict], summary="Process Customer Exchange (Makassa)", tags=["Invoices / Sales"])
def process_exchange(payload: ExchangeRequest, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    try:
        data = payload.model_dump()
        # Add user/branch from token
        data["user_id"] = user["user_id"]
        data["branch_id"] = user.get("branch_id", 1)
        
        result = invoice_repo.process_exchange(data)
        return ApiResponse(ok=True, data=result)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Exchange error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal error during exchange processing")


@router.post("/{invoice_id}/unblock", response_model=ApiResponse, summary="Recover stuck invoices", tags=["System & Settings"])
def unblock_invoice(invoice_id: int, user: dict = Depends(require_role(["owner"]))):
    invoice_repo.unlock_invoice(invoice_id)
    return ApiResponse(ok=True, data={"message": f"Invoice {invoice_id} unblocked and verified."})


@router.get("", response_model=ApiResponse, summary="📋 List Invoices")
def list_invoices(
    date_from: str = None,
    date_to: str = None,
    branch_id: int = None,
    customer_id: int = None,
    payment_method: str = None,
    is_void: int = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    offset, limit, page = paginate(page, limit)
    items, total = invoice_repo.get_list(
        date_from, date_to, branch_id, customer_id, payment_method, is_void, offset, limit
    )
    return ApiResponse(ok=True, data={
        "items": items,
        "pagination": pagination_meta(total, page, limit),
    })


@router.get("/summary", response_model=ApiResponse, summary="📊 Invoice Summary (no pagination)")
def invoice_summary(
    date_from: str = None,
    date_to: str = None,
    branch_id: int = None,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = invoice_repo.get_summary(date_from, date_to, branch_id)
    return ApiResponse(ok=True, data=data)


@router.get("/{invoice_id}", response_model=ApiResponse, summary="👁️ Get Invoice Details")
def get_invoice(invoice_id: int, user: dict = Depends(get_current_user)):
    inv = invoice_repo.get_by_id(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv["items"] = invoice_repo.get_items(invoice_id)
    return ApiResponse(ok=True, data=inv)


@router.get("/{invoice_id}/print", response_model=ApiResponse, summary="🖨️ Get Invoice Print Data")
def get_print_data(invoice_id: int, user: dict = Depends(get_current_user)):
    data = invoice_repo.get_print_data(invoice_id)
    if not data:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return ApiResponse(ok=True, data=data)


@router.post("/{invoice_id}/duplicate", response_model=ApiResponse, summary="📋 Duplicate Invoice as Draft")
def duplicate_invoice(invoice_id: int, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    data = invoice_repo.duplicate_invoice(invoice_id)
    if not data:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return ApiResponse(ok=True, data=data)


@router.put("/{invoice_id}/payment-method", response_model=ApiResponse, summary="💳 Update Payment Method")
def update_payment_method(
    invoice_id: int,
    new_method: str = Query(..., description="New payment method: cash, card, credit, wallet"),
    user: dict = Depends(require_role(["manager", "owner"])),
):
    inv = invoice_repo.get_by_id(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv["is_void"]:
        raise HTTPException(status_code=400, detail="Cannot change payment method of voided invoice")
    if new_method not in ["cash", "card", "credit", "wallet"]:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    invoice_repo.update_payment_method(invoice_id, new_method)
    return ApiResponse(ok=True, data={"invoice_id": invoice_id, "payment_method": new_method})



@router.post("/{invoice_id}/void", response_model=ApiResponse, summary="🛑 Void an Invoice")
def void_invoice(
    invoice_id: int,
    payload: VoidRequest,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    inv = invoice_repo.get_by_id(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv["is_void"]:
        raise HTTPException(status_code=400, detail="Invoice already voided")

    # --- Time-Lock Protection (Phase 10) ---
    max_days = int(
        settings_repo.get(
            "max_edit_days",
            settings_repo.get("max_invoice_edit_days", "7"),
        )
        or 7
    )
    created_at = datetime.fromisoformat(inv["created_at"])
    now = datetime.fromisoformat(now_str())
    diff = (now - created_at).days
    if diff > max_days:
        raise HTTPException(
            status_code=403, 
            detail=f"Invoice cannot be voided after {max_days} days. This invoice is {diff} days old."
        )

    try:
        invoice_repo.void_invoice(invoice_id, user["user_id"], payload.reason)
    except Exception as e:
        logger.error(f"Void error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to void invoice due to internal error")

    ops_log_repo.log_event(
        branch_id=user.get("branch_id", 1),
        user_id=user["user_id"],
        role=user["role"],
        event_type="void_invoice",
        entity_type="invoice",
        entity_id=invoice_id,
        payload={"reason": payload.reason},
    )

    return ApiResponse(ok=True, data={"success": True, "invoice_id": invoice_id})
