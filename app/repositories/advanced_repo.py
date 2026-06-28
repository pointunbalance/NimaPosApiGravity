"""Warehouse, Batch, Serial, Table, Loyalty, Promotion, Installment, Rental, Studio repos."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

# ══════════════ WAREHOUSES ══════════════
def list_warehouses():
    conn = get_connection()
    return rows_to_list(conn.execute("SELECT * FROM warehouses ORDER BY id").fetchall())

def get_warehouse(w_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM warehouses WHERE id = ?", (w_id,)).fetchone()
    return row_to_dict(row) if row else None

def create_warehouse(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute("INSERT INTO warehouses (name, address, is_main) VALUES (?, ?, ?)",
        (data["name"], data.get("address", ""), 1 if data.get("is_main") else 0))
    conn.commit(); return cursor.lastrowid

def update_warehouse(w_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "address", "is_main"):
        if k in data and data[k] is not None:
            fields.append(f"{k} = ?"); values.append(1 if k == "is_main" and data[k] else (0 if k == "is_main" else data[k]))
    if not fields: return
    values.append(w_id)
    conn.execute(f"UPDATE warehouses SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

# ── Inventory Items ──
def get_warehouse_inventory(w_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT ii.*, p.name as product_name, p.sku FROM inventory_items ii JOIN products p ON p.id = ii.product_id WHERE ii.warehouse_id = ?", (w_id,)
    ).fetchall()
    return rows_to_list(rows)

def upsert_inventory(warehouse_id: int, product_id: int, quantity: int):
    conn = get_connection()
    conn.execute(
        "INSERT INTO inventory_items (warehouse_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(warehouse_id, product_id) DO UPDATE SET quantity = excluded.quantity",
        (warehouse_id, product_id, quantity))
    conn.commit()

# ══════════════ BATCHES ══════════════
def create_batch(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO product_batches (product_id, product_name, warehouse_id, quantity, expiry_date, batch_number, received_date, cost_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (data["product_id"], data.get("product_name", ""), data["warehouse_id"], data["quantity"],
         data.get("expiry_date"), data.get("batch_number", ""), data["received_date"], data.get("cost_price", 0)))
    conn.commit(); return cursor.lastrowid

def list_batches(product_id: int = None, warehouse_id: int = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM product_batches WHERE 1=1"; params = []
    if product_id: base += " AND product_id = ?"; params.append(product_id)
    if warehouse_id: base += " AND warehouse_id = ?"; params.append(warehouse_id)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY received_date DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total

def expiring_batches(days: int = 30):
    conn = get_connection()
    return rows_to_list(conn.execute(
        "SELECT * FROM product_batches WHERE expiry_date IS NOT NULL AND expiry_date <= date('now', '+' || ? || ' days') ORDER BY expiry_date", (days,)
    ).fetchall())

# ══════════════ SERIALS ══════════════
def create_serial(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO product_serials (product_id, serial_number, warehouse_id, purchase_id) VALUES (?, ?, ?, ?)",
        (data["product_id"], data["serial_number"], data.get("warehouse_id"), data.get("purchase_id")))
    conn.commit(); return cursor.lastrowid

def list_serials(product_id: int = None, status: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT ps.*, p.name as product_name FROM product_serials ps JOIN products p ON p.id = ps.product_id WHERE 1=1"; params = []
    if product_id: base += " AND ps.product_id = ?"; params.append(product_id)
    if status: base += " AND ps.status = ?"; params.append(status)
    count_sql = base.replace("SELECT ps.*, p.name as product_name", "SELECT COUNT(ps.id)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY ps.id DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total

def update_serial_status(serial_id: int, status: str, order_id: int = None):
    conn = get_connection()
    conn.execute("UPDATE product_serials SET status = ?, order_id = ? WHERE id = ?", (status, order_id, serial_id)); conn.commit()

# ══════════════ DINING TABLES ══════════════
def list_tables():
    conn = get_connection()
    return rows_to_list(conn.execute("SELECT * FROM dining_tables ORDER BY zone, name").fetchall())

def get_table(t_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM dining_tables WHERE id = ?", (t_id,)).fetchone()
    return row_to_dict(row) if row else None

def create_table(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute("INSERT INTO dining_tables (name, zone, seats) VALUES (?, ?, ?)",
        (data["name"], data.get("zone", ""), data.get("seats", 4)))
    conn.commit(); return cursor.lastrowid

def update_table(t_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "zone", "seats", "status"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(t_id); conn.execute(f"UPDATE dining_tables SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

def delete_table(t_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM dining_tables WHERE id = ?", (t_id,)); conn.commit()

# ══════════════ LOYALTY ══════════════
def add_loyalty_tx(data: dict) -> int:
    conn = get_connection()
    try:
        conn.execute("BEGIN TRANSACTION")
        cursor = conn.execute(
            "INSERT INTO loyalty_transactions (customer_id, date, points, type, order_id, note) VALUES (?, ?, ?, ?, ?, ?)",
            (data["customer_id"], now_str(), data["points"], data["type"], data.get("order_id"), data.get("note", "")))
        # Update customer points
        conn.execute("UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?", (data["points"], data["customer_id"]))
        conn.execute("COMMIT")
        return cursor.lastrowid
    except Exception as e:
        conn.execute("ROLLBACK")
        raise e

def list_loyalty_tx(customer_id: int, offset: int = 0, limit: int = 50):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM loyalty_transactions WHERE customer_id = ? ORDER BY id DESC LIMIT ? OFFSET ?", (customer_id, limit, offset)).fetchall()
    total = conn.execute("SELECT COUNT(*) FROM loyalty_transactions WHERE customer_id = ?", (customer_id,)).fetchone()[0]
    return rows_to_list(rows), total

# --- LOYALTY TIERS ---
def list_loyalty_tiers():
    conn = get_connection()
    return rows_to_list(conn.execute("SELECT * FROM loyalty_tiers ORDER BY min_points").fetchall())

def create_loyalty_tier(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO loyalty_tiers (name, min_points, multiplier, color) VALUES (?, ?, ?, ?)",
        (data["name"], data["min_points"], data.get("multiplier", 1.0), data.get("color", "#3b82f6")))
    conn.commit(); return cursor.lastrowid

def update_loyalty_tier(tier_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "min_points", "multiplier", "color"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(tier_id); conn.execute(f"UPDATE loyalty_tiers SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

def delete_loyalty_tier(tier_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM loyalty_tiers WHERE id = ?", (tier_id,)); conn.commit()

# ══════════════ PROMOTIONS ══════════════
def list_promotions(active_only: bool = False):
    conn = get_connection()
    sql = "SELECT * FROM promotions"; params = []
    if active_only: sql += " WHERE is_active = 1"
    sql += " ORDER BY id DESC"
    return rows_to_list(conn.execute(sql, params).fetchall())

def get_promotion(p_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM promotions WHERE id = ?", (p_id,)).fetchone()
    return row_to_dict(row) if row else None

def get_promotion_by_code(code: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM promotions WHERE code = ? AND is_active = 1", (code,)).fetchone()
    return row_to_dict(row) if row else None

def create_promotion(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO promotions (name, code, description, type, value, buy_quantity, get_quantity,
           target, target_ids_json, min_order_value, start_date, end_date, usage_limit, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["name"], data.get("code", ""), data.get("description", ""), data.get("type", "percentage"),
         data.get("value", 0), data.get("buy_quantity"), data.get("get_quantity"), data.get("target", "order"),
         data.get("target_ids_json", "[]"), data.get("min_order_value"), data["start_date"],
         data.get("end_date"), data.get("usage_limit"), 1 if data.get("is_active", True) else 0))
    conn.commit(); return cursor.lastrowid

def update_promotion(p_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "description", "value", "end_date", "usage_limit", "is_active"):
        if k in data and data[k] is not None:
            val = data[k]
            if k == "is_active": val = 1 if val else 0
            fields.append(f"{k} = ?"); values.append(val)
    if not fields: return
    values.append(p_id); conn.execute(f"UPDATE promotions SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

def increment_promo_usage(p_id: int):
    conn = get_connection()
    conn.execute("UPDATE promotions SET used_count = used_count + 1 WHERE id = ?", (p_id,)); conn.commit()

# ══════════════ INSTALLMENTS ══════════════
def create_plan(data: dict) -> int:
    conn = get_connection()
    remaining = data["total_amount"] - data.get("down_payment", 0)
    cursor = conn.execute(
        """INSERT INTO installment_plans (customer_id, order_id, principal_amount, total_amount, down_payment,
           remaining_amount, installment_count, installment_amount, start_date, notes,
           interest_type, interest_rate, total_interest_amount, late_fee_enabled, late_fee_type, late_fee_amount, grace_period_days)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["customer_id"], data.get("order_id"), data["principal_amount"], data["total_amount"],
         data.get("down_payment", 0), round(remaining, 2), data["installment_count"], data["installment_amount"],
         data["start_date"], data.get("notes", ""), data.get("interest_type", "none"),
         data.get("interest_rate", 0), data.get("total_interest_amount", 0),
         1 if data.get("late_fee_enabled") else 0, data.get("late_fee_type", "fixed"),
         data.get("late_fee_amount", 0), data.get("grace_period_days", 0)))
    conn.commit(); return cursor.lastrowid

def get_plan(plan_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM installment_plans WHERE id = ?", (plan_id,)).fetchone()
    return row_to_dict(row) if row else None

def list_plans(customer_id: int = None, status: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT ip.*, c.name as customer_name FROM installment_plans ip JOIN customers c ON c.id = ip.customer_id WHERE 1=1"; params = []
    if customer_id: base += " AND ip.customer_id = ?"; params.append(customer_id)
    if status: base += " AND ip.status = ?"; params.append(status)
    count_sql = base.replace("SELECT ip.*, c.name as customer_name", "SELECT COUNT(ip.id)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY ip.id DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total

def create_installment_payment(data: dict) -> int:
    conn = get_connection()
    try:
        conn.execute("BEGIN TRANSACTION")
        cursor = conn.execute(
            "INSERT INTO installment_payments (plan_id, customer_id, amount, principal_part, interest_part, due_date, paid_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?)",
            (data["plan_id"], data["customer_id"], data["amount"], data.get("principal_part", 0),
             data.get("interest_part", 0), data["due_date"], now_str(), data.get("notes", "")))
        # Update plan remaining
        conn.execute("UPDATE installment_plans SET remaining_amount = remaining_amount - ? WHERE id = ?", (data["amount"], data["plan_id"]))
        # Check if fully paid
        # Important: Fetching plan WITHIN transaction context here
        plan_row = conn.execute("SELECT remaining_amount FROM installment_plans WHERE id = ?", (data["plan_id"],)).fetchone()
        if plan_row and plan_row["remaining_amount"] <= 0:
            conn.execute("UPDATE installment_plans SET status = 'completed' WHERE id = ?", (data["plan_id"],))
        conn.execute("COMMIT")
        return cursor.lastrowid
    except Exception as e:
        conn.execute("ROLLBACK")
        raise e

def list_plan_payments(plan_id: int):
    conn = get_connection()
    return rows_to_list(conn.execute("SELECT * FROM installment_payments WHERE plan_id = ? ORDER BY due_date", (plan_id,)).fetchall())

# ══════════════ RENTALS ══════════════
def create_rental(data: dict) -> int:
    conn = get_connection()
    remaining = data.get("price", 0) - data.get("deposit", 0)
    cursor = conn.execute(
        """INSERT INTO rentals (customer_id, customer_name, customer_phone, customer_id_front, customer_id_back,
           product_id, product_name, product_image, booking_date, pickup_date, return_date,
           status, price, deposit, notes, size)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reserved', ?, ?, ?, ?)""",
        (data["customer_id"], data.get("customer_name", ""), data.get("customer_phone", ""),
         data.get("customer_id_front", ""), data.get("customer_id_back", ""),
         data["product_id"], data.get("product_name", ""), data.get("product_image", ""),
         data["booking_date"], data["pickup_date"], data["return_date"],
         data.get("price", 0), data.get("deposit", 0), data.get("notes", ""), data.get("size", "")))
    conn.commit(); return cursor.lastrowid

def get_rental(r_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM rentals WHERE id = ?", (r_id,)).fetchone()
    return row_to_dict(row) if row else None

def list_rentals(status: str = None, customer_id: int = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM rentals WHERE 1=1"; params = []
    if status: base += " AND status = ?"; params.append(status)
    if customer_id: base += " AND customer_id = ?"; params.append(customer_id)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY pickup_date DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    return rows_to_list(conn.execute(base, params).fetchall()), total

def update_rental(r_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("status", "actual_return_date", "is_deposit_returned", "notes"):
        if k in data and data[k] is not None:
            val = data[k]
            if k == "is_deposit_returned": val = 1 if val else 0
            fields.append(f"{k} = ?"); values.append(val)
    if not fields: return
    values.append(r_id); conn.execute(f"UPDATE rentals SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

# ══════════════ STUDIO CAMERAS & BOOKINGS ══════════════
def list_cameras():
    conn = get_connection()
    return rows_to_list(conn.execute("SELECT * FROM cameras WHERE status != 'retired' ORDER BY name").fetchall())

def get_camera(c_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM cameras WHERE id = ?", (c_id,)).fetchone()
    return row_to_dict(row) if row else None

def create_camera(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO cameras (name, category, model, serial_number, status, purchase_date, purchase_price, hourly_rate, daily_rate, session_rate, photo_rate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data["name"], data.get("category", "كاميرا"), data.get("model", ""), data.get("serial_number", ""),
         data.get("status", "available"), data.get("purchase_date"), data.get("purchase_price", 0),
         data.get("hourly_rate"), data.get("daily_rate"), data.get("session_rate"), data.get("photo_rate"), data.get("notes", "")))
    conn.commit(); return cursor.lastrowid

def update_camera(c_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "category", "model", "serial_number", "status", "purchase_date", "purchase_price", "hourly_rate", "daily_rate", "session_rate", "photo_rate", "notes"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(c_id); conn.execute(f"UPDATE cameras SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

def create_booking(data: dict) -> int:
    import json
    conn = get_connection()
    remaining = data.get("price", 0) - data.get("deposit", 0)
    cursor = conn.execute(
        """INSERT INTO studio_bookings (camera_id, camera_name, date, start_time, duration_hours, shift, event_type, pricing_type, quantity, unit_price,
           customer_name, customer_phone, technician_name, assigned_team, city, venue_type, address, price, deposit, remaining, notes, shooting_duration)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["camera_id"], data.get("camera_name", ""), data["date"], data.get("start_time", "18:00"), data.get("duration_hours", 0), data.get("shift", "full"),
         data.get("event_type", "أخرى"), data.get("pricing_type", "session"), data.get("quantity", 1), data.get("unit_price", 0),
         data["customer_name"], data.get("customer_phone", ""), data.get("technician_name", ""),
         json.dumps(data.get("assigned_team", [])),
         data.get("city", ""), data.get("venue_type", "studio"), data.get("address", ""),
         data.get("price", 0), data.get("deposit", 0), round(remaining, 2),
         data.get("notes", ""), data.get("shooting_duration")))
    conn.commit(); return cursor.lastrowid

def check_booking_conflict(camera_id: int, date: str, start_time: str, duration: int, current_booking_id: int = None):
    """Simple conflict check: If same camera on same date overlaps."""
    conn = get_connection()
    sql = "SELECT * FROM studio_bookings WHERE camera_id = ? AND date = ? AND status != 'cancelled'"
    params = [camera_id, date]
    if current_booking_id:
        sql += " AND id != ?"
        params.append(current_booking_id)
    
    rows = conn.execute(sql, params).fetchall()
    return len(rows) > 0

def list_bookings(camera_id: int = None, date: str = None, status: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM studio_bookings WHERE 1=1"; params = []
    if camera_id: base += " AND camera_id = ?"; params.append(camera_id)
    if date: base += " AND date = ?"; params.append(date)
    if status: base += " AND status = ?"; params.append(status)
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)"); total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"; params.extend([limit, offset])
    items = rows_to_list(conn.execute(base, params).fetchall())
    import json
    for item in items:
        try: item["assigned_team"] = json.loads(item.get("assigned_team", "[]"))
        except: item["assigned_team"] = []
    return items, total

def update_booking(b_id: int, data: dict):
    import json
    conn = get_connection()
    fields, values = [], []
    for k in ("status", "deposit", "is_paid", "notes", "assigned_team", "duration_hours"):
        if k in data and data[k] is not None:
            val = data[k]
            if k == "is_paid": val = 1 if val else 0
            if k == "assigned_team": val = json.dumps(val)
            fields.append(f"{k} = ?"); values.append(val)
    if "is_paid" in data and data["is_paid"]:
        fields.append("remaining = 0")
    if not fields: return
    values.append(b_id); conn.execute(f"UPDATE studio_bookings SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

def calculate_studio_stats():
    conn = get_connection()
    summary = conn.execute("""
        SELECT 
            COUNT(*) as total_bookings,
            SUM(price) as total_revenue,
            SUM(deposit) as total_deposits,
            SUM(remaining) as total_remaining
        FROM studio_bookings
        WHERE status != 'cancelled'
    """).fetchone()
    
    event_distribution = conn.execute("""
        SELECT event_type, COUNT(*) as count 
        FROM studio_bookings 
        WHERE status != 'cancelled'
        GROUP BY event_type
    """).fetchall()
    
    equipment_status = conn.execute("""
        SELECT status, COUNT(*) as count 
        FROM cameras 
        GROUP BY status
    """).fetchall()
    
    return {
        "summary": row_to_dict(summary),
        "events": {row[0]: row[1] for row in event_distribution},
        "equipment": {row[0]: row[1] for row in equipment_status}
    }

# ══════════════ TEAM MEMBERS ══════════════
def list_team_members(status: str = None):
    conn = get_connection()
    sql = "SELECT * FROM team_members"; params = []
    if status: sql += " WHERE status = ?"; params.append(status)
    sql += " ORDER BY name"
    return rows_to_list(conn.execute(sql, params).fetchall())

def get_team_member(m_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM team_members WHERE id = ?", (m_id,)).fetchone()
    return row_to_dict(row) if row else None

def create_team_member(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO team_members (name, role, phone, email, notes) VALUES (?, ?, ?, ?, ?)",
        (data["name"], data.get("role"), data.get("phone"), data.get("email"), data.get("notes")))
    conn.commit(); return cursor.lastrowid

def update_team_member(m_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("name", "role", "phone", "email", "notes", "status"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(m_id); conn.execute(f"UPDATE team_members SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

# ══════════════ PORTFOLIO ══════════════
def list_portfolio(category: str = None):
    conn = get_connection()
    sql = "SELECT * FROM studio_portfolio"; params = []
    if category: sql += " WHERE category = ?"; params.append(category)
    sql += " ORDER BY id DESC"
    return rows_to_list(conn.execute(sql, params).fetchall())

def create_portfolio_item(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO studio_portfolio (title, category, media_type, url, video_link, date) VALUES (?, ?, ?, ?, ?, ?)",
        (data["title"], data.get("category"), data.get("media_type"), data.get("url"), data.get("video_link"), data.get("date")))
    conn.commit(); return cursor.lastrowid

def update_portfolio_item(item_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    for k in ("title", "category", "media_type", "url", "video_link", "date"):
        if k in data and data[k] is not None: fields.append(f"{k} = ?"); values.append(data[k])
    if not fields: return
    values.append(item_id); conn.execute(f"UPDATE studio_portfolio SET {', '.join(fields)} WHERE id = ?", values); conn.commit()

def delete_portfolio_item(item_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM studio_portfolio WHERE id = ?", (item_id,)); conn.commit()

# ══════════════ SETTINGS LOGIC (BUG-13) ══════════════
def get_studio_settings():
    from app.repositories import settings_repo
    keys = ["studio_name", "studio_phone", "studio_address", "studio_slogan", "studio_invoice_footer", "studio_contract_terms"]
    all_settings = settings_repo.get_all()
    return {k.replace("studio_", ""): all_settings.get(k, "") for k in keys}

def update_studio_settings(payload: dict):
    from app.repositories import settings_repo
    mapping = {
        "name": "studio_name", "phone": "studio_phone", "address": "studio_address",
        "slogan": "studio_slogan", "invoice_footer": "studio_invoice_footer", "contract_terms": "studio_contract_terms"
    }
    for k, db_key in mapping.items():
        if k in payload:
            settings_repo.upsert(db_key, str(payload[k]))

def get_loyalty_settings():
    from app.repositories import settings_repo
    keys = ["loyalty_enabled", "loyalty_points_per_currency", "loyalty_currency_per_point", 
            "loyalty_min_points_to_redeem", "loyalty_welcome_bonus", "loyalty_enable_tiers"]
    all_settings = settings_repo.get_all()
    return {
        "enabled": all_settings.get("loyalty_enabled") == "1",
        "points_per_currency": float(all_settings.get("loyalty_points_per_currency", 10)),
        "currency_per_point": float(all_settings.get("loyalty_currency_per_point", 0.01)),
        "min_points_to_redeem": int(all_settings.get("loyalty_min_points_to_redeem", 100)),
        "welcome_bonus": int(all_settings.get("loyalty_welcome_bonus", 0)),
        "enable_tiers": all_settings.get("loyalty_enable_tiers") == "1"
    }

def update_loyalty_settings(data: dict):
    from app.repositories import settings_repo
    mapping = {
        "enabled": ("loyalty_enabled", lambda v: "1" if v else "0"),
        "points_per_currency": ("loyalty_points_per_currency", str),
        "currency_per_point": ("loyalty_currency_per_point", str),
        "min_points_to_redeem": ("loyalty_min_points_to_redeem", str),
        "welcome_bonus": ("loyalty_welcome_bonus", str),
        "enable_tiers": ("loyalty_enable_tiers", lambda v: "1" if v else "0")
    }
    for k, (db_key, transformer) in mapping.items():
        if k in data:
            settings_repo.update(db_key, transformer(data[k]))
