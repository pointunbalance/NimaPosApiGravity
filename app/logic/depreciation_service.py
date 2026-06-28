"""Depreciation service for fixed assets."""
from app.database.connection import get_connection
from app.utils.helpers import now_str
from datetime import datetime

def run_monthly_depreciation(user_id: int = 1):
    """Calculates and posts monthly depreciation for all fixed assets."""
    conn = get_connection()
    try:
        conn.execute("BEGIN TRANSACTION")
        
        # 1. Fetch assets that need depreciation
        # We assume assets have a 'depreciation_rate' (annual %) and 'cost'
        assets = conn.execute("SELECT id, name, cost, depreciation_rate, last_depreciation_date FROM fixed_assets WHERE is_active = 1").fetchall()
        
        results = []
        for asset in assets:
            # Check if already depreciated this month
            today = datetime.now()
            last_date_str = asset["last_depreciation_date"]
            if last_date_str:
                last_date = datetime.strptime(last_date_str.split(" ")[0], "%Y-%m-%d")
                if last_date.month == today.month and last_date.year == today.year:
                    continue # Already processed
            
            # Simple Straight Line calculation: (Cost * (Rate/100)) / 12
            monthly_dep = (asset["cost"] * (asset.get("depreciation_rate", 10) / 100)) / 12
            monthly_dep = round(monthly_dep, 2)
            
            if monthly_dep <= 0:
                continue

            # 2. Post Journal Entry
            from app.repositories import accounting_repo
            entry_id = conn.execute(
                "INSERT INTO journal_entries (date, reference, description, total_amount, status) VALUES (?, ?, ?, ?, ?)",
                (today.strftime("%Y-%m-%d"), f"DEP-{asset['id']}", f"Monthly Depreciation for {asset['name']}", monthly_dep, "posted")
            ).lastrowid
            
            # Accounts (Assuming standard naming - would be better if mapped in settings)
            # Debit: Depreciation Expense (مصروف الإهلاك)
            # Credit: Accumulated Depreciation (مجمع الإهلاك)
            exp_acct_id = _get_or_create_acct(conn, "مصروف إهلاك الأصول", "expense")
            acc_acct_id = _get_or_create_acct(conn, "مجمع إهلاك الأصول", "asset_contra") # Usually a credit balance asset
            
            conn.execute("INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)",
                         (entry_id, exp_acct_id, monthly_dep, 0))
            conn.execute("INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)",
                         (entry_id, acc_acct_id, 0, monthly_dep))
            
            # Update balances
            conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (monthly_dep, exp_acct_id))
            conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (monthly_dep, acc_acct_id))

            # 3. Log Depreciation
            conn.execute(
                "INSERT INTO depreciation_log (asset_id, depreciation_date, amount, entry_id, created_at) VALUES (?, ?, ?, ?, ?)",
                (asset["id"], today.strftime("%Y-%m-%d"), monthly_dep, entry_id, now_str())
            )
            
            # 4. Update Asset last depreciation
            conn.execute("UPDATE fixed_assets SET last_depreciation_date = ? WHERE id = ?", (now_str(), asset["id"]))
            
            results.append({"asset_id": asset["id"], "amount": monthly_dep})

        conn.execute("COMMIT")
        return results
    except Exception as e:
        conn.execute("ROLLBACK")
        raise e

def _get_or_create_acct(conn, name, t):
    row = conn.execute("SELECT id FROM accounts WHERE name = ?", (name,)).fetchone()
    if row: return row[0]
    import hashlib
    code = f"A-{hashlib.md5(name.encode()).hexdigest()[:6].upper()}"
    return conn.execute("INSERT INTO accounts (code, name, type) VALUES (?, ?, ?)", (code, name, t)).lastrowid
