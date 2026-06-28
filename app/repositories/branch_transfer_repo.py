from app.database.connection import get_connection
from app.models.branch_transfer import BranchTransferCreate, BranchTransferUpdate
from typing import Optional, List

def create_transfer(data: BranchTransferCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        ref = f"TR-{data.from_warehouse_id}-{data.to_warehouse_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        cursor.execute("""
            INSERT INTO branch_transfers (reference, from_warehouse_id, to_warehouse_id, status, requested_by, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (ref, data.from_warehouse_id, data.to_warehouse_id, 'pending', data.requested_by, data.notes))
        transfer_id = cursor.lastrowid
        
        total_items = 0
        total_qty = 0
        for item in data.items:
            total_items += 1
            total_qty += item.requested_qty
            cursor.execute("""
                INSERT INTO branch_transfer_items (transfer_id, product_id, product_name, requested_qty, unit_cost)
                VALUES (?, ?, ?, ?, ?)
            """, (transfer_id, item.product_id, item.product_name, item.requested_qty, item.unit_cost))
        
        cursor.execute("UPDATE branch_transfers SET total_items = ?, total_qty = ? WHERE id = ?", (total_items, total_qty, transfer_id))
        conn.commit()
        return transfer_id
    except Exception as e:
        conn.rollback()
        raise e

def list_transfers(warehouse_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM branch_transfers"
    params = []
    if warehouse_id:
        query += " WHERE from_warehouse_id = ? OR to_warehouse_id = ?"
        params.extend([warehouse_id, warehouse_id])
    query += " ORDER BY created_at DESC"
    cursor.execute(query, tuple(params))
    return [dict(row) for row in cursor.fetchall()]

def get_transfer_details(transfer_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM branch_transfers WHERE id = ?", (transfer_id,))
    master = cursor.fetchone()
    if not master: return None
    cursor.execute("SELECT * FROM branch_transfer_items WHERE transfer_id = ?", (transfer_id,))
    items = cursor.fetchall()
    res = dict(master)
    res['items'] = [dict(i) for i in items]
    return res

def process_transfer(transfer_id: int, updates: BranchTransferUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if updates.status == 'sent':
            for s in (updates.sent_qty_updates or []):
                cursor.execute("UPDATE branch_transfer_items SET sent_qty = ? WHERE id = ?", (s['item_id'], s['sent_qty']))
            cursor.execute("UPDATE branch_transfers SET status = 'sent' WHERE id = ?", (transfer_id,))
            
            # Deduct from source warehouse
            details = get_transfer_details(transfer_id)
            for item in details['items']:
                # Deduct stock
                cursor.execute("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?", (item['sent_qty'], item['product_id']))
                cursor.execute("""
                    INSERT INTO stock_movements (product_id, type, qty, reference_id, notes)
                    VALUES (?, 'transfer_out', ?, ?, ?)
                """, (item['product_id'], -item['sent_qty'], transfer_id, f"Transfer Out to Warehouse {details['to_warehouse_id']}"))

        elif updates.status == 'completed':
            for r in (updates.received_qty_updates or []):
                cursor.execute("UPDATE branch_transfer_items SET received_qty = ? WHERE id = ?", (r['item_id'], r['received_qty']))
            cursor.execute("UPDATE branch_transfers SET status = 'completed', completed_at = datetime('now'), approved_by = ? WHERE id = ?", (updates.approved_by, transfer_id))
            
            # Add to target warehouse
            details = get_transfer_details(transfer_id)
            for item in details['items']:
                # Add stock
                cursor.execute("UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?", (item['received_qty'], item['product_id']))
                cursor.execute("""
                    INSERT INTO stock_movements (product_id, type, qty, reference_id, notes)
                    VALUES (?, 'transfer_in', ?, ?, ?)
                """, (item['product_id'], item['received_qty'], transfer_id, f"Transfer In from Warehouse {details['from_warehouse_id']}"))

        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
from datetime import datetime # Added missing import
