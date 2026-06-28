"""Held Orders repository — save/restore/delete held carts."""
import json
from app.database.connection import get_connection
from app.utils.helpers import now_str, rows_to_list, row_to_dict


def list_held(customer_id: int = None, limit: int = 50) -> list[dict]:
    conn = get_connection()
    sql = "SELECT * FROM held_orders WHERE 1=1"
    params = []
    if customer_id:
        sql += " AND customer_id = ?"
        params.append(customer_id)
    sql += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(sql, params).fetchall()
    result = rows_to_list(rows)
    for r in result:
        r["items"] = json.loads(r.get("items_json", "[]"))
    return result


def get_by_id(held_id: int) -> dict | None:
    conn = get_connection()
    row = conn.execute("SELECT * FROM held_orders WHERE id = ?", (held_id,)).fetchone()
    if not row:
        return None
    d = row_to_dict(row)
    d["items"] = json.loads(d.get("items_json", "[]"))
    return d


def create(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO held_orders (date, items_json, customer_id, note) VALUES (?, ?, ?, ?)",
        (now_str(), json.dumps(data.get("items", []), ensure_ascii=False),
         data.get("customer_id"), data.get("note", "")),
    )
    conn.commit()
    return cursor.lastrowid


def delete(held_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM held_orders WHERE id = ?", (held_id,))
    conn.commit()


def count() -> int:
    conn = get_connection()
    row = conn.execute("SELECT COUNT(*) as cnt FROM held_orders").fetchone()
    return row["cnt"] if row else 0
