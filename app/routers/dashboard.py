"""Dashboard router — KPIs for today and advanced analytics."""
from fastapi import APIRouter, Depends, Query
from app.models.common import ApiResponse
from app.repositories import invoice_repo, returns_repo, product_repo, customer_repo
from app.database.connection import get_connection
from app.middleware.auth_middleware import get_current_user
from app.utils.helpers import today_str, rows_to_list
from app.config import LOW_STOCK_THRESHOLD

router = APIRouter(prefix="/dashboard", tags=["Reports"])


@router.get("/kpis", response_model=ApiResponse, summary="Today's KPIs (Enhanced)")
def kpis(user: dict = Depends(get_current_user)):
    today = today_str()
    conn = get_connection()

    # Core sales
    sales = invoice_repo.get_today_count_and_sales(today)
    returns = returns_repo.get_today_returns_amount(today)
    today_sales = sales.get("sales", 0) or 0

    # Stock
    low = len(product_repo.get_low_stock(LOW_STOCK_THRESHOLD))
    active_products = product_repo.count_active()
    active_customers = customer_repo.count_active()

    # Expenses today
    expenses_row = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?", (today,)
    ).fetchone()
    today_expenses = expenses_row["total"] if expenses_row else 0

    # Pending orders
    pending_orders = conn.execute(
        "SELECT COUNT(*) as cnt FROM invoices WHERE fulfillment_status = 'pending' AND is_void = 0"
    ).fetchone()["cnt"]

    # Pending maintenance
    pending_maintenance = conn.execute(
        "SELECT COUNT(*) as cnt FROM maintenance_orders WHERE status NOT IN ('delivered', 'cancelled')"
    ).fetchone()["cnt"]

    # Overdue installments
    overdue_installments = conn.execute(
        "SELECT COUNT(*) as cnt FROM installment_payments WHERE status = 'pending' AND due_date < ?",
        (today,),
    ).fetchone()["cnt"]

    # Payment method split
    payment_split = conn.execute(
        """SELECT payment_method, COUNT(*) as cnt, COALESCE(SUM(net_total), 0) as total
           FROM invoices WHERE DATE(created_at) = ? AND is_void = 0
           GROUP BY payment_method""",
        (today,),
    ).fetchall()

    # Top 5 products today
    top_products = rows_to_list(conn.execute(
        """SELECT p.name, SUM(ii.qty) as total_qty, SUM(ii.net_line_total) as total_revenue
           FROM invoice_items ii
           JOIN invoices i ON ii.invoice_id = i.id
           JOIN products p ON ii.product_id = p.id
           WHERE DATE(i.created_at) = ? AND i.is_void = 0
           GROUP BY ii.product_id ORDER BY total_qty DESC LIMIT 5""",
        (today,),
    ).fetchall())

    # Held orders count
    held_count = conn.execute("SELECT COUNT(*) as cnt FROM held_orders").fetchone()["cnt"]

    # COGS Today
    cogs_row = conn.execute(
        """SELECT COALESCE(SUM(ii.qty * p.cost_price), 0) as total_cogs
           FROM invoice_items ii
           JOIN invoices i ON ii.invoice_id = i.id
           JOIN products p ON ii.product_id = p.id
           WHERE DATE(i.created_at) = ? AND i.is_void = 0""",
        (today,),
    ).fetchone()
    today_cogs = cogs_row["total_cogs"] if cogs_row else 0

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
        "payment_split": rows_to_list(payment_split) if payment_split else [],
        "top_products_today": top_products,
    })


@router.get("/branches", response_model=ApiResponse, summary="Per-branch KPIs")
def branch_kpis(user: dict = Depends(get_current_user)):
    today = today_str()
    conn = get_connection()
    rows = conn.execute(
        """SELECT b.id, b.name,
              COALESCE(SUM(CASE WHEN i.is_void=0 THEN i.net_total END), 0) as total_sales,
              COUNT(CASE WHEN i.is_void=0 THEN 1 END) as invoice_count
           FROM branches b
           LEFT JOIN invoices i ON i.branch_id = b.id AND DATE(i.created_at) = ?
           WHERE b.is_active = 1
           GROUP BY b.id ORDER BY total_sales DESC""",
        (today,),
    ).fetchall()
    return ApiResponse(ok=True, data=rows_to_list(rows))
