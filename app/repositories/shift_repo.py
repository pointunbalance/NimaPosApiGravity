"""Shift Management Repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str
from app.utils.time_keeper import TimeKeeper
from app.repositories import ops_log_repo

def open_shift(start_cash: float, user_id: int, branch_id: int = 1) -> int:
    """Opens a new cashier shift."""
    if not TimeKeeper.check_time_manipulation():
        raise ValueError("SECURITY ALERT: System time manipulation detected.")
        
    conn = get_connection()
    t = now_str()
    cursor = conn.execute(
        "INSERT INTO shifts (start_time, start_cash, status, user_id, branch_id) VALUES (?, ?, 'open', ?, ?)",
        (t, start_cash, user_id, branch_id),
    )
    shift_id = cursor.lastrowid
    conn.commit()
    
    # Audit Log
    ops_log_repo.log_event(
        branch_id=branch_id, user_id=user_id, role="cashier",
        event_type="open_shift", entity_type="shift", entity_id=shift_id,
        payload={"start_cash": start_cash}
    )
    
    TimeKeeper.commit_time(t)
    return shift_id

def get_shift(s_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM shifts WHERE id = ?", (s_id,)).fetchone()
    return row_to_dict(row) if row else None

def get_open_shift(branch_id: int = 1):
    conn = get_connection()
    row = conn.execute("SELECT * FROM shifts WHERE status = 'open' AND branch_id = ? ORDER BY id DESC LIMIT 1", (branch_id,)).fetchone()
    return row_to_dict(row) if row else None

def add_shift_sales(shift_id: int, cash: float, card: float):
    conn = get_connection()
    conn.execute("UPDATE shifts SET cash_sales = cash_sales + ?, card_sales = card_sales + ? WHERE id = ?", (cash, card, shift_id))
    conn.commit()

def calculate_expected_cash(shift_id: int) -> float:
    """Calculates exactly how much cash should be in the drawer."""
    conn = get_connection()
    shift = conn.execute("SELECT start_cash, start_time FROM shifts WHERE id = ?", (shift_id,)).fetchone()
    if not shift: return 0.0
    
    start_time = shift["start_time"]
    
    # 1. Cash Sales
    cash_sales = conn.execute(
        "SELECT SUM(paid_amount) FROM invoices WHERE created_at >= ? AND payment_method = 'cash' AND is_void = 0",
        (start_time,)
    ).fetchone()[0] or 0.0
    
    # 2. Cash Expenses
    cash_expenses = conn.execute(
        "SELECT SUM(amount) FROM expenses WHERE date >= ? AND payment_method = 'cash'",
        (start_time,)
    ).fetchone()[0] or 0.0
    
    # 3. Cash Returns
    cash_returns = conn.execute(
        "SELECT SUM(refund_amount) FROM returns WHERE created_at >= ? AND refund_method = 'cash'",
        (start_time,)
    ).fetchone()[0] or 0.0
    
    return round(shift["start_cash"] + cash_sales - cash_expenses - cash_returns, 2)

def close_shift(shift_id: int, actual_cash: float, notes: str = ""):
    """Closes shift and calculates difference."""
    if not TimeKeeper.check_time_manipulation():
        raise ValueError("SECURITY ALERT: System time manipulation detected.")
        
    conn = get_connection()
    shift = get_shift(shift_id)
    if not shift: return 0.0
    
    expected = calculate_expected_cash(shift_id)
    diff = actual_cash - expected
    
    t = now_str()
    conn.execute(
        "UPDATE shifts SET end_time = ?, actual_cash = ?, expected_cash = ?, difference = ?, status = 'closed', notes = ? WHERE id = ?",
        (t, actual_cash, expected, round(diff, 2), notes, shift_id),
    )
    conn.commit()
    
    # Audit Log
    ops_log_repo.log_event(
        branch_id=shift.get("branch_id", 1), user_id=shift.get("user_id", 0), role="cashier",
        event_type="close_shift", entity_type="shift", entity_id=shift_id,
        payload={"actual_cash": actual_cash, "expected": expected, "difference": diff}
    )
    
    TimeKeeper.commit_time(t)
    return diff

def list_shifts(status: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT s.*, u.username FROM shifts s LEFT JOIN users u ON u.id = s.user_id WHERE 1=1"; params = []
    if status: base += " AND s.status = ?"; params.append(status)
    count_sql = base.replace("SELECT s.*, u.username", "SELECT COUNT(*)")
    total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY s.id DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total
