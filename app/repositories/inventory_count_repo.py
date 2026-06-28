from typing import Optional

from app.database.connection import get_connection
from app.models.inventory_count import InventoryCountCreate, InventoryCountUpdate
from datetime import datetime

def create_inventory_count(data: InventoryCountCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Insert Master
        cursor.execute("""
            INSERT INTO inventory_counts (title, warehouse_id, status, counted_by, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (data.title, data.warehouse_id, data.status, data.counted_by, data.notes))
        count_id = cursor.lastrowid

        # 2. Insert Items & Calculate Stats
        total_products = 0
        matched = 0
        surplus = 0
        deficit = 0
        total_variance_value = 0

        for item in data.items:
            variance = item.actual_qty - item.system_qty
            variance_value = variance * item.unit_cost
            
            total_products += 1
            if variance == 0: matched += 1
            elif variance > 0: surplus += 1
            else: deficit += 1
            
            total_variance_value += variance_value

            cursor.execute("""
                INSERT INTO inventory_count_items (count_id, product_id, product_name, system_qty, actual_qty, variance, unit_cost, variance_value, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (count_id, item.product_id, item.product_name, item.system_qty, item.actual_qty, variance, item.unit_cost, variance_value, item.notes))

        # 3. Update Master Stats
        cursor.execute("""
            UPDATE inventory_counts 
            SET total_products = ?, matched = ?, surplus = ?, deficit = ?, total_variance_value = ?
            WHERE id = ?
        """, (total_products, matched, surplus, deficit, total_variance_value, count_id))
        
        conn.commit()
        return count_id
    except Exception as e:
        conn.rollback()
        raise e

def list_inventory_counts(warehouse_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM inventory_counts"
    params = []
    if warehouse_id:
        query += " WHERE warehouse_id = ?"
        params.append(warehouse_id)
    query += " ORDER BY started_at DESC"
    cursor.execute(query, tuple(params))
    return [dict(row) for row in cursor.fetchall()]

def get_inventory_count(count_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inventory_counts WHERE id = ?", (count_id,))
    master = cursor.fetchone()
    if not master: return None
    
    cursor.execute("SELECT * FROM inventory_count_items WHERE count_id = ?", (count_id,))
    items = cursor.fetchall()
    
    result = dict(master)
    result['items'] = [dict(i) for i in items]
    return result

def finalize_inventory_count(count_id: int, approved_by: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Update status
        cursor.execute("""
            UPDATE inventory_counts 
            SET status = 'completed', approved_by = ?, completed_at = datetime('now')
            WHERE id = ? AND status = 'draft'
        """, (approved_by, count_id))
        
        if cursor.rowcount == 0: return False

        # 2. Adjust Stock (Optional, but good for "Real" logic)
        # Fetch items
        cursor.execute("SELECT * FROM inventory_count_items WHERE count_id = ?", (count_id,))
        items = cursor.fetchall()
        for item in items:
            if item['variance'] != 0:
                # Update product stock
                cursor.execute("UPDATE products SET stock_qty = ? WHERE id = ?", (item['actual_qty'], item['product_id']))
                # Log stock movement
                cursor.execute("""
                    INSERT INTO stock_movements (product_id, type, qty, reference_id, notes)
                    VALUES (?, 'adjustment', ?, ?, ?)
                """, (item['product_id'], item['variance'], count_id, f"Inventory Count Finalization: {count_id}"))

        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
