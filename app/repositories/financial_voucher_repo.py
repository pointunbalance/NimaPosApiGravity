from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict, now_str

def create_voucher(data: dict):
    """
    Creates a financial voucher and updates the entity's balance.
    Types: 'opening_balance', 'discount_earned', 'discount_allowed'
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO financial_vouchers (type, entity_type, entity_id, amount, date, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (data["type"], data["entity_type"], data["entity_id"], data["amount"], data["date"], data.get("notes")))
        voucher_id = cursor.lastrowid

        # Update balance
        # If Opening Balance: we just set it (or add to it).
        # If Discount Earned/Allowed: we adjust the total_purchases/total_spent.
        
        table = "customers" if data["entity_type"] == "customer" else "suppliers"
        
        if data["type"] == "opening_balance":
            cursor.execute(f"UPDATE {table} SET opening_balance = opening_balance + ?, updated_at = ? WHERE id = ?",
                          (data["amount"], now_str(), data["entity_id"]))
        
        elif data["type"] == "discount_earned": # Relevant for Suppliers (reduces what we owe)
             cursor.execute(f"UPDATE {table} SET total_purchases = total_purchases - ?, updated_at = ? WHERE id = ?",
                          (data["amount"], now_str(), data["entity_id"]))
             
        elif data["type"] == "discount_allowed": # Relevant for Customers (reduces what they owe)
             cursor.execute(f"UPDATE {table} SET total_purchases = total_purchases - ?, updated_at = ? WHERE id = ?",
                          (data["amount"], now_str(), data["entity_id"]))

        conn.commit()
        return voucher_id
    except Exception as e:
        conn.rollback()
        raise e

def get_list(entity_type: str = None, entity_id: int = None):
    conn = get_connection()
    sql = "SELECT * FROM financial_vouchers WHERE 1=1"
    params = []
    if entity_type: sql += " AND entity_type = ?"; params.append(entity_type)
    if entity_id: sql += " AND entity_id = ?"; params.append(entity_id)
    sql += " ORDER BY date DESC"
    return rows_to_list(conn.execute(sql, params).fetchall())
