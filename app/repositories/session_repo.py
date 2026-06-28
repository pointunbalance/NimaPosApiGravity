"""Session repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, now_str


def create_session(user_id: int, role: str, branch_id: int = 1) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO cashier_sessions (user_id, role, login_at, is_active, branch_id) VALUES (?, ?, ?, 1, ?)",
        (user_id, role, now_str(), branch_id),
    )
    conn.commit()
    return cursor.lastrowid


def close_session(session_id: int):
    conn = get_connection()
    conn.execute(
        "UPDATE cashier_sessions SET logout_at = ?, is_active = 0 WHERE id = ?",
        (now_str(), session_id),
    )
    conn.commit()


def get_active_session(user_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM cashier_sessions WHERE user_id = ? AND is_active = 1 ORDER BY login_at DESC LIMIT 1",
        (user_id,),
    ).fetchone()
    return row_to_dict(row) if row else None
