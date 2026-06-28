"""Dashboard repository — KPI queries."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list


def get_today_expenses(today: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?", (today,)
    ).fetchone()
    return row["total"] if row else 0


def get_pending_orders():
    conn = get_connection()
    return conn.execute(
        "SELECT COUNT(*) as cnt FROM invoices WHERE fulfillment_status = 'pending' AND is_void = 0"
    ).fetchone()["cnt"]


def get_pending_maintenance():
    conn = get_connection()
    return conn.execute(
        "SELECT COUNT(*) as cnt FROM maintenance_orders WHERE status NOT IN ('delivered', 'cancelled')"
    ).fetchone()["cnt"]


def get_overdue_installments(today: str):
    conn = get_connection()
    return conn.execute(
        "SELECT COUNT(*) as cnt FROM installment_payments WHERE status = 'pending' AND due_date < ?",
        (today,),
    ).fetchone()["cnt"]


def get_payment_split(today: str):
    conn = get_connection()
    rows = conn.execute(
        """SELECT payment_method, COUNT(*) as cnt, COALESCE(SUM(net_total), 0) as total
           FROM invoices WHERE DATE(created_at) = ? AND is_void = 0
           GROUP BY payment_method""",
        (today,),
    ).fetchall()
    return rows_to_list(rows)


def get_top_products(today: str):
    conn = get_connection()
    return rows_to_list(conn.execute(
        """SELECT p.name, SUM(ii.qty) as total_qty, SUM(ii.net_line_total) as total_revenue
           FROM invoice_items ii
           JOIN invoices i ON ii.invoice_id = i.id
           JOIN products p ON ii.product_id = p.id
           WHERE DATE(i.created_at) = ? AND i.is_void = 0
           GROUP BY ii.product_id ORDER BY total_qty DESC LIMIT 5""",
        (today,),
    ).fetchall())


def get_held_orders_count():
    conn = get_connection()
    return conn.execute("SELECT COUNT(*) as cnt FROM held_orders").fetchone()["cnt"]


def get_today_cogs(today: str):
    conn = get_connection()
    row = conn.execute(
        """SELECT COALESCE(SUM(ii.qty * p.cost_price), 0) as total_cogs
           FROM invoice_items ii
           JOIN invoices i ON ii.invoice_id = i.id
           JOIN products p ON ii.product_id = p.id
           WHERE DATE(i.created_at) = ? AND i.is_void = 0""",
        (today,),
    ).fetchone()
    return row["total_cogs"] if row else 0


def get_branch_kpis(today: str):
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
    return rows_to_list(rows)
