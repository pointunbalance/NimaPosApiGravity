"""Stock movement repository."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, now_str


def create_movement(product_id: int, movement_type: str, qty_delta: int,
                    reference_type: str = "manual", reference_id: int = None,
                    user_id: int = None, branch_id: int = 1, notes: str = "",
                    conn=None):
    if conn is None:
        conn = get_connection()
        must_commit = True
    else:
        must_commit = False

    conn.execute(
        """INSERT INTO stock_movements (created_at, product_id, movement_type,
           qty_delta, reference_type, reference_id, user_id, notes, branch_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (now_str(), product_id, movement_type, qty_delta,
         reference_type, reference_id, user_id, notes, branch_id),
    )
    if must_commit:
        conn.commit()


def get_by_product(product_id: int, offset: int = 0, limit: int = 50):
    conn = get_connection()
    rows = conn.execute(
        """SELECT sm.*, p.name as product_name
           FROM stock_movements sm
           LEFT JOIN products p ON p.id = sm.product_id
           WHERE sm.product_id = ?
           ORDER BY sm.id DESC LIMIT ? OFFSET ?""",
        (product_id, limit, offset),
    ).fetchall()
    total = conn.execute(
        "SELECT COUNT(*) FROM stock_movements WHERE product_id = ?", (product_id,)
    ).fetchone()[0]
    return rows_to_list(rows), total


def get_all(date_from: str = None, date_to: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = """SELECT sm.*, p.name as product_name
              FROM stock_movements sm
              LEFT JOIN products p ON p.id = sm.product_id WHERE 1=1"""
    params = []
    if date_from:
        base += " AND date(sm.created_at) >= ?"
        params.append(date_from)
    if date_to:
        base += " AND date(sm.created_at) <= ?"
        params.append(date_to)
    count_base = base.replace("SELECT sm.*, p.name as product_name", "SELECT COUNT(sm.id)")
    total = conn.execute(count_base, params).fetchone()[0]
    base += " ORDER BY sm.id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(base, params).fetchall()
    return rows_to_list(rows), total
