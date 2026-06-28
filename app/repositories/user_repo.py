"""User repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str


def get_all_active():
    conn = get_connection()
    rows = conn.execute("SELECT id, username, role, is_active, created_at FROM users WHERE is_active = 1 ORDER BY role, username").fetchall()
    return rows_to_list(rows)


def get_by_id(user_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return row_to_dict(row) if row else None


def get_by_username(username: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE username = ? AND is_active = 1", (username,)).fetchone()
    return row_to_dict(row) if row else None


def find_by_pin_hash(pin_hash_prefix: str = None):
    """Get all active users with their hashes to verify PIN against."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, username, role, pin_hash, pin_salt FROM users WHERE is_active = 1"
    ).fetchall()
    return rows_to_list(rows)


def create(data_or_username, pin_hash: str = None, pin_salt: str = None, role: str = None) -> int:
    conn = get_connection()
    if isinstance(data_or_username, dict):
        data = data_or_username
        cursor = conn.execute(
            "INSERT INTO users (username, pin_hash, pin_salt, role, full_name, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (data["username"], data["pin_hash"], data["pin_salt"], data.get("role", "cashier"),
             data.get("full_name", ""), data.get("phone", ""), now_str()),
        )
    else:
        cursor = conn.execute(
            "INSERT INTO users (username, pin_hash, pin_salt, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (data_or_username, pin_hash, pin_salt, role, now_str()),
        )
    conn.commit()
    return cursor.lastrowid


def update(user_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for key in ("username", "role", "is_active", "full_name", "phone"):
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            val = data[key]
            if key == "is_active":
                val = 1 if val else 0
            values.append(val)
    if not fields:
        return
    values.append(user_id)
    conn.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()


def update_pin(user_id: int, pin_hash: str, pin_salt: str):
    conn = get_connection()
    conn.execute(
        "UPDATE users SET pin_hash = ?, pin_salt = ?, pin = '' WHERE id = ?",
        (pin_hash, pin_salt, user_id),
    )
    conn.commit()

# --- EMPLOYEE DOCUMENTS ---
def list_user_files(user_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM employee_files WHERE user_id = ? ORDER BY uploaded_at DESC", (user_id,)).fetchall()
    return rows_to_list(rows)

def add_user_file(user_id: int, file_name: str, file_type: str, file_path: str = ""):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO employee_files (user_id, file_name, file_type, file_path) VALUES (?, ?, ?, ?)",
        (user_id, file_name, file_type, file_path))
    conn.commit(); return cursor.lastrowid

def delete_user_file(file_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM employee_files WHERE id = ?", (file_id,)); conn.commit()


def soft_delete(user_id: int):
    conn = get_connection()
    conn.execute("UPDATE users SET is_active = 0 WHERE id = ?", (user_id,))
    conn.commit()


def get_all(offset: int = 0, limit: int = 50):
    """List all users with pagination (excludes sensitive fields)."""
    conn = get_connection()
    total = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    rows = conn.execute(
        "SELECT id, username, role, full_name, phone, is_active, created_at FROM users ORDER BY role, username LIMIT ? OFFSET ?",
        (limit, offset)
    ).fetchall()
    return rows_to_list(rows), total


def find_by_username(username: str):
    """Return the active user record for a username."""
    return get_by_username(username)


def username_exists(username: str, include_inactive: bool = True):
    """Check if a username exists, optionally excluding inactive users."""
    conn = get_connection()
    sql = "SELECT id FROM users WHERE username = ?"
    params = [username]
    if not include_inactive:
        sql += " AND is_active = 1"
    row = conn.execute(sql, params).fetchone()
    return row_to_dict(row) if row else None


def deactivate(user_id: int):
    """Deactivate a user (soft delete)."""
    conn = get_connection()
    conn.execute("UPDATE users SET is_active = 0 WHERE id = ?", (user_id,))
    conn.commit()
