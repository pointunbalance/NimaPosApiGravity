"""Settings repository."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list


def get_all():
    conn = get_connection()
    rows = conn.execute("SELECT key, value FROM app_settings ORDER BY key").fetchall()
    return rows_to_list(rows)


def get(key: str, default=None):
    conn = get_connection()
    row = conn.execute("SELECT value FROM app_settings WHERE key = ?", (key,)).fetchone()
    return row[0] if row else default


def upsert(key: str, value: str):
    conn = get_connection()
    conn.execute(
        "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, value),
    )
    conn.commit()
