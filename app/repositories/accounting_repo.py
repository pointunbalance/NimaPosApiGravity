from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str
from app.repositories import ops_log_repo


def _begin_if_needed(conn):
    """Start a transaction only when this function owns the transaction scope."""
    owns_transaction = not conn.in_transaction
    if owns_transaction:
        conn.execute("BEGIN TRANSACTION")
    return owns_transaction


def _finish_transaction(conn, owns_transaction: bool, success: bool):
    """Commit or rollback only if this function opened the transaction."""
    if not owns_transaction:
        return
    conn.execute("COMMIT" if success else "ROLLBACK")

# ══════════════ ACCOUNTS ══════════════
def list_accounts(acc_type: str = None):
    conn = get_connection()
    sql = "SELECT * FROM accounts"; params = []
    if acc_type: sql += " WHERE type = ?"; params.append(acc_type)
    sql += " ORDER BY code"
    return rows_to_list(conn.execute(sql, params).fetchall())

def get_account(a_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM accounts WHERE id = ?", (a_id,)).fetchone()
    return row_to_dict(row) if row else None

def create_account(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute("INSERT INTO accounts (code, name, type, description) VALUES (?, ?, ?, ?)",
        (data["code"], data["name"], data["type"], data.get("description", "")))
    conn.commit(); return cursor.lastrowid

def update_account(a_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "description"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(a_id); conn.execute(f"UPDATE accounts SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

# ══════════════ JOURNAL ENTRIES ══════════════
def create_entry(data: dict) -> int:
    conn = get_connection()
    owns_transaction = _begin_if_needed(conn)
    try:
        status = data.get("status", "draft")
        cursor = conn.execute(
            "INSERT INTO journal_entries (date, reference, description, total_amount, status, created_by, currency_id, exchange_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (data["date"], data.get("reference", ""), data["description"], data.get("total_amount", 0),
             status, data.get("created_by", ""), data.get("currency_id", 1), data.get("exchange_rate", 1.0)))
        entry_id = cursor.lastrowid
        for line in data.get("lines", []):
            conn.execute(
                "INSERT INTO journal_entry_lines (entry_id, account_id, account_name, debit, credit, description, cost_center_id, currency_id, exchange_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (entry_id, line["account_id"], line.get("account_name", ""), line.get("debit", 0),
                 line.get("credit", 0), line.get("description", ""), line.get("cost_center_id"),
                 line.get("currency_id", 1), line.get("exchange_rate", 1.0)))
            # Update account balance ONLY if posted
            if status == "posted":
                net = line.get("debit", 0) - line.get("credit", 0)
                conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (net, line["account_id"]))
        _finish_transaction(conn, owns_transaction, True)
        
        # Audit Log
        ops_log_repo.log_event(
            branch_id=1, user_id=0, role="system",
            event_type="create_entry", entity_type="journal_entry", entity_id=entry_id,
            payload={"description": data["description"], "amount": data.get("total_amount", 0)},
            conn=conn,
        )
        
        return entry_id
    except Exception as e:
        _finish_transaction(conn, owns_transaction, False)
        raise e

def get_entry(e_id: int):
    conn = get_connection()
    entry = conn.execute("SELECT * FROM journal_entries WHERE id = ?", (e_id,)).fetchone()
    if not entry: return None
    result = row_to_dict(entry)
    result["lines"] = rows_to_list(conn.execute("SELECT * FROM journal_entry_lines WHERE entry_id = ?", (e_id,)).fetchall())
    return result

def list_entries(date_from: str = None, date_to: str = None, status: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM journal_entries WHERE 1=1"; params = []
    if date_from: base += " AND date >= ?"; params.append(date_from)
    if date_to: base += " AND date <= ?"; params.append(date_to)
    if status: base += " AND status = ?"; params.append(status)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total

def post_entry(e_id: int):
    conn = get_connection()
    owns_transaction = _begin_if_needed(conn)
    try:
        entry = get_entry(e_id)
        if not entry or entry["status"] == "posted":
            _finish_transaction(conn, owns_transaction, False)
            return
        
        # Apply balances now that it's being posted
        for line in entry["lines"]:
            net = line.get("debit", 0) - line.get("credit", 0)
            conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (net, line["account_id"]))
        
        conn.execute("UPDATE journal_entries SET status = 'posted' WHERE id = ?", (e_id,))
        _finish_transaction(conn, owns_transaction, True)
    except Exception as e:
        _finish_transaction(conn, owns_transaction, False)
        raise e

def reverse_entry(original_entry_id: int, user_id: int = 0) -> int:
    """Creates a contra-entry for an existing journal entry."""
    conn = get_connection()
    old = get_entry(original_entry_id)
    if not old: return None
    
    data = {
        "date": now_str().split(" ")[0],
        "reference": f"REV-{old['id']}",
        "description": f"إلغاء القيد رقم {old['id']} - {old['description']}",
        "total_amount": old["total_amount"],
        "currency_id": old.get("currency_id", 1),
        "exchange_rate": old.get("exchange_rate", 1.0),
        "status": "posted",
        "created_by": f"System (User {user_id})",
        "lines": []
    }
    for l in old["lines"]:
        data["lines"].append({
            "account_id": l["account_id"],
            "debit": l["credit"], # Switch debit/credit
            "credit": l["debit"],
            "description": f"عكس: {l['description']}"
        })
    entry_id = create_entry(data)
    
    # Audit Log
    ops_log_repo.log_event(
        branch_id=1, user_id=user_id, role="admin",
        event_type="reverse_entry", entity_type="journal_entry", entity_id=original_entry_id,
        payload={"new_entry_id": entry_id},
        conn=conn,
    )
    
    return entry_id

# ── General Ledger (computed) ──
def general_ledger(account_id: int, date_from: str = None, date_to: str = None):
    conn = get_connection()
    base = """SELECT jel.*, je.date, je.reference, je.description as entry_desc
              FROM journal_entry_lines jel
              JOIN journal_entries je ON je.id = jel.entry_id
              WHERE jel.account_id = ? AND je.status = 'posted'"""
    params = [account_id]
    if date_from: base += " AND je.date >= ?"; params.append(date_from)
    if date_to: base += " AND je.date <= ?"; params.append(date_to)
    base += " ORDER BY je.date, je.id"
    return rows_to_list(conn.execute(base, params).fetchall())

# ══════════════ BANK CHECKS ══════════════
def create_check(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO bank_checks (number, amount, bank_name, issue_date, due_date, type, payee_name, payee_id, notes, image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["number"], data["amount"], data["bank_name"], data["issue_date"], data["due_date"],
         data.get("type", "receivable"), data.get("payee_name", ""), data.get("payee_id"),
         data.get("notes", ""), data.get("image", "")))
    conn.commit(); return cursor.lastrowid

def list_checks(check_type: str = None, status: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM bank_checks WHERE 1=1"; params = []
    if check_type: base += " AND type = ?"; params.append(check_type)
    if status: base += " AND status = ?"; params.append(status)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY due_date LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total

def update_check_status(c_id: int, status: str, notes: str = None):
    conn = get_connection()
    if notes is not None:
        conn.execute("UPDATE bank_checks SET status = ?, notes = ? WHERE id = ?", (status, notes, c_id))
    else:
        conn.execute("UPDATE bank_checks SET status = ? WHERE id = ?", (status, c_id))
    conn.commit()

# ══════════════ COST CENTERS ══════════════
def list_cost_centers():
    conn = get_connection()
    return rows_to_list(conn.execute("SELECT * FROM cost_centers ORDER BY code").fetchall())

def get_cost_center(cc_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM cost_centers WHERE id = ?", (cc_id,)).fetchone()
    return row_to_dict(row) if row else None

def create_cost_center(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute("INSERT INTO cost_centers (name, code, description, budget) VALUES (?, ?, ?, ?)",
        (data["name"], data["code"], data.get("description", ""), data.get("budget")))
    conn.commit(); return cursor.lastrowid

def update_cost_center(cc_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "description", "budget"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(cc_id); conn.execute(f"UPDATE cost_centers SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

# ══════════════ FIXED ASSETS ══════════════
def create_asset(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO fixed_assets (name, cost, value, salvage_value, purchase_date, life_in_years,
           note, category, serial_number, location, status, maintenance_interval_days) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["name"], data["cost"], data["value"], data.get("salvage_value", 0), data["purchase_date"],
         data.get("life_in_years", 5), data.get("note", ""), data.get("category", ""),
         data.get("serial_number", ""), data.get("location", ""), data.get("status", "Active"),
         data.get("maintenance_interval_days", 0)))
    conn.commit(); return cursor.lastrowid

def list_assets():
    conn = get_connection()
    return rows_to_list(conn.execute("SELECT * FROM fixed_assets ORDER BY name").fetchall())

def get_asset(a_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM fixed_assets WHERE id = ?", (a_id,)).fetchone()
    return row_to_dict(row) if row else None

def update_asset(a_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "value", "note", "location", "status", "last_maintenance_date", "maintenance_interval_days"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(a_id); conn.execute(f"UPDATE fixed_assets SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

def depreciate_asset(a_id: int, amount: float):
    conn = get_connection()
    asset = get_asset(a_id)
    if not asset: return
    
    # CODE-03: Ensure value doesn't go below salvage value
    max_depr = asset["value"] - asset.get("salvage_value", 0)
    actual_depr = min(amount, max_depr)
    
    if actual_depr <= 0: return
    
    conn.execute("UPDATE fixed_assets SET accumulated_depreciation = accumulated_depreciation + ?, value = value - ? WHERE id = ?",
        (actual_depr, actual_depr, a_id)); conn.commit()

# ══════════════ FISCAL YEARS ══════════════
def list_fiscal_years():
    conn = get_connection()
    return rows_to_list(conn.execute("SELECT * FROM fiscal_years ORDER BY start_date DESC").fetchall())

def get_fiscal_year(fy_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM fiscal_years WHERE id = ?", (fy_id,)).fetchone()
    return row_to_dict(row) if row else None

def create_fiscal_year(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute("INSERT INTO fiscal_years (name, start_date, end_date) VALUES (?, ?, ?)",
        (data["name"], data["start_date"], data["end_date"]))
    conn.commit(); return cursor.lastrowid

def close_fiscal_year(fy_id: int):
    conn = get_connection()
    conn.execute("UPDATE fiscal_years SET status = 'closed', closed_at = ? WHERE id = ?", (now_str(), fy_id)); conn.commit()

# ══════════════ BANK RECONCILIATIONS ══════════════
def create_reconciliation(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO bank_reconciliations (account_id, statement_date, statement_balance, reconciled_entry_ids_json) VALUES (?, ?, ?, ?)",
        (data["account_id"], data["statement_date"], data["statement_balance"], data.get("reconciled_entry_ids_json", "[]")))
    conn.commit(); return cursor.lastrowid

def list_reconciliations(account_id: int = None):
    conn = get_connection()
    sql = "SELECT * FROM bank_reconciliations"; params = []
    if account_id: sql += " WHERE account_id = ?"; params.append(account_id)
    sql += " ORDER BY statement_date DESC"
    return rows_to_list(conn.execute(sql, params).fetchall())

def update_reconciliation(r_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("status", "reconciled_entry_ids_json", "statement_balance"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(r_id); conn.execute(f"UPDATE bank_reconciliations SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

def add_to_reconciliation(recon_id: int, entry_id: int):
    """Link a journal entry to a reconciliation statement."""
    import json
    conn = get_connection()
    recon = conn.execute("SELECT reconciled_entry_ids_json FROM bank_reconciliations WHERE id = ?", (recon_id,)).fetchone()
    if not recon: return False
    ids = json.loads(recon["reconciled_entry_ids_json"] or "[]")
    if entry_id not in ids:
        ids.append(entry_id)
        conn.execute("UPDATE bank_reconciliations SET reconciled_entry_ids_json = ? WHERE id = ?", (json.dumps(ids), recon_id))
        conn.commit()
    return True

# ═══════ FINANCIAL REPORTS (computed) ═══════
def trial_balance():
    conn = get_connection()
    return rows_to_list(conn.execute(
        "SELECT id, code, name, type, balance FROM accounts ORDER BY code").fetchall())

def income_statement(date_from: str, date_to: str):
    conn = get_connection()
    revenue = conn.execute(
        "SELECT COALESCE(SUM(jel.credit - jel.debit), 0) FROM journal_entry_lines jel JOIN journal_entries je ON je.id = jel.entry_id JOIN accounts a ON a.id = jel.account_id WHERE a.type = 'revenue' AND je.status = 'posted' AND je.date BETWEEN ? AND ?",
        (date_from, date_to)).fetchone()[0]
    expenses = conn.execute(
        "SELECT COALESCE(SUM(jel.debit - jel.credit), 0) FROM journal_entry_lines jel JOIN journal_entries je ON je.id = jel.entry_id JOIN accounts a ON a.id = jel.account_id WHERE a.type = 'expense' AND je.status = 'posted' AND je.date BETWEEN ? AND ?",
        (date_from, date_to)).fetchone()[0]
    return {"revenue": round(revenue, 2), "expenses": round(expenses, 2), "net_income": round(revenue - expenses, 2)}

def balance_sheet():
    conn = get_connection()
    result = {}
    for acc_type in ("asset", "liability", "equity"):
        total = conn.execute("SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE type = ?", (acc_type,)).fetchone()[0]
        key = f"total_{acc_type}s" if acc_type != "liability" else "total_liabilities"
        result[key] = round(total, 2)
    
    # CODE-01: Accounting Identity Check
    assets = result.get("total_assets", 0)
    liabilities = result.get("total_liabilities", 0)
    equity = result.get("total_equitys", 0)
    
    imbalance = round(assets + liabilities + equity, 2)
    result["is_balanced"] = (abs(imbalance) < 0.01)
    result["imbalance_amount"] = imbalance
    return result

# ═══════ AGING REPORTS (optimized - BUG-17) ═══════
def get_receivables_aging():
    conn = get_connection()
    # SQL-01: Single-query aging calculation to avoid N+1 bottlenecks
    sql = """
        SELECT 
            c.id, c.name, c.phone, c.balance,
            COALESCE(SUM(CASE WHEN (julianday('now') - julianday(date(i.created_at))) <= 30 THEN i.net_total - i.refunded_amount ELSE 0 END), 0) as current,
            COALESCE(SUM(CASE WHEN (julianday('now') - julianday(date(i.created_at))) BETWEEN 31 AND 60 THEN i.net_total - i.refunded_amount ELSE 0 END), 0) as days_30_60,
            COALESCE(SUM(CASE WHEN (julianday('now') - julianday(date(i.created_at))) BETWEEN 61 AND 90 THEN i.net_total - i.refunded_amount ELSE 0 END), 0) as days_60_90,
            COALESCE(SUM(CASE WHEN (julianday('now') - julianday(date(i.created_at))) > 90 THEN i.net_total - i.refunded_amount ELSE 0 END), 0) as over_90
        FROM customers c
        LEFT JOIN invoices i ON i.customer_id = c.id AND i.is_void = 0 AND i.payment_method = 'credit'
        WHERE c.balance > 0
        GROUP BY c.id
        ORDER BY c.balance DESC
    """
    rows = conn.execute(sql).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        buckets = {
            "current": round(d.pop("current"), 2),
            "days_30_60": round(d.pop("days_30_60"), 2),
            "days_60_90": round(d.pop("days_60_90"), 2),
            "over_90": round(d.pop("over_90"), 2)
        }
        # LOGIC-01: Move risk assessment to repo layer (BUG-13)
        risk = "low"
        if buckets["over_90"] > 0: risk = "critical"
        elif buckets["days_60_90"] > 0: risk = "high"
        elif buckets["days_30_60"] > 0: risk = "medium"
        
        d["buckets"] = buckets
        d["risk_level"] = risk
        result.append(d)
    return result

def get_payables_aging():
    conn = get_connection()
    sql = """
        SELECT 
            s.id, s.name, s.phone, s.balance,
            COALESCE(SUM(CASE WHEN (julianday('now') - julianday(date(p.date))) <= 30 THEN p.total_amount ELSE 0 END), 0) as current,
            COALESCE(SUM(CASE WHEN (julianday('now') - julianday(date(p.date))) BETWEEN 31 AND 60 THEN p.total_amount ELSE 0 END), 0) as days_30_60,
            COALESCE(SUM(CASE WHEN (julianday('now') - julianday(date(p.date))) BETWEEN 61 AND 90 THEN p.total_amount ELSE 0 END), 0) as days_60_90,
            COALESCE(SUM(CASE WHEN (julianday('now') - julianday(date(p.date))) > 90 THEN p.total_amount ELSE 0 END), 0) as over_90
        FROM suppliers s
        LEFT JOIN purchases p ON p.supplier_id = s.id
        WHERE s.balance > 0
        GROUP BY s.id
        ORDER BY s.balance DESC
    """
    rows = conn.execute(sql).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["buckets"] = {
            "current": round(d.pop("current"), 2),
            "days_30_60": round(d.pop("days_30_60"), 2),
            "days_60_90": round(d.pop("days_60_90"), 2),
            "over_90": round(d.pop("over_90"), 2)
        }
        result.append(d)
    return result

def get_tax_report(date_from: str, date_to: str):
    conn = get_connection()
    # Sales tax collected
    sales_row = conn.execute(
        "SELECT COALESCE(SUM(tax), 0) as total_tax, COALESCE(SUM(total), 0) as total_sales, COUNT(*) as count "
        "FROM invoices WHERE is_void = 0 AND created_at >= ? AND created_at <= ?",
        (date_from, date_to + " 23:59:59"),
    ).fetchone()
    # Purchase tax paid
    purchase_row = conn.execute(
        "SELECT COALESCE(SUM(tax_amount), 0) as total_tax, COALESCE(SUM(total_amount), 0) as total_purchases, COUNT(*) as count "
        "FROM purchases WHERE date >= ? AND date <= ?",
        (date_from, date_to),
    ).fetchone()
    
    sales_tax = dict(sales_row) if sales_row else {"total_tax": 0, "total_sales": 0, "count": 0}
    purchase_tax = dict(purchase_row) if purchase_row else {"total_tax": 0, "total_purchases": 0, "count": 0}
    net_tax = sales_tax["total_tax"] - purchase_tax["total_tax"]
    
    return {
        "period": {"from": date_from, "to": date_to},
        "sales": sales_tax,
        "purchases": purchase_tax,
        "net_tax_liability": round(net_tax, 2),
    }

# ══════════════ BUDGETS (Phase 9) ══════════════
def get_budgets(cost_center_id: int = None):
    conn = get_connection()
    sql = "SELECT b.*, a.name as account_name FROM budgets b JOIN accounts a ON a.id = b.account_id"
    params = []
    if cost_center_id:
        sql += " WHERE b.cost_center_id = ?"
        params.append(cost_center_id)
    return rows_to_list(conn.execute(sql, params).fetchall())

def create_budget(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO budgets (account_id, cost_center_id, period_type, fiscal_year_id, planned_amount, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        (data["account_id"], data.get("cost_center_id"), data.get("period_type", "monthly"), 
         data["fiscal_year_id"], data["planned_amount"], now_str()))
    conn.commit(); return cursor.lastrowid

def get_budget_variance(cost_center_id: int, date_from: str, date_to: str):
    """Compares planned budgets vs actual transactions for a cost center."""
    conn = get_connection()
    # 1. Get budgets for this cost center
    budgets = get_budgets(cost_center_id)
    
    # 2. Get actuals from posted journal entries
    actuals = conn.execute("""
        SELECT jel.account_id, SUM(jel.debit - jel.credit) as actual_amount
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.entry_id
        WHERE jel.cost_center_id = ? AND je.status = 'posted'
        AND je.date >= ? AND je.date <= ?
        GROUP BY jel.account_id
    """, (cost_center_id, date_from, date_to)).fetchall()
    
    actual_map = {r["account_id"]: r["actual_amount"] for r in actuals}
    
    results = []
    for b in budgets:
        actual = actual_map.get(b["account_id"], 0)
        # For expenses, negative variance means over-budget (Actual > Planned)
        variance = b["planned_amount"] - actual
        results.append({
            "account_id": b["account_id"],
            "account_name": b["account_name"],
            "planned": b["planned_amount"],
            "actual": actual,
            "variance": round(variance, 2),
            "performance": "Over-Budget" if variance < 0 else "Under-Budget"
        })
    return results

def get_cash_flow(date_from: str, date_to: str):
    """Categorized Cash Flow (Direct Method approximation)."""
    conn = get_connection()
    # 1. Operating Activities (Sales receipts, Supplier payments, Expenses)
    # We look for journal entries involving 'cash' or 'bank' accounts
    sql = """
        SELECT jel.debit, jel.credit, a.name as account_name, a.type as account_type, je.description
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.entry_id
        JOIN accounts a ON a.id = jel.account_id
        WHERE je.date >= ? AND je.date <= ?
        AND a.name IN ('صندوق الكاش', 'البنك')
    """
    rows = conn.execute(sql, (date_from, date_to)).fetchall()
    
    inflow_op = 0
    outflow_op = 0
    inflow_inv = 0
    outflow_inv = 0
    inflow_fin = 0
    outflow_fin = 0

    for r in rows:
        desc = r["description"].lower()
        amount = r["debit"] - r["credit"] # Positive is Inflow (Debit to Asset), Negative is Outflow (Credit to Asset)
        
        # Simple heuristic classification
        if "فاتورة مبيعات" in desc or "customer payment" in desc:
            inflow_op += amount if amount > 0 else 0
            outflow_op += abs(amount) if amount < 0 else 0
        elif "شراء" in desc or "purchase" in desc or "supplier" in desc:
            outflow_op += abs(amount) if amount < 0 else 0
            inflow_op += amount if amount > 0 else 0
        elif "asset" in desc or "أصل" in desc:
            outflow_inv += abs(amount) if amount < 0 else 0
            inflow_inv += amount if amount > 0 else 0
        else:
            inflow_op += amount if amount > 0 else 0
            outflow_op += abs(amount) if amount < 0 else 0

    return {
        "period": {"from": date_from, "to": date_to},
        "operating_activities": {
            "inflow": round(inflow_op, 2),
            "outflow": round(outflow_op, 2),
            "net": round(inflow_op - outflow_op, 2)
        },
        "investing_activities": {
            "inflow": round(inflow_inv, 2),
            "outflow": round(outflow_inv, 2),
            "net": round(inflow_inv - outflow_inv, 2)
        },
        "financing_activities": {
            "inflow": round(inflow_fin, 2),
            "outflow": round(outflow_fin, 2),
            "net": round(inflow_fin - outflow_fin, 2)
        },
        "net_cash_increase": round((inflow_op - outflow_op) + (inflow_inv - outflow_inv) + (inflow_fin - outflow_fin), 2)
    }

def run_period_end_closing(date_to: str, user_id: int):
    """Zeroes out Revenue and Expense accounts and transfers to Retained Earnings."""
    conn = get_connection()
    try:
        conn.execute("BEGIN TRANSACTION")
        
        # 1. Fetch all Revenue and Expense accounts with non-zero balance
        accounts = conn.execute("SELECT id, name, type, balance FROM accounts WHERE type IN ('revenue', 'expense') AND balance != 0").fetchall()
        
        if not accounts:
            conn.execute("ROLLBACK")
            return {"message": "No accounts requiring closing."}

        total_p_and_l = 0
        lines = []
        for acc in accounts:
            # Reverse the balance to zero it
            # If Revenue (Credit balance asset), balance is usually positive in our logic? 
            # In our logic (debit - credit): 
            # Revenue accounts have positive balance if they have more debits? No, usually credits.
            # Let's assume balance = SUM(debit - credit).
            # Revenue (Credit type): + Credit, - Debit. Wait, let's check account_repo updates.
            # In create_entry: net = debit - credit; balance = balance + net
            # So Revenue accounts will have NEGATIVE balances (Credit > Debit).
            # Expense accounts will have POSITIVE balances (Debit > Credit).
            
            amount_to_zero = -acc["balance"]
            total_p_and_l += acc["balance"] # Summing the 'net impact' to transfer to RE
            
            lines.append({
                "account_id": acc["id"],
                "account_name": acc["name"],
                "debit": amount_to_zero if amount_to_zero > 0 else 0,
                "credit": abs(amount_to_zero) if amount_to_zero < 0 else 0,
                "description": f"إغلاق الفترة المالية في {date_to}"
            })

        # 2. Transfer to Retained Earnings (Equity)
        re_acc = conn.execute("SELECT id FROM accounts WHERE type = 'equity' AND (name LIKE '%أرباح%' OR name LIKE '%Retained%') LIMIT 1").fetchone()
        if not re_acc:
            # Use general equity if no RE found
            re_acc = conn.execute("SELECT id FROM accounts WHERE type = 'equity' LIMIT 1").fetchone()
        
        if re_acc:
            # The total impact to RE is -total_p_and_l 
            # (If Expenses > Revenue, P&L is positive, so we Debit RE (negative impact) and Credit Expenses)
            impact = -total_p_and_l
            lines.append({
                "account_id": re_acc["id"],
                "debit": impact if impact > 0 else 0,
                "credit": abs(impact) if impact < 0 else 0,
                "description": "تحويل صافي نتيجة الفترة للأرباح المبقاة"
            })

        # 3. Create the Closing Entry
        entry_data = {
            "date": date_to,
            "reference": f"CLOSE-{date_to}",
            "description": f"قيد الإغلاق المالي للفترة المنتهية في {date_to}",
            "lines": lines,
            "status": "posted",
            "created_by": f"System (User {user_id})"
        }
        entry_id = create_entry(entry_data)
        
        conn.execute("COMMIT")
        return {"entry_id": entry_id, "accounts_closed": len(accounts)}
    except Exception as e:
        conn.execute("ROLLBACK")
        raise e

def create_currency_exchange(data: dict) -> int:
    """Records a manual currency exchange transaction with journal entries."""
    from app.repositories import currency_repo
    # No BEGIN TRANSACTION here, create_entry handles it.
    try:
        # Get rate for from_currency if not provided
        if not data.get("exchange_rate") or data["exchange_rate"] == 1:
            from_curr = currency_repo.get_by_id(data["from_currency_id"])
            to_curr = currency_repo.get_by_id(data["to_currency_id"])
            data["exchange_rate"] = to_curr["exchange_rate"] / from_curr["exchange_rate"] if from_curr["exchange_rate"] != 0 else 1

        entry_lines = [
            {
                "account_id": data["to_account_id"],
                "debit": data["to_amount"],
                "credit": 0,
                "currency_id": data["to_currency_id"],
                "exchange_rate": 1.0, # Relative to its own currency
                "description": f"تحويل عملة: استلام {data['to_amount']} في حساب الوجهة"
            },
            {
                "account_id": data["from_account_id"],
                "debit": 0,
                "credit": data["from_amount"],
                "currency_id": data["from_currency_id"],
                "exchange_rate": 1.0,
                "description": f"تحويل عملة: صرف {data['from_amount']} من حساب المصدر"
            }
        ]
        
        return create_entry({
            "date": data.get("date") or now_str().split()[0],
            "reference": data.get("reference") or f"EXCH-{now_str().replace(':','').replace(' ','-')}",
            "description": data.get("notes") or "عملية صرافة / تحويل عملات",
            "lines": entry_lines,
            "status": "posted"
        })
    except Exception as e:
        raise e

def run_vat_closing(date_from: str, date_to: str, user_id: int):
    """Automates VAT settlement: In - Out = Net Payable/Refundable."""
    conn = get_connection()
    try:
        report = get_tax_report(date_from, date_to)
        net_vat = report["net_tax_liability"]
        
        if net_vat == 0: return {"message": "No tax liability for this period."}
        
        conn.execute("BEGIN TRANSACTION")
        # 1. Find VAT Output and VAT Input accounts
        # Usually named 'ضريبة عامة' or 'VAT'
        output_acc = conn.execute("SELECT id FROM accounts WHERE name LIKE '%مخرجات%' OR name LIKE '%Output%' LIMIT 1").fetchone()
        input_acc = conn.execute("SELECT id FROM accounts WHERE name LIKE '%مدخلات%' OR name LIKE '%Input%' LIMIT 1").fetchone()
        settlement_acc = conn.execute("SELECT id FROM accounts WHERE name LIKE '%تسوية%' OR name LIKE '%Settlement%' LIMIT 1").fetchone()
        
        if not (output_acc and input_acc and settlement_acc):
             conn.execute("ROLLBACK")
             return {"error": "VAT settlement accounts not found in Chart of Accounts."}

        lines = [
            {
                "account_id": output_acc["id"],
                "debit": report["sales"]["total_tax"],
                "credit": 0,
                "description": f"إغلاق ضريبة المخرجات للفترة {date_from} to {date_to}"
            },
            {
                "account_id": input_acc["id"],
                "debit": 0,
                "credit": report["purchases"]["total_tax"],
                "description": f"إغلاق ضريبة المدخلات للفترة {date_from} to {date_to}"
            },
            {
                "account_id": settlement_acc["id"],
                "debit": 0 if net_vat > 0 else abs(net_vat),
                "credit": net_vat if net_vat > 0 else 0,
                "description": "صافي ضريبة القيمة المضافة المستحقة للفترة"
            }
        ]
        
        entry_id = create_entry({
            "date": date_to,
            "reference": f"VAT-SETTLE-{date_to}",
            "description": f"تسوية ضريبة القيمة المضافة للفترة {date_from} - {date_to}",
            "lines": lines,
            "status": "posted",
            "created_by": f"System (User {user_id})"
        })
        
        conn.execute("COMMIT")
        
        # Audit Log
        ops_log_repo.log_event(
            branch_id=1, user_id=user_id, role="system",
            event_type="vat_closing", entity_type="journal_entry", entity_id=entry_id,
            payload={"net_vat": net_vat, "period": f"{date_from} to {date_to}"}
        )
        
        return {"entry_id": entry_id, "net_vat": net_vat}
    except Exception as e:
        if "conn" in locals(): conn.execute("ROLLBACK")
        raise e
