from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict

def get_user_permissions(user_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT module, level FROM permissions WHERE user_id = ?", (user_id,)).fetchall()
    return {row["module"]: row["level"] for row in rows}

def set_permission(user_id: int, module: str, level: int):
    conn = get_connection()
    conn.execute("""
        INSERT INTO permissions (user_id, module, level)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, module) DO UPDATE SET level = excluded.level
    """, (user_id, module, level))
    conn.commit()

def has_permission(user_id: int, module: str, min_level: int) -> bool:
    conn = get_connection()
    # If user is admin (owner), they always have full access (Level 5)
    user = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
    if user and user["role"] == "owner":
        return True
        
    row = conn.execute("SELECT level FROM permissions WHERE user_id = ? AND module = ?", (user_id, module)).fetchone()
    if not row:
        return False
    return row["level"] >= min_level
