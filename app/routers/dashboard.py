"""Dashboard router — KPIs for today and advanced analytics."""
from fastapi import APIRouter, Depends
from app.models.common import ApiResponse
from app.repositories import invoice_repo, returns_repo, product_repo, customer_repo, dashboard_repo
from app.middleware.auth_middleware import get_current_user
from app.utils.helpers import today_str
from app.config import LOW_STOCK_THRESHOLD

router = APIRouter(prefix="/dashboard", tags=["Reports"])


@router.get("/kpis", response_model=ApiResponse, summary="Today's KPIs (Enhanced)")
def kpis(user: dict = Depends(get_current_user)):
    today = today_str()

    # Core sales
    sales = invoice_repo.get_today_count_and_sales(today)
    returns = returns_repo.get_today_returns_amount(today)
    today_sales = sales.get("sales", 0) or 0

    # Stock & customers
    low = len(product_repo.get_low_stock(LOW_STOCK_THRESHOLD))
    active_products = product_repo.count_active()
    active_customers = customer_repo.count_active()

    # Other KPIs via repository
    today_expenses = dashboard_repo.get_today_expenses(today)
    pending_orders = dashboard_repo.get_pending_orders()
    pending_maintenance = dashboard_repo.get_pending_maintenance()
    overdue_installments = dashboard_repo.get_overdue_installments(today)
    payment_split = dashboard_repo.get_payment_split(today)
    top_products = dashboard_repo.get_top_products(today)
    held_count = dashboard_repo.get_held_orders_count()
    today_cogs = dashboard_repo.get_today_cogs(today)

    return ApiResponse(ok=True, data={
        "today_sales": round(today_sales, 2),
        "today_invoices": sales.get("count", 0),
        "today_returns": round(returns, 2),
        "today_net": round(today_sales - returns, 2),
        "today_expenses": round(today_expenses, 2),
        "today_cogs": round(today_cogs, 2),
        "today_profit": round(today_sales - returns - today_expenses - today_cogs, 2),
        "low_stock_count": low,
        "active_products": active_products,
        "active_customers": active_customers,
        "pending_orders": pending_orders,
        "pending_maintenance": pending_maintenance,
        "overdue_installments": overdue_installments,
        "held_orders_count": held_count,
        "payment_split": payment_split,
        "top_products_today": top_products,
    })


@router.get("/branches", response_model=ApiResponse, summary="Per-branch KPIs")
def branch_kpis(user: dict = Depends(get_current_user)):
    today = today_str()
    return ApiResponse(ok=True, data=dashboard_repo.get_branch_kpis(today))
