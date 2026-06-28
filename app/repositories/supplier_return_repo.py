from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def create_return(data: dict, items: list) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Insert Return Master
        cursor.execute("""
            INSERT INTO supplier_returns (supplier_id, date, total_amount, reason_id, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (data["supplier_id"], data["date"], data["total_amount"], data.get("reason_id"), data.get("notes")))
        return_id = cursor.lastrowid

        # 2. Insert Items & Update Stock
        for item in items:
            cursor.execute("""
                INSERT INTO supplier_return_items (return_id, product_id, qty, unit_cost, line_total)
                VALUES (?, ?, ?, ?, ?)
            """, (return_id, item["product_id"], item["qty"], item["unit_cost"], item["line_total"]))

            # Deduct stock
            cursor.execute(
                "UPDATE products SET stock_qty = stock_qty - ?, updated_at = ? WHERE id = ?",
                (item["qty"], now_str(), item["product_id"])
            )

            # Log Movement (OPS-01)
            cursor.execute("""
                INSERT INTO stock_movements (created_at, product_id, movement_type, qty_delta, reference_id, reference_type, notes)
                VALUES (?, ?, 'supplier_return', ?, ?, 'supplier_return', ?)
            """, (now_str(), item["product_id"], -item["qty"], return_id, f"Supplier Return: {return_id}"))

        # 3. Update Supplier Balance (Subtract from total_purchases if it's a return)
        cursor.execute(
            "UPDATE suppliers SET total_purchases = total_purchases - ?, updated_at = ? WHERE id = ?",
            (data["total_amount"], now_str(), data["supplier_id"])
        )

        conn.commit()
        return return_id
    except Exception as e:
        conn.rollback()
        raise e

def get_list(supplier_id: int = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    query = "SELECT * FROM supplier_returns WHERE 1=1"
    params = []
    if supplier_id:
        query += " AND supplier_id = ?"
        params.append(supplier_id)
    
    count_sql = query.replace("SELECT *", "SELECT COUNT(*)")
    total = conn.execute(count_sql, params).fetchone()[0]
    
    query += " ORDER BY date DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(query, params).fetchall()
    return rows_to_list(rows), total

def get_by_id(return_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM supplier_returns WHERE id = ?", (return_id,)).fetchone()
    if not row: return None
    
    res = row_to_dict(row)
    items = conn.execute("SELECT * FROM supplier_return_items WHERE return_id = ?", (return_id,)).fetchall()
    res["items"] = rows_to_list(items)
    return res

def get_reasons():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM return_reasons WHERE type IN ('supplier', 'both') AND is_active = 1").fetchall()
    return rows_to_list(rows)
