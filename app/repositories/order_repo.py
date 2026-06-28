"""Repository for Orders / Fulfillment / Kitchen."""
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict, now_str


# ─── Full Order List with Filters ───
def list_orders(order_type=None, fulfillment_status=None, customer_id=None,
                date_from=None, date_to=None, is_void=0,
                offset=0, limit=50):
    conn = get_connection()
    where, params = ["i.is_void = ?"], [is_void]

    if order_type:
        where.append("i.order_type = ?"); params.append(order_type)
    if fulfillment_status:
        where.append("i.fulfillment_status = ?"); params.append(fulfillment_status)
    if customer_id:
        where.append("i.customer_id = ?"); params.append(customer_id)
    if date_from:
        where.append("i.created_at >= ?"); params.append(date_from)
    if date_to:
        where.append("i.created_at <= ?"); params.append(date_to + " 23:59:59")

    wc = " AND ".join(where)

    total = conn.execute(f"SELECT COUNT(*) FROM invoices i WHERE {wc}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT i.* FROM invoices i WHERE {wc} ORDER BY i.created_at DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    return rows_to_list(rows), total


def get_order(order_id: int):
    conn = get_connection()
    order = conn.execute("SELECT * FROM invoices WHERE id = ?", (order_id,)).fetchone()
    if not order:
        return None, []
    items = conn.execute("SELECT * FROM invoice_items WHERE invoice_id = ?", (order_id,)).fetchall()
    return row_to_dict(order), rows_to_list(items)


# ─── Fulfillment Status Updates ───
def update_fulfillment_status(order_id: int, status: str):
    conn = get_connection()
    conn.execute(
        "UPDATE invoices SET fulfillment_status = ? WHERE id = ?",
        (status, order_id),
    )
    conn.commit()
    return row_to_dict(conn.execute("SELECT * FROM invoices WHERE id = ?", (order_id,)).fetchone())


# ─── Kitchen Display (pending + ready orders) ───
def get_kitchen_orders():
    conn = get_connection()
    orders = conn.execute(
        "SELECT * FROM invoices WHERE fulfillment_status IN ('pending', 'ready') "
        "ORDER BY created_at ASC"
    ).fetchall()
    result = []
    for o in orders:
        od = dict(o)
        items = conn.execute(
            "SELECT * FROM invoice_items WHERE invoice_id = ?", (od["id"],)
        ).fetchall()
        od["items"] = rows_to_list(items)
        result.append(od)
    return result


# ─── Partial Refund ───
def create_partial_refund(order_id: int, items: list, user_id: int, user_name: str):
    """Create a partial refund for specific items in an order."""
    from app.repositories import stock_movement_repo
    conn = get_connection()
    refund_total = sum(i["qty"] * i["unit_price"] for i in items)

    try:
        # Create return record
        cursor = conn.execute(
            "INSERT INTO returns (created_at, original_invoice_id, user_id, refund_method, refund_amount) "
            "VALUES (?, ?, ?, 'cash', ?)",
            (now_str(), order_id, user_id, refund_total),
        )
        return_id = cursor.lastrowid

        # Update invoice's refunded_amount
        conn.execute(
            "UPDATE invoices SET refunded_amount = refunded_amount + ? WHERE id = ?",
            (refund_total, order_id)
        )

        # Create return items + restore stock + log movement
        for item in items:
            conn.execute(
                "INSERT INTO return_items (return_id, product_id, qty, unit_price, line_total) "
                "VALUES (?, ?, ?, ?, ?)",
                (return_id, item["product_id"], item["qty"], item["unit_price"],
                 item["qty"] * item["unit_price"]),
            )
            conn.execute(
                "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
                (item["qty"], item["product_id"]),
            )
            # Log stock movement
            stock_movement_repo.create_movement(
                product_id=item["product_id"],
                movement_type="return",
                qty_delta=item["qty"],
                reference_type="return",
                reference_id=return_id,
                user_id=user_id,
                conn=conn
            )

        conn.commit()
        return {"return_id": return_id, "refund_total": refund_total}
    except Exception as e:
        conn.rollback()
        raise e


# ─── Order Statistics ───
def get_order_stats(date_from=None, date_to=None):
    conn = get_connection()
    where, params = ["is_void = 0"], []
    if date_from:
        where.append("created_at >= ?"); params.append(date_from)
    if date_to:
        where.append("created_at <= ?"); params.append(date_to + " 23:59:59")
    wc = " AND ".join(where)

    row = conn.execute(
        f"SELECT COUNT(*) as count, COALESCE(SUM(net_total), 0) as revenue, "
        f"COALESCE(AVG(net_total), 0) as avg_ticket "
        f"FROM invoices WHERE {wc}", params
    ).fetchone()

    # By order type
    by_type = conn.execute(
        f"SELECT order_type, COUNT(*) as count, COALESCE(SUM(net_total), 0) as total "
        f"FROM invoices WHERE {wc} AND order_type != '' "
        f"GROUP BY order_type", params
    ).fetchall()

    return {
        "total_orders": row[0],
        "total_revenue": row[1],
        "average_ticket": round(row[2], 2),
        "by_type": rows_to_list(by_type),
    }
