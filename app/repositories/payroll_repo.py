"""Repository for Payroll processing."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict, now_str


STANDARD_WORK_DAYS = 30


def process_salary(user_id: int, month: str, base_salary: float,
                   days_worked: int = 30, bonus: float = 0,
                   deductions: float = 0, payment_method: str = "cash",
                   notes: str = ""):
    """Process salary: create payroll record + expense + optional accounting entry."""
    conn = get_connection()

    # Check if already processed
    existing = conn.execute(
        "SELECT id FROM payroll_records WHERE user_id = ? AND month = ?",
        (user_id, month),
    ).fetchone()
    if existing:
        return None, "Salary already processed for this user/month"

    # Get user info
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return None, "User not found"
    user_name = dict(user).get("username", "")

    # Calculate net salary
    earned_base = (base_salary / STANDARD_WORK_DAYS) * days_worked
    net_salary = max(0, round(earned_base + bonus - deductions, 2))

    if net_salary <= 0:
        return None, "Net salary must be greater than zero"

    # 1. Record expense
    cursor = conn.execute(
        "INSERT INTO expenses (title, amount, category, date, payment_method, notes) "
        "VALUES (?, ?, 'salary', ?, ?, ?)",
        (f"راتب شهر {month} - {user_name}", net_salary, now_str().split(" ")[0],
         payment_method,
         f"راتب أساسي: {base_salary} | أيام: {days_worked} | مكافآت: {bonus} | خصومات: {deductions}"),
    )
    expense_id = cursor.lastrowid

    # 2. Create payroll record
    conn.execute(
        "INSERT INTO payroll_records "
        "(user_id, user_name, month, base_salary, days_worked, earned_base, "
        "bonus, deductions, net_salary, payment_method, expense_id, notes) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (user_id, user_name, month, base_salary, days_worked,
         round(earned_base, 2), bonus, deductions, net_salary,
         payment_method, expense_id, notes),
    )

    # 3. Optional accounting entry
    enable_accounting = conn.execute(
        "SELECT value FROM app_settings WHERE key = 'enable_accounting'"
    ).fetchone()
    if enable_accounting and enable_accounting[0] == "1":
        salary_acc = conn.execute(
            "SELECT id FROM accounts WHERE code = '5030'"
        ).fetchone()
        cash_acc = conn.execute(
            "SELECT id FROM accounts WHERE code = '1010'"
        ).fetchone()
        bank_acc = conn.execute(
            "SELECT id FROM accounts WHERE code = '1020'"
        ).fetchone()
        credit_acc_id = dict(bank_acc)["id"] if payment_method == "bank" and bank_acc else (dict(cash_acc)["id"] if cash_acc else None)

        if salary_acc and credit_acc_id:
            sal_id = dict(salary_acc)["id"]
            je_cursor = conn.execute(
                "INSERT INTO journal_entries (date, reference, description, total_amount, status) "
                "VALUES (?, ?, ?, ?, 'posted')",
                (now_str().split(" ")[0], f"PAY-{month}-{user_id}",
                 f"استحقاق وصرف رواتب - {user_name} ({month})", net_salary),
            )
            je_id = je_cursor.lastrowid
            conn.execute(
                "INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) "
                "VALUES (?, ?, ?, 0, ?)",
                (je_id, sal_id, net_salary, f"راتب {user_name} ({days_worked} يوم)"),
            )
            conn.execute(
                "INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) "
                "VALUES (?, ?, 0, ?, ?)",
                (je_id, credit_acc_id, net_salary,
                 "تحويل بنكي" if payment_method == "bank" else "صرف نقدي"),
            )
            # Update account balances
            conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (net_salary, sal_id))
            conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (net_salary, credit_acc_id))

    conn.commit()
    return {
        "user_id": user_id,
        "user_name": user_name,
        "month": month,
        "net_salary": net_salary,
        "expense_id": expense_id,
    }, None


def list_payroll(month=None, user_id=None, offset=0, limit=50):
    conn = get_connection()
    where, params = [], []
    if month:
        where.append("month = ?"); params.append(month)
    if user_id:
        where.append("user_id = ?"); params.append(user_id)
    wc = " AND ".join(where) if where else "1=1"

    total = conn.execute(f"SELECT COUNT(*) FROM payroll_records WHERE {wc}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT * FROM payroll_records WHERE {wc} ORDER BY processed_at DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    return rows_to_list(rows), total


def get_payroll_summary(month: str):
    """Get payroll summary statistics for a month."""
    conn = get_connection()
    row = conn.execute(
        "SELECT COUNT(*) as count, COALESCE(SUM(net_salary), 0) as total_paid, "
        "COALESCE(SUM(bonus), 0) as total_bonus, COALESCE(SUM(deductions), 0) as total_deductions "
        "FROM payroll_records WHERE month = ?", (month,)
    ).fetchone()

    # Get users not yet processed
    total_users = conn.execute("SELECT COUNT(*) FROM users WHERE is_active = 1").fetchone()[0]

    return {
        "month": month,
        "processed_count": row[0],
        "total_paid": row[1],
        "total_bonus": row[2],
        "total_deductions": row[3],
        "total_users": total_users,
        "remaining": total_users - row[0],
    }
