"""Enterprise Financial Repository for advanced P&L and Balance Sheet derived from ledger & inventory."""
import sqlite3
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict

def get_profit_loss(start_date: str, end_date: str) -> dict:
    """
    Calculates Profit & Loss based on Ledger Entries and Order Costs.
    """
    conn = get_connection()
    
    # 1. Revenue from Ledger (Credit side of Revenue accounts)
    # Using 'revenue' type accounts
    revenue_query = """
        SELECT COALESCE(SUM(jel.credit - jel.debit), 0)
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.entry_id
        JOIN accounts a ON a.id = jel.account_id
        WHERE a.type = 'revenue' AND je.status = 'posted'
        AND date(je.date) >= ? AND date(je.date) <= ?
    """
    revenue = conn.execute(revenue_query, (start_date, end_date)).fetchone()[0] or 0

    # 2. Expenses from Ledger
    expenses_query = """
        SELECT COALESCE(SUM(jel.debit - jel.credit), 0)
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.entry_id
        JOIN accounts a ON a.id = jel.account_id
        WHERE a.type = 'expense' AND je.status = 'posted'
        AND date(je.date) >= ? AND date(je.date) <= ?
    """
    expenses = conn.execute(expenses_query, (start_date, end_date)).fetchone()[0] or 0
    
    # 2.2 Direct Expenses (from expenses table)
    direct_expenses_query = """
        SELECT COALESCE(SUM(amount), 0) FROM expenses 
        WHERE date(date) >= ? AND date(date) <= ?
    """
    direct_expenses = conn.execute(direct_expenses_query, (start_date, end_date)).fetchone()[0] or 0
    
    # ACCT-08: If accounting is enabled and has data, trust ledger. Otherwise use direct.
    total_expenses = expenses if expenses > 0 else direct_expenses

    # 3. COGS (Cost of Goods Sold)
    cogs_query = """
        SELECT COALESCE(SUM(ii.qty * p.cost_price), 0)
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoice_id
        JOIN products p ON p.id = ii.product_id
        WHERE i.is_void = 0
        AND date(i.created_at) >= ? AND date(i.created_at) <= ?
    """
    cogs = conn.execute(cogs_query, (start_date, end_date)).fetchone()[0] or 0

    gross_profit = revenue - cogs
    net_profit = gross_profit - total_expenses

    return {
        "revenue": round(revenue, 2),
        "cogs": round(cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "expenses": round(total_expenses, 2),
        "net_profit": round(net_profit, 2)
    }


def get_financial_snapshot() -> dict:
    """
    Retrieves a complete financial snapshot including ROI, Net Worth, 
    and Asset/Liability distribution based on DB state.
    """
    conn = get_connection()
    
    # Capital
    initial_capital = conn.execute("SELECT value FROM app_settings WHERE key = 'initial_capital'").fetchone()
    initial_capital = float(initial_capital[0]) if initial_capital and initial_capital[0] else 0
    
    # Inventory Value
    inventory_value = conn.execute("SELECT COALESCE(SUM(stock_qty * cost_price), 0) FROM products WHERE is_active = 1").fetchone()[0] or 0

    # Fixed Assets
    fixed_assets = conn.execute("SELECT COALESCE(SUM(value), 0) FROM fixed_assets").fetchone()[0] or 0
    
    # Receivables (AR)
    receivables = conn.execute("SELECT COALESCE(SUM(balance), 0) FROM customers").fetchone()[0] or 0
    
    # Liabilities (AP / Suppliers)
    liabilities = conn.execute("SELECT COALESCE(SUM(balance), 0) FROM suppliers").fetchone()[0] or 0
    
    # Cash/Bank equivalent (Current Assets)
    safes_cash = conn.execute("SELECT COALESCE(SUM(balance), 0) FROM safes").fetchone()[0] or 0
    
    # We can also get this from Ledger Accounts where type = 'asset'
    # Cash revenue vs cash expenses (if safe not accurately tracked)
    
    current_assets = safes_cash + inventory_value + receivables
    total_assets = current_assets + fixed_assets
    net_worth = total_assets - liabilities
    
    # Approximate absolute net profit
    total_revenue = conn.execute("SELECT COALESCE(SUM(net_total), 0) FROM invoices WHERE is_void = 0").fetchone()[0] or 0
    total_operating_expenses = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM expenses").fetchone()[0] or 0
    total_cogs = conn.execute(
        "SELECT COALESCE(SUM(ii.qty * p.cost_price), 0) FROM invoice_items ii JOIN invoices i ON i.id = ii.invoice_id JOIN products p ON p.id = ii.product_id WHERE i.is_void = 0"
    ).fetchone()[0] or 0
    
    absolute_net_profit = total_revenue - total_operating_expenses - total_cogs
    roi = (absolute_net_profit / initial_capital * 100) if initial_capital > 0 else 0
    
    return {
        "initial_capital": round(initial_capital, 2),
        "inventory_value": round(inventory_value, 2),
        "fixed_assets_value": round(fixed_assets, 2),
        "total_liabilities": round(liabilities, 2),
        "total_receivables": round(receivables, 2),
        "estimated_cash": round(safes_cash, 2),
        "total_assets": round(total_assets, 2),
        "net_worth": round(net_worth, 2),
        "net_profit": round(absolute_net_profit, 2),
        "roi_percentage": round(roi, 2),
        "total_revenue": round(total_revenue, 2),
        "total_cogs": round(total_cogs, 2)
    }
