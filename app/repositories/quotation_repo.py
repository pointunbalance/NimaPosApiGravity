"""Quotation repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str


def get_all(status: str = None, customer_id: int = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM quotations WHERE 1=1"
    params = []
    if status:
        base += " AND status = ?"; params.append(status)
    if customer_id:
        base += " AND customer_id = ?"; params.append(customer_id)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY id DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total

def get_by_id(q_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM quotations WHERE id = ?", (q_id,)).fetchone()
    return row_to_dict(row) if row else None

def create(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO quotations (date, expiry_date, customer_name, customer_id, items_json,
           subtotal, discount_amount, tax_amount, total_amount, status, notes, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)""",
        (now_str(), data.get("expiry_date"), data["customer_name"], data.get("customer_id"),
         data.get("items_json", "[]"), data.get("subtotal", 0), data.get("discount_amount", 0),
         data.get("tax_amount", 0), data.get("total_amount", 0), data.get("notes", ""), data.get("created_by", "")),
    )
    conn.commit(); return cursor.lastrowid

def update(q_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("customer_name", "items_json", "subtotal", "discount_amount", "tax_amount", "total_amount", "status", "expiry_date", "notes"):
        if k in data and data[k] is not None:
            fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(q_id)
    conn.execute(f"UPDATE quotations SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()

def delete(q_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM quotations WHERE id = ?", (q_id,))
    conn.commit()


def convert_to_invoice(q_id: int):
    """Converts a Quotation into an actual Sales Invoice."""
    from app.repositories import invoice_repo
    
    q = get_by_id(q_id)
    if not q or q['status'] == 'converted':
        return None
    
    # Prepare invoice data
    invoice_data = {
        "customer_id": q["customer_id"],
        "customer_name": q["customer_name"],
        "items_json": q["items_json"],
        "subtotal": q["subtotal"],
        "discount_amount": q["discount_amount"],
        "tax_amount": q["tax_amount"],
        "total_amount": q["total_amount"],
        "paid_amount": 0,
        "payment_method": "credit",
        "notes": f"Generated from Quotation: {q_id}"
    }
    
    invoice_id = invoice_repo.create(invoice_data)
    
    # Mark Quotation as converted
    update(q_id, {"status": "converted"})
    
    return invoice_id
