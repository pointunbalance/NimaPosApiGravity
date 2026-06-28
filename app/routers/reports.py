"""Reports router."""
from fastapi import APIRouter, Depends, Query
from app.models.common import ApiResponse
from app.repositories import reports_repo
from app.middleware.auth_middleware import require_role
from app.utils.helpers import paginate, pagination_meta, today_str
from app.config import TOP_PRODUCTS_LIMIT

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/sales-summary", response_model=ApiResponse, summary="Sales summary KPIs")
def sales_summary(
    date_from: str = Query(..., description="Start date YYYY-MM-DD"),
    date_to: str = Query(..., description="End date YYYY-MM-DD"),
    branch_id: int = None,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    summary = reports_repo.sales_summary(date_from, date_to, branch_id)
    returns = reports_repo.returns_amount(date_from, date_to, branch_id)
    daily = reports_repo.daily_breakdown(date_from, date_to, branch_id)
    gross = summary.get("gross_sales", 0)
    inv_count = summary.get("invoices_count", 0)
    net = gross - returns
    avg = gross / inv_count if inv_count > 0 else 0
    return ApiResponse(ok=True, data={
        "invoices_count": inv_count,
        "gross_sales": round(gross, 2),
        "subtotal_sum": round(summary.get("subtotal_sum", 0), 2),
        "tax_sum": round(summary.get("tax_sum", 0), 2),
        "returns_amount": round(returns, 2),
        "net_sales": round(net, 2),
        "avg_ticket": round(avg, 2),
        "daily_breakdown": daily,
    })


@router.get("/top-products", response_model=ApiResponse, summary="Top selling products")
def top_products(
    date_from: str = Query(...),
    date_to: str = Query(...),
    limit: int = Query(TOP_PRODUCTS_LIMIT, ge=1, le=100),
    branch_id: int = None,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    items = reports_repo.top_products(date_from, date_to, limit, branch_id)
    return ApiResponse(ok=True, data=items)


@router.get("/daily-breakdown", response_model=ApiResponse, summary="Daily sales breakdown")
def daily_breakdown(
    date_from: str = Query(...),
    date_to: str = Query(...),
    branch_id: int = None,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = reports_repo.daily_breakdown(date_from, date_to, branch_id)
    return ApiResponse(ok=True, data=data)


@router.get("/sales-history", response_model=ApiResponse, summary="Sales history")
def sales_history(
    date_from: str = Query(...),
    date_to: str = Query(...),
    branch_id: int = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_role(["cashier", "manager", "owner"])),
):
    offset, limit, page = paginate(page, limit)
    items, total = reports_repo.sales_history(date_from, date_to, branch_id, offset, limit)
    return ApiResponse(ok=True, data={"items": items, "pagination": pagination_meta(total, page, limit)})
@router.get("/profit-metrics", response_model=ApiResponse, summary="Advanced financial profit metrics")
def profit_metrics(
    date_from: str = Query(...),
    date_to: str = Query(...),
    branch_id: int = None,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = reports_repo.get_profit_metrics(date_from, date_to, branch_id)
    return ApiResponse(ok=True, data=data)

@router.get("/sales-by-category", response_model=ApiResponse, summary="Sales aggregation by category")
def sales_by_category(
    date_from: str = Query(...),
    date_to: str = Query(...),
    branch_id: int = None,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = reports_repo.sales_by_category(date_from, date_to, branch_id)
    return ApiResponse(ok=True, data=data)


@router.get("/stagnant-products", response_model=ApiResponse,
            summary="Products with 0 sales in last N days (Stagnant/Dead Stock)",
            tags=["Reports"])
def stagnant_products(
    days: int = Query(30, ge=1, le=365, description="Number of days without sales"),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = reports_repo.stagnant_products(days, limit)
    return ApiResponse(ok=True, data=data)


@router.get("/inventory-aging", response_model=ApiResponse,
            summary="Categorized stock weight (0-30, 31-90, 90+ days old)",
            tags=["Reports"])
def inventory_aging(user: dict = Depends(require_role(["manager", "owner"]))):
    """Provides insights into how long products have been sitting in stock."""
    data = reports_repo.inventory_aging()
    return ApiResponse(ok=True, data=data)


@router.get("/product-ledger/{product_id}", response_model=ApiResponse,
            summary="Chronological movement history for a single product (Item Card History)",
            tags=["Reports"])
def product_ledger(
    product_id: int,
    date_from: str = Query(None),
    date_to: str = Query(None),
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = reports_repo.get_product_ledger(product_id, date_from, date_to)
    return ApiResponse(ok=True, data=data)


@router.get("/trading-summary", response_model=ApiResponse,
            summary="High-level Profit/Loss trading snapshot (Sales vs Purchases vs Expenses)",
            tags=["Reports"])
def trading_summary(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    branch_id: int = None,
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = reports_repo.get_trading_summary(date_from, date_to, branch_id)
    return ApiResponse(ok=True, data=data)


@router.get("/sales-by-user", response_model=ApiResponse, summary="Sales grouped by cashier/user")
def sales_by_user(
    date_from: str = Query(...), date_to: str = Query(...),
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = reports_repo.sales_by_user(date_from, date_to)
    return ApiResponse(ok=True, data=data)


@router.get("/sales-by-payment-method", response_model=ApiResponse, summary="Sales grouped by payment method")
def sales_by_payment(
    date_from: str = Query(...), date_to: str = Query(...),
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = reports_repo.sales_by_payment_method(date_from, date_to)
    return ApiResponse(ok=True, data=data)


@router.get("/inventory-valuation", response_model=ApiResponse, summary="Current inventory valuation at cost price")
def inventory_valuation(user: dict = Depends(require_role(["manager", "owner"]))):
    data = reports_repo.inventory_valuation()
    return ApiResponse(ok=True, data=data)


@router.get("/hourly-sales", response_model=ApiResponse, summary="Sales distribution by hour of day")
def hourly_sales(
    date_from: str = Query(...), date_to: str = Query(...),
    user: dict = Depends(require_role(["manager", "owner"])),
):
    data = reports_repo.hourly_sales(date_from, date_to)
    return ApiResponse(ok=True, data=data)
