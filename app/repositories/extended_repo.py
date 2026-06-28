"""Shift, StockAdjustment, HeldOrder, CustomerPayment repos."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str
from app.utils.time_keeper import TimeKeeper

# ══════════════ SHIFTS ══════════════

# ══════════════ SHIFTS (Delegated to shift_repo) ══════════════
from app.repositories import shift_repo

def open_shift(start_cash: float, user_id: int = None, branch_id: int = 1) -> int:
    return shift_repo.open_shift(start_cash, user_id, branch_id)

def close_shift(shift_id: int, actual_cash: float, notes: str = ""):
    return shift_repo.close_shift(shift_id, actual_cash, notes)

def get_shift(s_id: int):
    return shift_repo.get_shift(s_id)

def get_open_shift(branch_id: int = 1):
    return shift_repo.get_open_shift(branch_id)

def list_shifts(status: str = None, offset: int = 0, limit: int = 50):
    return shift_repo.list_shifts(status, offset, limit)

def add_shift_sales(shift_id: int, cash: float, card: float):
    return shift_repo.add_shift_sales(shift_id, cash, card)


# ══════════════ STOCK ADJUSTMENTS ══════════════

def create_adjustment(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO stock_adjustments (product_id, product_name, type, quantity, reason, date, notes, warehouse_id, warehouse_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["product_id"], data.get("product_name", ""), data.get("type", "increase"), data["quantity"],
         data.get("reason", "correction"), data["date"], data.get("notes", ""),
         data.get("warehouse_id"), data.get("warehouse_name", "")),
    )
    conn.commit(); return cursor.lastrowid

def list_adjustments(product_id: int = None, date_from: str = None, date_to: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM stock_adjustments WHERE 1=1"; params = []
    if product_id: base += " AND product_id = ?"; params.append(product_id)
    if date_from: base += " AND date >= ?"; params.append(date_from)
    if date_to: base += " AND date <= ?"; params.append(date_to)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY id DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total


# ══════════════ HELD ORDERS ══════════════

def hold_order(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO held_orders (date, items_json, customer_id, note) VALUES (?, ?, ?, ?)",
        (now_str(), data.get("items_json", "[]"), data.get("customer_id"), data.get("note", "")),
    )
    conn.commit(); return cursor.lastrowid

def list_held_orders():
    conn = get_connection()
    return rows_to_list(conn.execute("SELECT * FROM held_orders ORDER BY id DESC").fetchall())

def get_held_order(h_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM held_orders WHERE id = ?", (h_id,)).fetchone()
    return row_to_dict(row) if row else None

def delete_held_order(h_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM held_orders WHERE id = ?", (h_id,)); conn.commit()


# ══════════════ CUSTOMER PAYMENTS ══════════════

def create_payment(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO customer_payments (customer_id, amount, date, type, note, recorded_by) VALUES (?, ?, ?, ?, ?, ?)",
        (data["customer_id"], data["amount"], now_str(), data.get("type", "debt_payment"),
         data.get("note", ""), data.get("recorded_by", "")),
    )
    # Update customer balance
    if data.get("type") == "wallet_deposit":
        conn.execute("UPDATE customers SET wallet_balance = wallet_balance + ? WHERE id = ?", (data["amount"], data["customer_id"]))
    else:
        conn.execute("UPDATE customers SET balance = balance - ? WHERE id = ?", (data["amount"], data["customer_id"]))
    conn.commit(); return cursor.lastrowid

def list_payments(customer_id: int, offset: int = 0, limit: int = 50):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM customer_payments WHERE customer_id = ? ORDER BY id DESC LIMIT ? OFFSET ?", (customer_id, limit, offset)).fetchall()
    total = conn.execute("SELECT COUNT(*) FROM customer_payments WHERE customer_id = ?", (customer_id,)).fetchone()[0]
    return rows_to_list(rows), total
