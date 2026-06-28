"""Pricing Rules repository — managing dynamic margin tiers."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list

def get_all():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM pricing_rules WHERE is_active = 1").fetchall()
    return rows_to_list(rows)

def get_by_category(category_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM pricing_rules WHERE category_id = ? AND is_active = 1", (category_id,)).fetchall()
    return rows_to_list(rows)

def create(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO pricing_rules (category_id, min_cost, max_cost, target_margin_pct, velocity_multiplier, is_active)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (data.get("category_id"), data.get("min_cost", 0), data.get("max_cost", 9999999), 
         data["target_margin_pct"], data.get("velocity_multiplier", 1.0), 1)
    )
    conn.commit()
    return cursor.lastrowid

def delete(rule_id: int):
    conn = get_connection()
    conn.execute("UPDATE pricing_rules SET is_active = 0 WHERE id = ?", (rule_id,))
    conn.commit()
