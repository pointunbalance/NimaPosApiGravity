"""Ops log repository for audit trail."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, now_str
import json
import uuid


def log_event(branch_id: int, user_id: int, role: str,
              event_type: str, entity_type: str, entity_id: int = None,
              payload: dict = None, conn=None):
    if conn is None:
        conn = get_connection()
        must_commit = True
    else:
        must_commit = False
    conn.execute(
        """INSERT INTO ops_log (created_at, branch_id, user_id, role,
           event_type, entity_type, entity_id, payload_json, event_uid)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (now_str(), branch_id, user_id, role, event_type, entity_type,
         entity_id, json.dumps(payload or {}), str(uuid.uuid4())),
    )
    if must_commit:
        conn.commit()


def get_by_range(date_from: str, date_to: str, offset: int = 0, limit: int = 100):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM ops_log WHERE created_at BETWEEN ? AND ? ORDER BY id ASC LIMIT ? OFFSET ?",
        (date_from, date_to, limit, offset),
    ).fetchall()
    return rows_to_list(rows)


def get_user_log(user_id: int, offset: int = 0, limit: int = 50):
    """Get activity log for a specific user."""
    conn = get_connection()
    total = conn.execute("SELECT COUNT(*) FROM ops_log WHERE user_id = ?", (user_id,)).fetchone()[0]
    rows = conn.execute(
        "SELECT * FROM ops_log WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?",
        (user_id, limit, offset),
    ).fetchall()
    return rows_to_list(rows), total
