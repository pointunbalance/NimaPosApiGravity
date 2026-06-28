"""Repository for Activity Logs (Logbook)."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict, now_str


def create_log(log_type: str, action: str, details: str = "",
               user_name: str = "system", amount: float = None,
               reference_id: int = None, status: str = "success",
               branch_id: int = 1):
    """Insert an activity log entry."""
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO activity_logs (date, type, action, details, user_name, amount, reference_id, status, branch_id) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (now_str(), log_type, action, details, user_name, amount, reference_id, status, branch_id),
    )
    conn.commit()
    return cursor.lastrowid


def list_logs(log_type=None, status=None, user_name=None,
              date_from=None, date_to=None, search=None,
              offset=0, limit=100):
    conn = get_connection()
    where, params = [], []

    if log_type:
        where.append("type = ?"); params.append(log_type)
    if status:
        where.append("status = ?"); params.append(status)
    if user_name:
        where.append("user_name = ?"); params.append(user_name)
    if date_from:
        where.append("date >= ?"); params.append(date_from)
    if date_to:
        where.append("date <= ?"); params.append(date_to + " 23:59:59")
    if search:
        where.append("(action LIKE ? OR details LIKE ? OR CAST(reference_id AS TEXT) LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

    wc = " AND ".join(where) if where else "1=1"

    total = conn.execute(f"SELECT COUNT(*) FROM activity_logs WHERE {wc}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT * FROM activity_logs WHERE {wc} ORDER BY date DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    return rows_to_list(rows), total


def get_log_stats():
    """Dashboard-level log stats (today)."""
    conn = get_connection()
    today = now_str().split(" ")[0]
    row = conn.execute(
        "SELECT COUNT(*) as total, "
        "SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors, "
        "COALESCE(SUM(amount), 0) as volume "
        "FROM activity_logs WHERE date >= ?",
        (today,),
    ).fetchone()
    return {
        "total_today": row[0],
        "errors_today": row[1],
        "volume_today": row[2],
    }


def get_log_by_id(log_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM activity_logs WHERE id = ?", (log_id,)).fetchone()
    return row_to_dict(row) if row else None
