from app.database.connection import get_connection
from app.models.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate
from datetime import datetime
from typing import Optional

def create_purchase_order(data: PurchaseOrderCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        po_num = f"PO-{datetime.now().strftime('%y%m%d%H%M%S')}"
        
        # Calculate totals
        subtotal = sum(item.ordered_qty * item.unit_price for item in data.items)
        total_items = len(data.items)
        
        cursor.execute("""
            INSERT INTO purchase_orders (po_number, supplier_id, supplier_name, status, total_items, subtotal, total_amount, expected_date, created_by, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (po_num, data.supplier_id, data.supplier_name, 'draft', total_items, subtotal, subtotal, data.expected_date, data.created_by, data.notes))
        po_id = cursor.lastrowid
        
        for item in data.items:
            line_total = item.ordered_qty * item.unit_price
            cursor.execute("""
                INSERT INTO purchase_order_items (po_id, product_id, product_name, ordered_qty, unit_price, line_total)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (po_id, item.product_id, item.product_name, item.ordered_qty, item.unit_price, line_total))
        
        conn.commit()
        return po_id
    except Exception as e:
        conn.rollback()
        raise e

def list_purchase_orders(supplier_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM purchase_orders"
    params = []
    if supplier_id:
        query += " WHERE supplier_id = ?"
        params.append(supplier_id)
    query += " ORDER BY created_at DESC"
    cursor.execute(query, tuple(params))
    return [dict(row) for row in cursor.fetchall()]

def get_po_details(po_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM purchase_orders WHERE id = ?", (po_id,))
    master = cursor.fetchone()
    if not master: return None
    cursor.execute("SELECT * FROM purchase_order_items WHERE po_id = ?", (po_id,))
    items = cursor.fetchall()
    res = dict(master)
    res['items'] = [dict(i) for i in items]
    return res

def convert_to_purchase(po_id: int):
    """Converts a Purchase Order into an actual Purchase recording."""
    from app.repositories import purchase_repo
    import json
    
    po = get_po_details(po_id)
    if not po or po['status'] == 'completed':
        return None
    
    # 1. Prepare items for purchase_repo
    purchase_items = []
    for item in po['items']:
        purchase_items.append({
            "product_id": item["product_id"],
            "product_name": item["product_name"],
            "quantity": item["ordered_qty"],
            "cost_price": item["unit_price"],
            "bonus_qty": 0
        })
    
    # 2. Create Purchase
    purchase_data = {
        "supplier_id": po["supplier_id"],
        "supplier_name": po["supplier_name"],
        "date": datetime.now().strftime("%Y-%m-%d"),
        "items_json": json.dumps(purchase_items),
        "subtotal": po["subtotal"],
        "total_amount": po["total_amount"],
        "invoice_number": f"PO-REF-{po['po_number']}",
        "notes": f"Generated from PO: {po['po_number']}"
    }
    
    purchase_id = purchase_repo.create(purchase_data)
    
    # 3. Mark PO as completed and keep the purchase link for matching/reporting
    conn = get_connection()
    conn.execute(
        "UPDATE purchase_orders SET status = 'completed', purchase_id = ? WHERE id = ?",
        (purchase_id, po_id),
    )
    conn.commit()
    
    return purchase_id
