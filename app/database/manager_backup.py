"""Database schema creation, migrations, indexing, and seeding."""
import logging
from datetime import datetime
from app.database.connection import get_connection

logger = logging.getLogger(__name__)


def initialize_db():
    """Main entry — creates tables, runs migrations, indexes, and seeds."""
    conn = get_connection()
    cursor = conn.cursor()
    _create_tables(cursor)
    _run_migrations(cursor)
    conn.commit()
    _create_indexes(cursor)
    conn.commit()
    _seed_data(cursor)
    conn.commit()
    logger.info("Database initialized successfully.")


# ──────────────────────────────────────────────
# Tables
# ──────────────────────────────────────────────
def _create_tables(cursor):
    # ── Products (enhanced) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE,
        name TEXT NOT NULL,
        name_en TEXT DEFAULT '',
        price REAL NOT NULL DEFAULT 0,
        price_wholesale REAL NOT NULL DEFAULT 0,
        price_half_wholesale REAL NOT NULL DEFAULT 0,
        price_other REAL NOT NULL DEFAULT 0,
        cost_price REAL NOT NULL DEFAULT 0,
        stock_qty INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_important INTEGER NOT NULL DEFAULT 0,
        is_shortage INTEGER NOT NULL DEFAULT 0,
        barcode TEXT DEFAULT '',
        category TEXT DEFAULT '',
        image TEXT DEFAULT '',
        images_json TEXT DEFAULT '[]',
        parts_json TEXT DEFAULT '[]',
        type TEXT NOT NULL DEFAULT 'simple',
        composition_json TEXT DEFAULT '[]',
        is_favorite INTEGER NOT NULL DEFAULT 0,
        variants_json TEXT DEFAULT '[]',
        units_json TEXT DEFAULT '[]',
        track_serial INTEGER NOT NULL DEFAULT 0,
        alert_threshold INTEGER NOT NULL DEFAULT 10,
        updated_at TEXT
    )""")

    # ── Categories ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        description TEXT DEFAULT ''
    )""")

    # ── Orders (replaces invoices for v1.15 compatibility) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        subtotal REAL NOT NULL DEFAULT 0,
        tax REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        customer_id INTEGER,
        is_void INTEGER NOT NULL DEFAULT 0,
        voided_at TEXT,
        voided_by INTEGER,
        void_reason TEXT,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        paid_amount REAL NOT NULL DEFAULT 0,
        change_due REAL NOT NULL DEFAULT 0,
        discount_type TEXT NOT NULL DEFAULT 'none',
        discount_value REAL NOT NULL DEFAULT 0,
        discount_amount REAL NOT NULL DEFAULT 0,
        net_total REAL NOT NULL DEFAULT 0,
        branch_id INTEGER NOT NULL DEFAULT 1,
        tip_amount REAL NOT NULL DEFAULT 0,
        split_details_json TEXT DEFAULT '',
        fulfillment_status TEXT DEFAULT '',
        order_type TEXT DEFAULT '',
        table_number TEXT DEFAULT '',
        cashier_name TEXT DEFAULT '',
        note TEXT DEFAULT '',
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        qty INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        line_total REAL NOT NULL,
        item_discount_type TEXT NOT NULL DEFAULT 'none',
        item_discount_value REAL NOT NULL DEFAULT 0,
        item_discount_amount REAL NOT NULL DEFAULT 0,
        net_line_total REAL NOT NULL DEFAULT 0,
        bonus_qty REAL NOT NULL DEFAULT 0,
        note TEXT DEFAULT '',
        variant_name TEXT DEFAULT '',
        unit_name TEXT DEFAULT '',
        serials_json TEXT DEFAULT '[]',
        FOREIGN KEY(invoice_id) REFERENCES invoices(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Quotations ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        expiry_date TEXT,
        customer_name TEXT NOT NULL DEFAULT '',
        customer_id INTEGER,
        items_json TEXT NOT NULL DEFAULT '[]',
        subtotal REAL NOT NULL DEFAULT 0,
        discount_amount REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT DEFAULT '',
        created_by TEXT DEFAULT ''
    )""")

    # ── Customers (enhanced) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        name_en TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        address TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        total_spent REAL NOT NULL DEFAULT 0,
        total_purchases REAL NOT NULL DEFAULT 0,
        balance REAL NOT NULL DEFAULT 0,
        wallet_balance REAL NOT NULL DEFAULT 0,
        credit_limit REAL NOT NULL DEFAULT 0,
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        tags_json TEXT DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Customer Payments ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS customer_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'debt_payment',
        note TEXT DEFAULT '',
        recorded_by TEXT DEFAULT '',
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )""")

    # ── Suppliers (enhanced) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        name_en TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        tax_id TEXT DEFAULT '',
        address TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        contact_person TEXT DEFAULT '',
        balance REAL NOT NULL DEFAULT 0,
        total_purchases REAL NOT NULL DEFAULT 0,
        bank_name TEXT DEFAULT '',
        bank_account TEXT DEFAULT '',
        iban TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Expenses ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        date TEXT NOT NULL,
        notes TEXT DEFAULT '',
        payment_method TEXT DEFAULT 'cash',
        safe_id INTEGER DEFAULT 1,
        attachment TEXT DEFAULT ''
    )""")

    # ── Purchases ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        supplier_name TEXT DEFAULT '',
        date TEXT NOT NULL,
        items_json TEXT NOT NULL DEFAULT '[]',
        subtotal REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        discount_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        invoice_number TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        attachment TEXT DEFAULT '',
        FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )""")

    # ── Stock Adjustments ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        product_name TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'increase',
        quantity INTEGER NOT NULL,
        reason TEXT NOT NULL DEFAULT 'correction',
        date TEXT NOT NULL,
        notes TEXT DEFAULT '',
        warehouse_id INTEGER,
        warehouse_name TEXT DEFAULT '',
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Shifts ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        start_cash REAL NOT NULL DEFAULT 0,
        cash_sales REAL NOT NULL DEFAULT 0,
        card_sales REAL NOT NULL DEFAULT 0,
        expected_cash REAL NOT NULL DEFAULT 0,
        actual_cash REAL,
        difference REAL,
        status TEXT NOT NULL DEFAULT 'open',
        notes TEXT DEFAULT '',
        user_id INTEGER,
        branch_id INTEGER NOT NULL DEFAULT 1
    )""")

    # ── Services (Non-inventory items like Shipping, Install) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_en TEXT DEFAULT '',
        price REAL NOT NULL DEFAULT 0,
        category TEXT DEFAULT 'labor',
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Held Orders ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS held_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        items_json TEXT NOT NULL DEFAULT '[]',
        customer_id INTEGER,
        note TEXT DEFAULT ''
    )""")

    # ── Users (enhanced) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        pin TEXT DEFAULT '',
        pin_hash TEXT,
        pin_salt TEXT,
        role TEXT NOT NULL DEFAULT 'cashier',
        is_active INTEGER NOT NULL DEFAULT 1,
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        address TEXT DEFAULT '',
        id_card_image TEXT DEFAULT '',
        job_title TEXT DEFAULT '',
        bank_account TEXT DEFAULT '',
        start_date TEXT,
        contract_end_date TEXT,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS cashier_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        login_at TEXT NOT NULL,
        logout_at TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        branch_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS z_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_date TEXT UNIQUE,
        created_at TEXT,
        from_ts TEXT,
        to_ts TEXT,
        invoices_count INTEGER NOT NULL DEFAULT 0,
        gross_sales REAL NOT NULL DEFAULT 0,
        subtotal_sum REAL NOT NULL DEFAULT 0,
        tax_sum REAL NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        branch_id INTEGER NOT NULL DEFAULT 1
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        original_invoice_id INTEGER NOT NULL,
        customer_id INTEGER,
        user_id INTEGER NOT NULL,
        refund_method TEXT NOT NULL DEFAULT 'cash',
        refund_amount REAL NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        branch_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY(original_invoice_id) REFERENCES invoices(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        qty INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        line_total REAL NOT NULL,
        FOREIGN KEY(return_id) REFERENCES returns(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL,
        qty_delta INTEGER NOT NULL,
        reference_type TEXT NOT NULL DEFAULT 'manual',
        reference_id INTEGER,
        user_id INTEGER,
        notes TEXT DEFAULT '',
        branch_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS ops_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        branch_id INTEGER NOT NULL,
        user_id INTEGER,
        role TEXT,
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        payload_json TEXT NOT NULL,
        event_uid TEXT,
        status TEXT NOT NULL DEFAULT 'success'
    )""")

    # ── Warehouses ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        is_main INTEGER NOT NULL DEFAULT 0
    )""")

    # ── Inventory Items (per warehouse) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        warehouse_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY(product_id) REFERENCES products(id),
        UNIQUE(warehouse_id, product_id)
    )""")

    # ── Product Batches ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS product_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        product_name TEXT DEFAULT '',
        warehouse_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        expiry_date TEXT,
        batch_number TEXT DEFAULT '',
        received_date TEXT NOT NULL,
        cost_price REAL NOT NULL DEFAULT 0,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(warehouse_id) REFERENCES warehouses(id)
    )""")

    # ── Product Serials ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS product_serials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        serial_number TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        warehouse_id INTEGER,
        purchase_id INTEGER,
        order_id INTEGER,
        date_added TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Dining Tables (Restaurant) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS dining_tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        zone TEXT NOT NULL DEFAULT '',
        seats INTEGER NOT NULL DEFAULT 4,
        status TEXT NOT NULL DEFAULT 'available'
    )""")

    # ── Loyalty Transactions ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        points INTEGER NOT NULL,
        type TEXT NOT NULL,
        order_id INTEGER,
        note TEXT DEFAULT '',
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )""")

    # ── Promotions ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT DEFAULT '',
        description TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'percentage',
        value REAL NOT NULL DEFAULT 0,
        buy_quantity INTEGER,
        get_quantity INTEGER,
        target TEXT NOT NULL DEFAULT 'order',
        target_ids_json TEXT DEFAULT '[]',
        min_order_value REAL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        usage_limit INTEGER,
        used_count INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Installment Plans ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS installment_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_id INTEGER,
        principal_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        down_payment REAL NOT NULL DEFAULT 0,
        remaining_amount REAL NOT NULL DEFAULT 0,
        installment_count INTEGER NOT NULL,
        installment_amount REAL NOT NULL DEFAULT 0,
        start_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT DEFAULT '',
        interest_type TEXT NOT NULL DEFAULT 'none',
        interest_rate REAL NOT NULL DEFAULT 0,
        total_interest_amount REAL NOT NULL DEFAULT 0,
        late_fee_enabled INTEGER NOT NULL DEFAULT 0,
        late_fee_type TEXT DEFAULT 'fixed',
        late_fee_amount REAL NOT NULL DEFAULT 0,
        grace_period_days INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )""")

    # ── Installment Payments ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS installment_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        principal_part REAL NOT NULL DEFAULT 0,
        interest_part REAL NOT NULL DEFAULT 0,
        due_date TEXT NOT NULL,
        paid_date TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        late_fee_applied REAL NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        FOREIGN KEY(plan_id) REFERENCES installment_plans(id),
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )""")

    # ── Rentals ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS rentals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        customer_name TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        customer_id_front TEXT DEFAULT '',
        customer_id_back TEXT DEFAULT '',
        product_id INTEGER NOT NULL,
        product_name TEXT DEFAULT '',
        product_image TEXT DEFAULT '',
        booking_date TEXT NOT NULL,
        pickup_date TEXT NOT NULL,
        return_date TEXT NOT NULL,
        actual_return_date TEXT,
        status TEXT NOT NULL DEFAULT 'reserved',
        price REAL NOT NULL DEFAULT 0,
        deposit REAL NOT NULL DEFAULT 0,
        is_deposit_returned INTEGER NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        size TEXT DEFAULT '',
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Cameras (Studio) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS cameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        model TEXT DEFAULT '',
        serial_number TEXT DEFAULT '',
        hourly_rate REAL,
        daily_rate REAL,
        session_rate REAL,
        photo_rate REAL,
        status TEXT NOT NULL DEFAULT 'active'
    )""")

    # ── Studio Bookings ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS studio_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera_id INTEGER NOT NULL,
        camera_name TEXT DEFAULT '',
        date TEXT NOT NULL,
        shift TEXT NOT NULL DEFAULT 'full',
        status TEXT NOT NULL DEFAULT 'pending',
        pricing_type TEXT NOT NULL DEFAULT 'session',
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        customer_name TEXT NOT NULL,
        customer_phone TEXT DEFAULT '',
        technician_name TEXT DEFAULT '',
        city TEXT DEFAULT '',
        venue_type TEXT DEFAULT 'studio',
        address TEXT DEFAULT '',
        price REAL NOT NULL DEFAULT 0,
        deposit REAL NOT NULL DEFAULT 0,
        remaining REAL NOT NULL DEFAULT 0,
        is_paid INTEGER NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        shooting_duration INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(camera_id) REFERENCES cameras(id)
    )""")

    # ── Payroll Records ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS payroll_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL DEFAULT '',
        month TEXT NOT NULL,
        base_salary REAL NOT NULL DEFAULT 0,
        days_worked INTEGER NOT NULL DEFAULT 30,
        earned_base REAL NOT NULL DEFAULT 0,
        bonus REAL NOT NULL DEFAULT 0,
        deductions REAL NOT NULL DEFAULT 0,
        net_salary REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        status TEXT NOT NULL DEFAULT 'processed',
        processed_at TEXT NOT NULL DEFAULT (datetime('now')),
        expense_id INTEGER,
        notes TEXT DEFAULT '',
        FOREIGN KEY(user_id) REFERENCES users(id)
    )""")

    # ── Activity Logs (Logbook) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL DEFAULT (datetime('now')),
        type TEXT NOT NULL DEFAULT 'system',
        action TEXT NOT NULL,
        details TEXT DEFAULT '',
        user_name TEXT NOT NULL DEFAULT 'system',
        amount REAL,
        reference_id INTEGER,
        status TEXT NOT NULL DEFAULT 'success',
        branch_id INTEGER NOT NULL DEFAULT 1
    )""")

    # ── Cheque Management (أوراق القبض والدفع) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS cheques (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL, -- 'payable' or 'receivable'
        cheque_number TEXT NOT NULL,
        bank_name TEXT,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'collected', 'returned', 'void'
        customer_id INTEGER,
        supplier_id INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )""")

    # ── Label Templates (Barcode / Sticker Printing) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS label_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'barcode',
        width REAL NOT NULL DEFAULT 50,
        height REAL NOT NULL DEFAULT 30,
        horizontal_gap REAL NOT NULL DEFAULT 2,
        vertical_gap REAL NOT NULL DEFAULT 2,
        horizontal_offset REAL NOT NULL DEFAULT 0, -- Calibration
        vertical_offset REAL NOT NULL DEFAULT 0,   -- Calibration
        column_count INTEGER NOT NULL DEFAULT 1,
        font_size INTEGER NOT NULL DEFAULT 12,
        show_name INTEGER NOT NULL DEFAULT 1,
        show_price INTEGER NOT NULL DEFAULT 1,
        show_code INTEGER NOT NULL DEFAULT 1,
        show_store_name INTEGER NOT NULL DEFAULT 0,
        custom_text TEXT DEFAULT '',
        barcode_format TEXT NOT NULL DEFAULT 'CODE128',
        paper_type TEXT NOT NULL DEFAULT 'thermal',
        labels_per_row INTEGER NOT NULL DEFAULT 2,
        design_type TEXT DEFAULT 'standard',
        config_json TEXT DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ══════════════════════════════════════════════
    # PHASE 3 — NEW OPERATIONAL MODULES
    # ══════════════════════════════════════════════

    # ── Attendance Records  (الحضور والانصراف) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        check_in TEXT,
        check_out TEXT,
        hours_worked REAL NOT NULL DEFAULT 0,
        overtime_hours REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'present',
        notes TEXT DEFAULT '',
        branch_id INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )""")

    # ── Inventory Counts (الجرد الدوري) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS inventory_counts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        warehouse_id INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'draft',
        counted_by TEXT NOT NULL DEFAULT '',
        approved_by TEXT DEFAULT '',
        total_products INTEGER NOT NULL DEFAULT 0,
        matched INTEGER NOT NULL DEFAULT 0,
        surplus INTEGER NOT NULL DEFAULT 0,
        deficit INTEGER NOT NULL DEFAULT 0,
        total_variance_value REAL NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        FOREIGN KEY(warehouse_id) REFERENCES warehouses(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS inventory_count_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        count_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL DEFAULT '',
        system_qty REAL NOT NULL DEFAULT 0,
        actual_qty REAL NOT NULL DEFAULT 0,
        variance REAL NOT NULL DEFAULT 0,
        unit_cost REAL NOT NULL DEFAULT 0,
        variance_value REAL NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        FOREIGN KEY(count_id) REFERENCES inventory_counts(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Branch Transfers (التحويلات بين الفروع) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS branch_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT UNIQUE,
        from_warehouse_id INTEGER NOT NULL,
        to_warehouse_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_by TEXT NOT NULL DEFAULT '',
        approved_by TEXT DEFAULT '',
        total_items INTEGER NOT NULL DEFAULT 0,
        total_qty REAL NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        FOREIGN KEY(from_warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY(to_warehouse_id) REFERENCES warehouses(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS branch_transfer_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL DEFAULT '',
        requested_qty REAL NOT NULL DEFAULT 0,
        sent_qty REAL NOT NULL DEFAULT 0,
        received_qty REAL NOT NULL DEFAULT 0,
        unit_cost REAL NOT NULL DEFAULT 0,
        FOREIGN KEY(transfer_id) REFERENCES branch_transfers(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Maintenance Orders (أوامر الصيانة) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS maintenance_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE,
        customer_name TEXT NOT NULL,
        customer_phone TEXT DEFAULT '',
        device_type TEXT NOT NULL DEFAULT '',
        device_brand TEXT DEFAULT '',
        device_model TEXT DEFAULT '',
        serial_number TEXT DEFAULT '',
        problem_description TEXT NOT NULL DEFAULT '',
        diagnosis TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'received',
        priority TEXT NOT NULL DEFAULT 'normal',
        estimated_cost REAL NOT NULL DEFAULT 0,
        final_cost REAL NOT NULL DEFAULT 0,
        paid_amount REAL NOT NULL DEFAULT 0,
        parts_used_json TEXT DEFAULT '[]',
        technician TEXT DEFAULT '',
        warranty_days INTEGER NOT NULL DEFAULT 0,
        received_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        delivered_at TEXT,
        notes TEXT DEFAULT '',
        branch_id INTEGER NOT NULL DEFAULT 1
    )""")

    # ── Maintenance Status History ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS maintenance_status_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        old_status TEXT,
        new_status TEXT,
        notes TEXT,
        changed_by TEXT,
        changed_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(order_id) REFERENCES maintenance_orders(id) ON DELETE CASCADE
    )""")

    # ── Maintenance Images ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS maintenance_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        kind TEXT NOT NULL, -- 'before', 'after', 'customer_photo'
        original_name TEXT,
        stored_path TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(order_id) REFERENCES maintenance_orders(id) ON DELETE CASCADE
    )""")

    # ── Maintenance Invoice Snapshots ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS maintenance_invoice_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        version INTEGER NOT NULL,
        reason TEXT,
        payload_json TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(order_id) REFERENCES maintenance_orders(id) ON DELETE CASCADE
    )""")

    # ── Device Models Catalog ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS device_models_catalog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_type TEXT NOT NULL,
        model TEXT NOT NULL,
        brand TEXT DEFAULT '',
        notes TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Recipes / BOM (الوصفات ومكونات الإنتاج) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL DEFAULT '',
        yield_qty REAL NOT NULL DEFAULT 1,
        total_cost REAL NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS recipe_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        ingredient_id INTEGER NOT NULL,
        ingredient_name TEXT NOT NULL DEFAULT '',
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'unit',
        unit_cost REAL NOT NULL DEFAULT 0,
        line_cost REAL NOT NULL DEFAULT 0,
        FOREIGN KEY(recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY(ingredient_id) REFERENCES products(id)
    )""")

    # ── Delivery Assignments (التوصيل والمندوبين) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS delivery_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        driver_id INTEGER,
        driver_name TEXT NOT NULL DEFAULT '',
        customer_name TEXT NOT NULL DEFAULT '',
        customer_phone TEXT DEFAULT '',
        delivery_address TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        delivery_fee REAL NOT NULL DEFAULT 0,
        collected_amount REAL NOT NULL DEFAULT 0,
        is_settled INTEGER NOT NULL DEFAULT 0,
        assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
        picked_at TEXT,
        delivered_at TEXT,
        notes TEXT DEFAULT '',
        branch_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY(invoice_id) REFERENCES invoices(id),
        FOREIGN KEY(driver_id) REFERENCES users(id)
    )""")

    # ── Loyalty Tiers ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS loyalty_tiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        min_points INTEGER NOT NULL DEFAULT 0,
        multiplier REAL NOT NULL DEFAULT 1.0,
        color TEXT DEFAULT '#3b82f6'
    )""")

    # ── Employee Documents / Files ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS employee_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_path TEXT DEFAULT '',
        uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )""")

    # ── Purchase Orders (أوامر الشراء) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        po_number TEXT UNIQUE,
        supplier_id INTEGER NOT NULL,
        supplier_name TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        total_items INTEGER NOT NULL DEFAULT 0,
        subtotal REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        expected_date TEXT,
        received_date TEXT,
        purchase_id INTEGER,
        notes TEXT DEFAULT '',
        created_by TEXT NOT NULL DEFAULT '',
        approved_by TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        po_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL DEFAULT '',
        ordered_qty REAL NOT NULL DEFAULT 0,
        received_qty REAL NOT NULL DEFAULT 0,
        bonus_qty REAL NOT NULL DEFAULT 0,
        unit_price REAL NOT NULL DEFAULT 0,
        line_total REAL NOT NULL DEFAULT 0,
        FOREIGN KEY(po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ══════════════════════════════════════════════
    # ACCOUNTING MODULE
    # ══════════════════════════════════════════════

    # ── Chart of Accounts ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT DEFAULT '',
        balance REAL NOT NULL DEFAULT 0,
        is_system INTEGER NOT NULL DEFAULT 0
    )""")

    # ── Journal Entries ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        reference TEXT DEFAULT '',
        description TEXT NOT NULL,
        total_amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        created_by TEXT DEFAULT ''
    )""")

    # ── Journal Entry Lines ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        account_name TEXT DEFAULT '',
        debit REAL NOT NULL DEFAULT 0,
        credit REAL NOT NULL DEFAULT 0,
        description TEXT DEFAULT '',
        cost_center_id INTEGER,
        FOREIGN KEY(entry_id) REFERENCES journal_entries(id),
        FOREIGN KEY(account_id) REFERENCES accounts(id)
    )""")

    # ── Bank Checks ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS bank_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL,
        amount REAL NOT NULL,
        bank_name TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'receivable',
        status TEXT NOT NULL DEFAULT 'pending',
        payee_name TEXT NOT NULL DEFAULT '',
        payee_id INTEGER,
        notes TEXT DEFAULT '',
        image TEXT DEFAULT ''
    )""")

    # ── Cost Centers ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS cost_centers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        budget REAL
    )""")

    # ── Fixed Assets ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS fixed_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cost REAL NOT NULL DEFAULT 0,
        value REAL NOT NULL DEFAULT 0,
        salvage_value REAL NOT NULL DEFAULT 0,
        purchase_date TEXT NOT NULL,
        life_in_years INTEGER NOT NULL DEFAULT 5,
        accumulated_depreciation REAL NOT NULL DEFAULT 0,
        note TEXT DEFAULT '',
        category TEXT DEFAULT '',
        serial_number TEXT DEFAULT '',
        location TEXT DEFAULT ''
    )""")

    # ── Fiscal Years ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS fiscal_years (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        closed_at TEXT
    )""")

    # ── Bank Reconciliations ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS bank_reconciliations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        statement_date TEXT NOT NULL,
        statement_balance REAL NOT NULL DEFAULT 0,
        reconciled_entry_ids_json TEXT DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(account_id) REFERENCES accounts(id)
    )""")

    # ── Safes (الخزائن والصناديق) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS safes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        branch_id INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Safe Transfers (حركة النقل بين الخزائن) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS safe_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_safe_id INTEGER NOT NULL,
        to_safe_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        transferor_id INTEGER, -- الموظف المحول
        receiver_id INTEGER,   -- الموظف المستلم
        notes TEXT DEFAULT '',
        transfer_date TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(from_safe_id) REFERENCES safes(id),
        FOREIGN KEY(to_safe_id) REFERENCES safes(id),
        FOREIGN KEY(transferor_id) REFERENCES users(id),
        FOREIGN KEY(receiver_id) REFERENCES users(id)
    )""")

    logger.info("All tables created.")


# ──────────────────────────────────────────────
# Migrations
# ──────────────────────────────────────────────
def _run_migrations(cursor):
    defaults = [
        ("read_only_mode", "0"),
        ("cashier_can_discount", "0"),
        ("cashier_can_return", "0"),
        ("tax_rate", "15"),
        ("currency", "SAR"),
        ("currency_code", "SAR"),
        ("store_name", "My Store"),
        ("receipt_footer", "Thank you!"),
        ("low_stock_threshold", "10"),
        ("ui_rtl", "0"),
        ("setup_completed", "0"),
        ("business_type", "retail"),
        ("app_mode", "standard"),
        ("language", "ar"),
        ("enable_accounting", "0"),
        ("receipt_header", ""),
        ("printer_width", "80mm"),
        ("auto_print", "0"),
        ("enable_qr", "0"),
        ("require_pin_for_refund", "0"),
        ("enable_sounds", "1"),
        ("loyalty_enabled", "0"),
        ("loyalty_points_per_currency", "1"),
        ("loyalty_currency_per_point", "0.1"),
        ("loyalty_min_redeem", "100"),
        ("loyalty_welcome_bonus", "0"),
        ("initial_capital", "0"),
        ("enable_payroll", "1"),
        ("standard_work_days", "30"),
    ]
    for key, value in defaults:
        cursor.execute(
            "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)",
            (key, value),
        )


# ──────────────────────────────────────────────
# Indexes
# ──────────────────────────────────────────────
def _create_indexes(cursor):
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_invoices_void ON invoices(is_void)",
        "CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id)",
        "CREATE INDEX IF NOT EXISTS idx_invoices_branch ON invoices(branch_id, created_at)",
        "CREATE INDEX IF NOT EXISTS idx_invoices_order_type ON invoices(order_type)",
        "CREATE INDEX IF NOT EXISTS idx_invoices_fulfillment ON invoices(fulfillment_status)",
        "CREATE INDEX IF NOT EXISTS idx_invoice_items_inv ON invoice_items(invoice_id)",
        "CREATE INDEX IF NOT EXISTS idx_invoice_items_prod ON invoice_items(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)",
        "CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)",
        "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
        "CREATE INDEX IF NOT EXISTS idx_products_type ON products(type)",
        "CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code)",
        "CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)",
        "CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code)",
        "CREATE INDEX IF NOT EXISTS idx_sessions_login ON cashier_sessions(login_at)",
        "CREATE INDEX IF NOT EXISTS idx_sessions_branch ON cashier_sessions(branch_id)",
        "CREATE INDEX IF NOT EXISTS idx_returns_inv ON returns(original_invoice_id)",
        "CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_return_items_ret ON return_items(return_id)",
        "CREATE INDEX IF NOT EXISTS idx_stock_mov_prod ON stock_movements(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_stock_mov_date ON stock_movements(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_z_reports_branch ON z_reports(branch_id)",
        "CREATE INDEX IF NOT EXISTS idx_ops_log_created ON ops_log(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_ops_log_branch ON ops_log(branch_id, created_at)",
        # New indexes
        "CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(date)",
        "CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status)",
        "CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id)",
        "CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)",
        "CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)",
        "CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date)",
        "CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id)",
        "CREATE INDEX IF NOT EXISTS idx_stock_adj_product ON stock_adjustments(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_stock_adj_date ON stock_adjustments(date)",
        "CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status)",
        "CREATE INDEX IF NOT EXISTS idx_shifts_start ON shifts(start_time)",
        "CREATE INDEX IF NOT EXISTS idx_customer_payments_cust ON customer_payments(customer_id)",
        "CREATE INDEX IF NOT EXISTS idx_customer_payments_date ON customer_payments(date)",
        "CREATE INDEX IF NOT EXISTS idx_inventory_items_wh ON inventory_items(warehouse_id)",
        "CREATE INDEX IF NOT EXISTS idx_inventory_items_prod ON inventory_items(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_batches_product ON product_batches(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_batches_expiry ON product_batches(expiry_date)",
        "CREATE INDEX IF NOT EXISTS idx_serials_product ON product_serials(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_serials_serial ON product_serials(serial_number)",
        "CREATE INDEX IF NOT EXISTS idx_serials_status ON product_serials(status)",
        "CREATE INDEX IF NOT EXISTS idx_tables_status ON dining_tables(status)",
        "CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_transactions(customer_id)",
        "CREATE INDEX IF NOT EXISTS idx_loyalty_date ON loyalty_transactions(date)",
        "CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active)",
        "CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code)",
        "CREATE INDEX IF NOT EXISTS idx_installment_plans_cust ON installment_plans(customer_id)",
        "CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status)",
        "CREATE INDEX IF NOT EXISTS idx_installment_pay_plan ON installment_payments(plan_id)",
        "CREATE INDEX IF NOT EXISTS idx_installment_pay_due ON installment_payments(due_date)",
        "CREATE INDEX IF NOT EXISTS idx_rentals_customer ON rentals(customer_id)",
        "CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status)",
        "CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(pickup_date, return_date)",
        "CREATE INDEX IF NOT EXISTS idx_studio_bookings_date ON studio_bookings(date)",
        "CREATE INDEX IF NOT EXISTS idx_studio_bookings_camera ON studio_bookings(camera_id)",
        "CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code)",
        "CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type)",
        "CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date)",
        "CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_entry_lines(entry_id)",
        "CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_entry_lines(account_id)",
        "CREATE INDEX IF NOT EXISTS idx_checks_due ON bank_checks(due_date)",
        "CREATE INDEX IF NOT EXISTS idx_checks_status ON bank_checks(status)",
        "CREATE INDEX IF NOT EXISTS idx_checks_type ON bank_checks(type)",
        "CREATE INDEX IF NOT EXISTS idx_assets_category ON fixed_assets(category)",
        "CREATE INDEX IF NOT EXISTS idx_fiscal_years_status ON fiscal_years(status)",
        "CREATE INDEX IF NOT EXISTS idx_reconciliations_account ON bank_reconciliations(account_id)",
        # Phase 2: Payroll, Logs, Labels
        "CREATE INDEX IF NOT EXISTS idx_payroll_user ON payroll_records(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll_records(month)",
        "CREATE INDEX IF NOT EXISTS idx_payroll_user_month ON payroll_records(user_id, month)",
        "CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(date)",
        "CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type)",
        "CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON activity_logs(status)",
        "CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_name)",
        "CREATE INDEX IF NOT EXISTS idx_label_templates_type ON label_templates(type)",
        # Phase 3: Attendance, InventoryCount, BranchTransfers, Maintenance, Recipes, Delivery, PurchaseOrders
        "CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date)",
        "CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, date)",
        "CREATE INDEX IF NOT EXISTS idx_inv_counts_status ON inventory_counts(status)",
        "CREATE INDEX IF NOT EXISTS idx_inv_counts_wh ON inventory_counts(warehouse_id)",
        "CREATE INDEX IF NOT EXISTS idx_inv_count_items_count ON inventory_count_items(count_id)",
        "CREATE INDEX IF NOT EXISTS idx_inv_count_items_prod ON inventory_count_items(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_transfers_status ON branch_transfers(status)",
        "CREATE INDEX IF NOT EXISTS idx_transfers_from ON branch_transfers(from_warehouse_id)",
        "CREATE INDEX IF NOT EXISTS idx_transfers_to ON branch_transfers(to_warehouse_id)",
        "CREATE INDEX IF NOT EXISTS idx_transfer_items_tid ON branch_transfer_items(transfer_id)",
        "CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_orders(status)",
        "CREATE INDEX IF NOT EXISTS idx_maintenance_customer ON maintenance_orders(customer_name)",
        "CREATE INDEX IF NOT EXISTS idx_recipes_product ON recipes(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id)",
        "CREATE INDEX IF NOT EXISTS idx_recipe_items_ingredient ON recipe_items(ingredient_id)",
        "CREATE INDEX IF NOT EXISTS idx_delivery_status ON delivery_assignments(status)",
        "CREATE INDEX IF NOT EXISTS idx_delivery_driver ON delivery_assignments(driver_id)",
        "CREATE INDEX IF NOT EXISTS idx_delivery_invoice ON delivery_assignments(invoice_id)",
        "CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status)",
        "CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id)",
        "CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id)",
    ]
    for sql in indexes:
        cursor.execute(sql)


# ──────────────────────────────────────────────
# Seed Data
# ──────────────────────────────────────────────
def _seed_data(cursor):
    """Seed default branch, owner user, warehouse, and accounting chart."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Default branch
    cursor.execute(
        "INSERT OR IGNORE INTO branches (id, code, name, created_at) VALUES (1, 'BR01', 'Main Branch', ?)",
        (now,),
    )

    # Default owner (PIN: 1234)
    import hashlib, os as _os
    salt = _os.urandom(16).hex()
    pin_hash = hashlib.pbkdf2_hmac("sha256", b"1234", bytes.fromhex(salt), 100_000).hex()
    cursor.execute(
        "INSERT OR IGNORE INTO users (id, username, pin_hash, pin_salt, role, created_at) "
        "VALUES (1, 'owner', ?, ?, 'owner', ?)",
        (pin_hash, salt, now),
    )

    # Default warehouse
    cursor.execute(
        "INSERT OR IGNORE INTO warehouses (id, name, is_main) VALUES (1, 'Main Warehouse', 1)"
    )

    # Default accounting chart of accounts
    default_accounts = [
        ("1010", "الصندوق (الكاش)", "asset", 1),
        ("1020", "البنك", "asset", 1),
        ("1030", "العملاء (ذمم مدينة)", "asset", 1),
        ("1040", "المخزون", "asset", 1),
        ("1050", "أوراق قبض", "asset", 1),
        ("1100", "الأصول الثابتة", "asset", 0),
        ("1110", "مجمع الإهلاك", "asset", 0),
        ("2010", "الموردين (ذمم دائنة)", "liability", 1),
        ("2020", "ضريبة مستحقة", "liability", 1),
        ("2030", "أوراق دفع", "liability", 1),
        ("3010", "رأس المال", "equity", 1),
        ("3020", "الأرباح المبقاة", "equity", 1),
        ("3030", "المسحوبات الشخصية", "equity", 0),
        ("4010", "المبيعات", "revenue", 1),
        ("4020", "إيرادات أخرى", "revenue", 0),
        ("4030", "خصم مكتسب", "revenue", 0),
        ("5010", "تكلفة البضاعة المباعة", "expense", 1),
        ("5020", "الإيجار", "expense", 0),
        ("5030", "الرواتب والأجور", "expense", 0),
        ("5040", "الكهرباء والماء", "expense", 0),
        ("5050", "خصم مسموح به", "expense", 0),
        ("5060", "مصروفات نثرية", "expense", 0),
        ("5070", "مصروف الإهلاك", "expense", 0),
    ]
    for code, name, acc_type, is_system in default_accounts:
        cursor.execute(
            "INSERT OR IGNORE INTO accounts (code, name, type, is_system) VALUES (?, ?, ?, ?)",
            (code, name, acc_type, is_system),
        )

    # Default safe
    cursor.execute(
        "INSERT OR IGNORE INTO safes (id, name, balance, is_active) VALUES (1, 'Main Safe', 0, 1)"
    )

    # Default App Settings
    app_settings = [
        ("costing_method", "weighted_average"),
        ("auto_backup_on_close", "0"),
        ("low_stock_threshold", "10"),
    ]
    for key, value in app_settings:
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", (key, value))

    logger.info("Seed data applied.")
