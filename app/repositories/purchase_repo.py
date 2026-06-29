"""Purchase repository."""
from app.database.connection import get_connection
import json
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def get_all(supplier_id: int = None, date_from: str = None, date_to: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM purchases WHERE 1=1"; params = []
    if supplier_id: base += " AND supplier_id = ?"; params.append(supplier_id)
    if date_from: base += " AND date >= ?"; params.append(date_from)
    if date_to: base += " AND date <= ?"; params.append(date_to)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total

def get_by_id(p_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM purchases WHERE id = ?", (p_id,)).fetchone()
    return row_to_dict(row) if row else None

def create(data: dict) -> int:
    conn = get_connection()
    items_json = data.get("items_json", "[]")
    cursor = conn.execute(
        """INSERT INTO purchases (supplier_id, supplier_name, date, items_json, subtotal, tax_amount,
           discount_amount, total_amount, invoice_number, notes, attachment, currency_id, exchange_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["supplier_id"], data.get("supplier_name", ""), data["date"], items_json,
         data.get("subtotal", 0), data.get("tax_amount", 0), data.get("discount_amount", 0),
         data.get("total_amount", 0), data.get("invoice_number", ""), data.get("notes", ""), 
         data.get("attachment", ""), data.get("currency_id", 1), data.get("exchange_rate", 1.0)),
    )
    purchase_id = cursor.lastrowid

    # 1. Update Supplier Total Purchases
    if data.get("supplier_id"):
        conn.execute(
            "UPDATE suppliers SET total_purchases = total_purchases + ?, updated_at = ? WHERE id = ?",
            (data.get("total_amount", 0), now_str(), data["supplier_id"])
        )

    # 2. Update Product Stock and Cost Prices
    try:
        items = json.loads(items_json)
        for item in items:
            p_id = item.get("product_id") or item.get("id")
            if p_id:
                qty = item.get("quantity", 0)
                bonus = item.get("bonus_qty", 0)
                total_qty = qty + bonus
                cost = item.get("cost_price") or item.get("price", 0)
                
                # Calculate Net Cost if bonus exists
                # Net Cost = (Paid Qty * Unit Cost) / (Paid Qty + Bonus Qty)
                net_cost = (qty * cost) / total_qty if total_qty > 0 else cost
                
                # 2. Get Current Costing Method
                method_row = conn.execute("SELECT value FROM app_settings WHERE key = 'costing_method'").fetchone()
                method = method_row[0] if method_row else "last_price"

                # 3. Calculate New Cost
                new_cost = net_cost
                if method == "weighted_average":
                    prod = conn.execute("SELECT stock_qty, cost_price FROM products WHERE id = ?", (p_id,)).fetchone()
                    if prod:
                        old_stock, old_cost = prod
                        if old_stock > 0:
                            new_cost = ((old_stock * old_cost) + (total_qty * net_cost)) / (old_stock + total_qty)

                # 4. Update Product Stock and Cost Prices
                conn.execute(
                    "UPDATE products SET stock_qty = stock_qty + ?, cost_price = ?, updated_at = ? WHERE id = ?",
                    (total_qty, new_cost, now_str(), p_id)
                )

                # --- 5. Batch & Expiry Tracking (Phase 8) ---
                batch_number = item.get("batch_number")
                expiry_at = item.get("expiry_date")
                if batch_number:
                    conn.execute(
                        """INSERT INTO product_batches (product_id, batch_number, expiry_date, initial_qty, current_qty, purchase_id, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?)""",
                        (p_id, batch_number, expiry_at, total_qty, total_qty, purchase_id, now_str())
                    )
                
                # 6. Optional: Update Sale Prices
                if data.get("update_sale_prices"):
                     new_price = item.get("new_price")
                     if new_price:
                         conn.execute("UPDATE products SET price = ? WHERE id = ?", (new_price, p_id))
                
                # 4. Log Movement (OPS-01)
                conn.execute(
                    """INSERT INTO stock_movements (created_at, product_id, movement_type, qty_delta, reference_id, reference_type, notes)
                       VALUES (?, ?, 'purchase', ?, ?, 'purchase', ?)""",
                    (now_str(), p_id, total_qty, purchase_id, f"Purchase Ref: {purchase_id} (Incl. {bonus} bonus, NetCost: {round(net_cost, 2)})")
                )
    except Exception as e:
        conn.rollback()
        import logging
        logging.getLogger(__name__).error(f"Purchase creation failed: {str(e)}", exc_info=True)
        raise ValueError(f"Failed to process purchase items: {str(e)}")

    conn.commit()
    return purchase_id

def update(p_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("items_json", "subtotal", "tax_amount", "discount_amount", "total_amount", "invoice_number", "notes"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(p_id)
    conn.execute(f"UPDATE purchases SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()

def delete(p_id: int):
    conn = get_connection()
    p = get_by_id(p_id)
    if not p:
        return
    
    # Reverse Stock
    try:
        items = json.loads(p.get("items_json", "[]"))
        for item in items:
            prod_id = item.get("product_id") or item.get("id")
            if prod_id:
                qty = item.get("quantity", 0)
                bonus = item.get("bonus_qty", 0)
                total_qty = qty + bonus
                conn.execute(
                    "UPDATE products SET stock_qty = stock_qty - ?, updated_at = ? WHERE id = ?",
                    (total_qty, now_str(), prod_id)
                )
    except Exception:
        pass  # Best effort stock reversal

    # Reverse Supplier Total Purchases (LOGIC-02)
    if p.get("supplier_id") and p.get("total_amount"):
        conn.execute(
            "UPDATE suppliers SET total_purchases = total_purchases - ?, updated_at = ? WHERE id = ?",
            (p["total_amount"], now_str(), p["supplier_id"])
        )

    conn.execute("DELETE FROM purchases WHERE id = ?", (p_id,))
    conn.commit()


def get_items(p_id: int):
    """Return parsed items from items_json for display."""
    import json
    p = get_by_id(p_id)
    if not p:
        return []
    try:
        return json.loads(p.get("items_json", "[]"))
    except Exception:
        return []


def get_summary(date_from: str = None, date_to: str = None) -> dict:
    """Quick summary of purchases for a date range."""
    conn = get_connection()
    where, params = ["is_void = 0"], []
    if date_from: where.append("date >= ?"); params.append(date_from)
    if date_to: where.append("date <= ?"); params.append(date_to)
    wc = " AND ".join(where)
    row = conn.execute(
        f"SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE {wc}", params
    ).fetchone()
    return {"count": row["cnt"], "total": round(row["total"], 2)}


def void_purchase(p_id: int):
    """Void a purchase — reverse stock and supplier balance without deleting the record."""
    import json
    conn = get_connection()
    p = get_by_id(p_id)
    if not p or p.get("is_void"):
        return False
    
    # Reverse stock
    try:
        items = json.loads(p.get("items_json", "[]"))
        for item in items:
            prod_id = item.get("product_id") or item.get("id")
            if prod_id:
                total_qty = item.get("quantity", 0) + item.get("bonus_qty", 0)
                conn.execute(
                    "UPDATE products SET stock_qty = stock_qty - ?, updated_at = ? WHERE id = ?",
                    (total_qty, now_str(), prod_id)
                )
                conn.execute(
                    """INSERT INTO stock_movements (created_at, product_id, movement_type, qty_delta, reference_id, reference_type, notes)
                       VALUES (?, ?, 'void_purchase', ?, ?, 'purchase', ?)""",
                    (now_str(), prod_id, -total_qty, p_id, f"Void Purchase #{p_id}")
                )
    except Exception as e:
        conn.rollback()
        raise e
    
    # Reverse supplier balance
    if p.get("supplier_id") and p.get("total_amount"):
        conn.execute(
            "UPDATE suppliers SET total_purchases = total_purchases - ?, updated_at = ? WHERE id = ?",
            (p["total_amount"], now_str(), p["supplier_id"])
        )
    
    conn.execute("UPDATE purchases SET is_void = 1 WHERE id = ?", (p_id,))
    conn.commit()
    return True
