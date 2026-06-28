"""Reports repository."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list


def sales_summary(date_from: str, date_to: str, branch_id: int = None):
    conn = get_connection()
    base = """SELECT COUNT(id) as invoices_count,
              COALESCE(SUM(net_total), 0) as gross_sales,
              COALESCE(SUM(subtotal), 0) as subtotal_sum,
              COALESCE(SUM(tax), 0) as tax_sum
              FROM invoices
              WHERE date(created_at) BETWEEN ? AND ? AND is_void = 0"""
    params = [date_from, date_to]
    if branch_id:
        base += " AND branch_id = ?"
        params.append(branch_id)
    return dict(conn.execute(base, params).fetchone())


def daily_breakdown(date_from: str, date_to: str, branch_id: int = None):
    conn = get_connection()
    base = """SELECT date(created_at) as sale_date,
              COUNT(id) as invoices_count,
              COALESCE(SUM(net_total), 0) as gross_sales
              FROM invoices
              WHERE date(created_at) BETWEEN ? AND ? AND is_void = 0"""
    params = [date_from, date_to]
    if branch_id:
        base += " AND branch_id = ?"
        params.append(branch_id)
    base += " GROUP BY date(created_at) ORDER BY sale_date"
    rows = conn.execute(base, params).fetchall()
    return rows_to_list(rows)


def top_products(date_from: str, date_to: str, limit: int = 20, branch_id: int = None):
    conn = get_connection()
    base = """SELECT p.id as product_id, p.sku, p.name,
              SUM(ii.qty) as qty_sold,
              SUM(ii.net_line_total) as gross_sales
              FROM invoice_items ii
              JOIN invoices i ON i.id = ii.invoice_id
              JOIN products p ON p.id = ii.product_id
              WHERE date(i.created_at) BETWEEN ? AND ? AND i.is_void = 0"""
    params = [date_from, date_to]
    if branch_id:
        base += " AND i.branch_id = ?"
        params.append(branch_id)
    base += " GROUP BY p.id ORDER BY qty_sold DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(base, params).fetchall()
    return rows_to_list(rows)


def returns_amount(date_from: str, date_to: str, branch_id: int = None):
    conn = get_connection()
    base = "SELECT COALESCE(SUM(refund_amount), 0) FROM returns WHERE date(created_at) BETWEEN ? AND ?"
    params = [date_from, date_to]
    if branch_id:
        base += " AND branch_id = ?"
        params.append(branch_id)
    return conn.execute(base, params).fetchone()[0]


def sales_history(date_from: str, date_to: str, branch_id: int = None,
                  offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = """SELECT i.id as invoice_id, i.created_at, c.name as customer_name,
              i.net_total, i.payment_method, i.is_void,
              (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) as items_count
              FROM invoices i
              LEFT JOIN customers c ON c.id = i.customer_id
              WHERE date(i.created_at) BETWEEN ? AND ?"""
    params = [date_from, date_to]
    if branch_id:
        base += " AND i.branch_id = ?"
        params.append(branch_id)
    count_base = base.replace("SELECT i.id as invoice_id, i.created_at, c.name as customer_name,\n              i.net_total, i.payment_method, i.is_void,\n              (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) as items_count",
                               "SELECT COUNT(i.id)")
    total = conn.execute(count_base, params).fetchone()[0]
    base += " ORDER BY i.id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(base, params).fetchall()
    return rows_to_list(rows), total
def get_profit_metrics(date_from: str, date_to: str, branch_id: int = None):
    conn = get_connection()
    
    # 1. Net Revenue (Total - Returns)
    rev_sql = "SELECT COALESCE(SUM(net_total - refunded_amount), 0) FROM invoices WHERE is_void = 0 AND date(created_at) BETWEEN ? AND ?"
    args = [date_from, date_to]
    if branch_id:
        rev_sql += " AND branch_id = ?"
        args.append(branch_id)
    total_revenue = conn.execute(rev_sql, args).fetchone()[0]

    # 2. COGS (Cost of Goods Sold)
    # Strategy: Total Sold * Cost Price - Total Returned * Cost Price
    cogs_sql = """
        SELECT SUM(qty_net * cost_price) FROM (
            SELECT
                p.id,
                p.cost_price,
                (SELECT COALESCE(SUM(ii.qty), 0) FROM invoice_items ii
                 JOIN invoices i ON i.id = ii.invoice_id
                 WHERE ii.product_id = p.id AND i.is_void = 0 AND date(i.created_at) BETWEEN ? AND ?) -
                (SELECT COALESCE(SUM(ri.qty), 0) FROM return_items ri
                 JOIN returns r ON r.id = ri.return_id
                 WHERE ri.product_id = p.id AND date(r.created_at) BETWEEN ? AND ?) as qty_net
            FROM products p
        )
    """
    cogs_args = [date_from, date_to, date_from, date_to]
    total_cogs = conn.execute(cogs_sql, cogs_args).fetchone()[0] or 0

    gross_profit = total_revenue - total_cogs
    profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0

    return {
        "revenue": total_revenue,
        "cogs": total_cogs,
        "gross_profit": gross_profit,
        "profit_margin_percent": round(profit_margin, 2)
    }

def sales_by_category(date_from: str, date_to: str, branch_id: int = None):
    conn = get_connection()
    sql = """
        SELECT COALESCE(NULLIF(TRIM(p.category), ''), 'Uncategorized') as category_name,
               COUNT(ii.id) as items_sold,
               SUM(ii.net_line_total) as total_revenue
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoice_id
        JOIN products p ON p.id = ii.product_id
        WHERE i.is_void = 0 AND date(i.created_at) BETWEEN ? AND ?
    """
    args = [date_from, date_to]
    if branch_id:
        sql += " AND i.branch_id = ?"
        args.append(branch_id)
    sql += " GROUP BY COALESCE(NULLIF(TRIM(p.category), ''), 'Uncategorized') ORDER BY total_revenue DESC"
    return rows_to_list(conn.execute(sql, args).fetchall())


def stagnant_products(days: int = 30, limit: int = 50):
    """Find products with 0 sales in the last X days."""
    conn = get_connection()
    sql = """
        SELECT p.id, p.sku, p.name, p.stock_qty, p.price, p.updated_at
        FROM products p
        WHERE p.is_active = 1
        AND p.id NOT IN (
            SELECT DISTINCT ii.product_id 
            FROM invoice_items ii
            JOIN invoices i ON i.id = ii.invoice_id
            WHERE i.is_void = 0 
            AND date(i.created_at) >= date('now', ?)
        )
        ORDER BY p.stock_qty DESC
        LIMIT ?
    """
    rows = conn.execute(sql, (f"-{days} days", limit)).fetchall()
    return rows_to_list(rows)


def get_product_ledger(product_id: int, date_from: str = None, date_to: str = None):
    """Get chronological history of all ins/outs for a product."""
    conn = get_connection()
    sql = """
        SELECT sm.*, u.username as user_name
        FROM stock_movements sm
        LEFT JOIN users u ON u.id = sm.user_id
        WHERE sm.product_id = ?
    """
    params = [product_id]
    if date_from:
        sql += " AND date(sm.created_at) >= ?"
        params.append(date_from)
    if date_to:
        sql += " AND date(sm.created_at) <= ?"
        params.append(date_to)
    sql += " ORDER BY sm.id DESC"
    return rows_to_list(conn.execute(sql, params).fetchall())
def get_trading_summary(date_from: str, date_to: str, branch_id: int = None):
    """Aggregate Sales, Returns, Purchases and Expenses for a high-level trading snapshot."""
    conn = get_connection()
    args = [date_from, date_to]
    
    # 1. Sales (Total Net)
    sales_sql = "SELECT COALESCE(SUM(net_total), 0) FROM invoices WHERE is_void = 0 AND date(created_at) BETWEEN ? AND ?"
    if branch_id: sales_sql += " AND branch_id = ?"; sales_args = args + [branch_id]
    else: sales_args = args
    total_sales = conn.execute(sales_sql, sales_args).fetchone()[0]

    # 2. Returns (Customer)
    returns_sql = "SELECT COALESCE(SUM(refund_amount), 0) FROM returns WHERE date(created_at) BETWEEN ? AND ?"
    if branch_id: returns_sql += " AND branch_id = ?"; returns_args = args + [branch_id]
    else: returns_args = args
    customer_returns = conn.execute(returns_sql, returns_args).fetchone()[0]

    # 3. Purchases (Total)
    purchases_sql = "SELECT COALESCE(SUM(total_amount), 0) FROM purchases WHERE date BETWEEN ? AND ?"
    # Purchases usually don't have branch_id in this simple schema, but if they did, we'd filter
    total_purchases = conn.execute(purchases_sql, args).fetchone()[0]

    # 4. Expenses (Total)
    expenses_sql = "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date BETWEEN ? AND ?"
    if branch_id: expenses_sql += " AND branch_id = ?"; exp_args = args + [branch_id]
    else: exp_args = args
    total_expenses = conn.execute(expenses_sql, exp_args).fetchone()[0]

    net_trading_profit = (total_sales - customer_returns) - total_purchases - total_expenses

    return {
        "period": {"from": date_from, "to": date_to},
        "revenue": {
            "gross_sales": total_sales,
            "net_sales": total_sales - customer_returns,
            "returns": customer_returns
        },
        "costs": {
            "purchases": total_purchases,
            "expenses": total_expenses
        },
        "net_trading_profit": round(net_trading_profit, 2)
    }
def get_inventory_aging():
    """Calculates stock aging categories (0-30, 31-90, 90+ days) based on batches and updates."""
    conn = get_connection()
    # Strategy: Use latest batch received date where available, otherwise product updated_at
    sql = """
        SELECT 
            p.id, p.name, p.sku, p.stock_qty,
            COALESCE(
                (SELECT MAX(received_date) FROM product_batches WHERE product_id = p.id),
                date(p.updated_at)
            ) as last_receive_date
        FROM products p
        WHERE p.is_active = 1 AND p.stock_qty > 0
    """
    rows = conn.execute(sql).fetchall()
    
    from datetime import datetime, date
    today = date.today()
    
    buckets = {"0_30": 0, "31_90": 0, "90_plus": 0, "total_value": 0}
    details = []
    
    for row in rows:
        try:
            rcv_date = datetime.strptime(row["last_receive_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            rcv_date = today
            
        days = (today - rcv_date).days
        
        if days <= 30:
            buckets["0_30"] += row["stock_qty"]
        elif days <= 90:
            buckets["31_90"] += row["stock_qty"]
        else:
            buckets["90_plus"] += row["stock_qty"]
            
        details.append({
            "id": row["id"],
            "name": row["name"],
            "sku": row["sku"],
            "qty": row["stock_qty"],
            "days_in_stock": days
        })
        
    return {"summary": buckets, "items": details[:100]} # Top 100 items for view


def inventory_aging():
    """Provides insights into how long products have been sitting in stock."""
    conn = get_connection()
    sql = """
        SELECT name, sku, stock_qty,
        CASE 
            WHEN (julianday('now') - julianday(created_at)) <= 30 THEN '0-30 Days'
            WHEN (julianday('now') - julianday(created_at)) BETWEEN 31 AND 90 THEN '31-90 Days'
            ELSE 'Over 90 Days'
        END as age_bucket
        FROM products WHERE stock_qty > 0 AND is_active = 1
        ORDER BY age_bucket, stock_qty DESC
    """
    return rows_to_list(conn.execute(sql).fetchall())


def sales_by_user(date_from: str, date_to: str):
    """Sales grouped by cashier/user."""
    conn = get_connection()
    rows = conn.execute(
        """SELECT COALESCE(NULLIF(TRIM(i.cashier_name), ''), 'Unknown') as username,
                  COUNT(i.id) as invoice_count,
                  COALESCE(SUM(i.net_total), 0) as total_sales
           FROM invoices i
           WHERE i.is_void = 0 AND date(i.created_at) BETWEEN ? AND ?
           GROUP BY COALESCE(NULLIF(TRIM(i.cashier_name), ''), 'Unknown')
           ORDER BY total_sales DESC""",
        (date_from, date_to)
    ).fetchall()
    return rows_to_list(rows)


def sales_by_payment_method(date_from: str, date_to: str):
    """Sales grouped by payment method."""
    conn = get_connection()
    rows = conn.execute(
        """SELECT payment_method, COUNT(*) as cnt, COALESCE(SUM(net_total), 0) as total
           FROM invoices WHERE is_void = 0 AND date(created_at) BETWEEN ? AND ?
           GROUP BY payment_method""",
        (date_from, date_to)
    ).fetchall()
    return rows_to_list(rows)


def inventory_valuation():
    """Current inventory valuation at cost price."""
    conn = get_connection()
    rows = conn.execute(
        """SELECT id, name, sku, stock_qty, cost_price, ROUND(stock_qty * cost_price, 2) as value
           FROM products WHERE is_active = 1 AND stock_qty > 0 ORDER BY value DESC"""
    ).fetchall()
    total_val = sum(r["value"] for r in rows)
    return {"items": rows_to_list(rows), "total_valuation": round(total_val, 2)}


def hourly_sales(date_from: str, date_to: str):
    """Sales distribution by hour of day."""
    conn = get_connection()
    rows = conn.execute(
        """SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as cnt,
           COALESCE(SUM(net_total), 0) as total
           FROM invoices WHERE is_void = 0 AND date(created_at) BETWEEN ? AND ?
           GROUP BY hour ORDER BY hour""",
        (date_from, date_to)
    ).fetchall()
    return rows_to_list(rows)
