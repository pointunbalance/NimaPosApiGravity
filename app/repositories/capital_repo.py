"""Repository for Capital / Financial Center."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict


def get_financial_summary():
    """Calculate comprehensive financial center data."""
    conn = get_connection()

    # 1. Initial Capital
    cap_row = conn.execute(
        "SELECT value FROM app_settings WHERE key = 'initial_capital'"
    ).fetchone()
    initial_capital = float(cap_row[0]) if cap_row else 0

    # 2. Total Revenue (LOGIC-07: use net_total)
    rev_row = conn.execute(
        "SELECT COALESCE(SUM(net_total), 0) FROM invoices WHERE is_void = 0"
    ).fetchone()
    total_revenue = rev_row[0]

    # 3. Total Expenses
    exp_row = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM expenses"
    ).fetchone()
    total_expenses = exp_row[0]

    # 4. Estimated Cash
    estimated_cash = initial_capital + total_revenue - total_expenses

    # 5. Inventory Valuation (LOGIC-10: use products table directly)
    total_inventory = conn.execute(
        "SELECT COALESCE(SUM(stock_qty * cost_price), 0) FROM products WHERE is_active = 1"
    ).fetchone()[0]
    warehouse_assets = [{"warehouse_id": 1, "warehouse_name": "Main", "value": total_inventory}]

    # 6. Liabilities (supplier balances > 0)
    liab_row = conn.execute(
        "SELECT COALESCE(SUM(balance), 0) FROM suppliers WHERE balance > 0"
    ).fetchone()
    total_liabilities = liab_row[0]

    # 7. Customer Receivables (customer balances > 0)
    recv_row = conn.execute(
        "SELECT COALESCE(SUM(balance), 0) FROM customers WHERE balance > 0"
    ).fetchone()
    customer_receivables = recv_row[0]

    # 8. Fixed Assets
    asset_row = conn.execute(
        "SELECT COALESCE(SUM(value), 0) FROM fixed_assets"
    ).fetchone()
    total_fixed_assets = asset_row[0]

    # 9. Calculations
    current_assets = estimated_cash + total_inventory + customer_receivables
    total_assets = current_assets + total_fixed_assets
    net_worth = total_assets - total_liabilities
    working_capital = current_assets - total_liabilities
    net_profit = total_revenue - total_expenses
    roi = (net_profit / initial_capital * 100) if initial_capital > 0 else 0

    return {
        "initial_capital": initial_capital,
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "estimated_cash": round(estimated_cash, 2),
        "total_inventory": round(total_inventory, 2),
        "warehouse_assets": warehouse_assets,
        "total_liabilities": total_liabilities,
        "customer_receivables": customer_receivables,
        "total_fixed_assets": total_fixed_assets,
        "current_assets": round(current_assets, 2),
        "total_assets": round(total_assets, 2),
        "net_worth": round(net_worth, 2),
        "working_capital": round(working_capital, 2),
        "net_profit": round(net_profit, 2),
        "roi": round(roi, 2),
    }


def update_initial_capital(amount: float):
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('initial_capital', ?)",
        (str(amount),),
    )
    conn.commit()
    return amount


def get_cash_flow_trend(days: int = 14):
    """Cash flow trend per day for the last N days."""
    conn = get_connection()
    # Income by day
    income = conn.execute(
        "SELECT DATE(created_at) as day, SUM(total) as amount "
        "FROM invoices WHERE is_void = 0 "
        "GROUP BY DATE(created_at) "
        "ORDER BY day DESC LIMIT ?",
        (days,),
    ).fetchall()

    # Expenses by day
    expenses = conn.execute(
        "SELECT date as day, SUM(amount) as amount "
        "FROM expenses "
        "GROUP BY date "
        "ORDER BY day DESC LIMIT ?",
        (days,),
    ).fetchall()

    # Merge
    trend = {}
    for r in income:
        d = dict(r)
        trend.setdefault(d["day"], {"date": d["day"], "income": 0, "expense": 0})
        trend[d["day"]]["income"] = d["amount"]
    for r in expenses:
        d = dict(r)
        trend.setdefault(d["day"], {"date": d["day"], "income": 0, "expense": 0})
        trend[d["day"]]["expense"] = d["amount"]

    result = sorted(trend.values(), key=lambda x: x["date"])
    for item in result:
        item["net"] = round(item["income"] - item["expense"], 2)
    return result


def get_supplier_debts():
    """List suppliers with outstanding balances."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, name, phone, balance FROM suppliers WHERE balance > 0 ORDER BY balance DESC"
    ).fetchall()
    return rows_to_list(rows)
