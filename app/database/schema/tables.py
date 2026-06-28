import logging

logger = logging.getLogger(__name__)

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
        tax_rate REAL DEFAULT 15,
        tax_type TEXT DEFAULT 'standard',
        color TEXT DEFAULT '',
        size TEXT DEFAULT '',
        material TEXT DEFAULT '',
        is_bundle INTEGER NOT NULL DEFAULT 0,
        reorder_level INTEGER NOT NULL DEFAULT 5,
        brand_id INTEGER,
        origin_id INTEGER,
        location_id INTEGER,
        manufacturer_id INTEGER,
        model_number TEXT,
        currency_id INTEGER DEFAULT 1,
        exchange_rate REAL DEFAULT 1.0,
        ref_currency_id INTEGER,
        ref_cost_price REAL,
        last_sold_at TEXT,
        updated_at TEXT
    )""")

    # ── Categories ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        description TEXT DEFAULT '',
        default_margin_pct REAL DEFAULT 20
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
        refunded_amount REAL NOT NULL DEFAULT 0,
        currency_id INTEGER DEFAULT 1,
        exchange_rate REAL DEFAULT 1.0,
        branch_id INTEGER NOT NULL DEFAULT 1,
        tip_amount REAL NOT NULL DEFAULT 0,
        split_details_json TEXT DEFAULT '',
        fulfillment_status TEXT DEFAULT '',
        order_type TEXT DEFAULT '',
        table_number TEXT DEFAULT '',
        cashier_name TEXT DEFAULT '',
        note TEXT DEFAULT '',
        uuid TEXT,
        invoice_hash TEXT,
        previous_invoice_hash TEXT,
        zatca_status TEXT DEFAULT 'pending',
        qr_code TEXT,
        zatca_warnings TEXT,
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
        tax_rate REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
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
        birth_date TEXT,
        tier TEXT NOT NULL DEFAULT 'Bronze',
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
        currency_id INTEGER DEFAULT 1,
        exchange_rate REAL DEFAULT 1.0,
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
        returns_count INTEGER NOT NULL DEFAULT 0,
        returns_total REAL NOT NULL DEFAULT 0,
        expenses_count INTEGER NOT NULL DEFAULT 0,
        expenses_total REAL NOT NULL DEFAULT 0,
        net_profit REAL NOT NULL DEFAULT 0,
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
    cursor.execute('''CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_no TEXT UNIQUE,
        product_id INTEGER NOT NULL,
        output_qty REAL DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )''')

    cursor.execute('''CREATE TABLE IF NOT EXISTS recipe_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        ingredient_id INTEGER NOT NULL,
        qty REAL NOT NULL,
        wastage_pct REAL DEFAULT 0,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id),
        FOREIGN KEY (ingredient_id) REFERENCES products(id)
    )''')

    # Recipe Batches (Manufacturing History)
    cursor.execute('''CREATE TABLE IF NOT EXISTS recipe_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_no TEXT UNIQUE,
        recipe_id INTEGER NOT NULL,
        output_qty REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    )''')

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
        created_by TEXT DEFAULT '',
        currency_id INTEGER DEFAULT 1,
        exchange_rate REAL DEFAULT 1.0
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
        currency_id INTEGER DEFAULT 1,
        exchange_rate REAL DEFAULT 1.0,
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
        location TEXT DEFAULT '', -- Current branch or specific site
        status TEXT DEFAULT 'Active', -- Active, Under Maintenance, Retired, Disposed
        last_maintenance_date TEXT,
        maintenance_interval_days INTEGER DEFAULT 0, -- 0 means no scheduled maintenance
        last_depreciation_date TEXT
    )""")

    # ── Asset Movements (Phase 13) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS asset_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        from_location TEXT,
        to_location TEXT NOT NULL,
        movement_date TEXT NOT NULL DEFAULT (datetime('now')),
        authorized_by TEXT,
        reason TEXT,
        FOREIGN KEY(asset_id) REFERENCES fixed_assets(id)
    )""")

    # ── Asset Maintenance Log (Phase 13) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS asset_maintenance_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        maintenance_date TEXT NOT NULL,
        maintenance_type TEXT, -- Routine, Repair, Overhaul
        cost REAL DEFAULT 0,
        performed_by TEXT,
        details TEXT,
        next_due_date TEXT,
        FOREIGN KEY(asset_id) REFERENCES fixed_assets(id)
    )""")

    # ── Product Batches (Phase 8/14) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS product_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        batch_number TEXT NOT NULL,
        expiry_date TEXT,
        initial_qty REAL NOT NULL DEFAULT 0,
        current_qty REAL NOT NULL DEFAULT 0,
        purchase_id INTEGER,
        qc_status TEXT DEFAULT 'Pending', -- Pending, Passed, Failed
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Depreciation Log (Phase 8) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS depreciation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        depreciation_date TEXT NOT NULL,
        amount REAL NOT NULL,
        entry_id INTEGER, -- Link to journal entry
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Currencies (Phase 9) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS currencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL, -- e.g., SAR, USD
        name TEXT NOT NULL,
        symbol TEXT,
        exchange_rate REAL NOT NULL DEFAULT 1.0, -- Rate vs Base Currency
        is_base INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Budgets (Phase 9) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        cost_center_id INTEGER,
        period_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly, yearly
        fiscal_year_id INTEGER NOT NULL,
        planned_amount REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Manufacturing / BOM (Phase 9) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS bom_headers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL, -- Finished Good
        name TEXT NOT NULL,
        version TEXT DEFAULT '1.0',
        is_active INTEGER NOT NULL DEFAULT 1,
        total_estimated_cost REAL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS bom_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bom_id INTEGER NOT NULL,
        component_product_id INTEGER NOT NULL, -- Raw Material
        quantity REAL NOT NULL,
        unit_name TEXT,
        wastage_percent REAL DEFAULT 0,
        unit_cost REAL DEFAULT 0
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

    # ── Hospitality: Tables & Reservations ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS table_resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id INTEGER NOT NULL DEFAULT 1,
        table_no TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 2,
        zone TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(branch_id, table_no)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS table_reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id INTEGER NOT NULL DEFAULT 1,
        table_id INTEGER NOT NULL,
        customer_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        party_size INTEGER NOT NULL DEFAULT 1,
        start_at TEXT NOT NULL,
        end_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'reserved',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(table_id) REFERENCES table_resources(id)
    )""")

    # ── Hospitality: Kitchen Display System (KDS) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS kitchen_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_no TEXT NOT NULL UNIQUE,
        branch_id INTEGER NOT NULL DEFAULT 1,
        source_type TEXT NOT NULL DEFAULT 'manual',
        source_ref TEXT,
        customer_name TEXT,
        priority TEXT NOT NULL DEFAULT 'normal',
        status TEXT NOT NULL DEFAULT 'queued',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS kitchen_ticket_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        product_id INTEGER,
        item_name TEXT NOT NULL,
        qty REAL NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'queued',
        notes TEXT,
        FOREIGN KEY(ticket_id) REFERENCES kitchen_tickets(id) ON DELETE CASCADE
    )""")

    # ── Rentals Vertical ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS rental_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rental_no TEXT NOT NULL UNIQUE,
        customer_id INTEGER,
        customer_name TEXT NOT NULL,
        branch_id INTEGER NOT NULL DEFAULT 1,
        product_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        pickup_at TEXT NOT NULL,
        due_at TEXT NOT NULL,
        returned_at TEXT,
        rental_fee REAL NOT NULL DEFAULT 0,
        deposit_amount REAL NOT NULL DEFAULT 0,
        penalty_amount REAL NOT NULL DEFAULT 0,
        paid_amount REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Online Commerce Engine ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS online_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        settings_json TEXT DEFAULT '{}'
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS online_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT NOT NULL UNIQUE,
        external_ref TEXT,
        channel_id INTEGER NOT NULL,
        customer_id INTEGER,
        branch_id INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
        total REAL NOT NULL DEFAULT 0,
        shipping_address TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(channel_id) REFERENCES online_channels(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS online_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        qty REAL NOT NULL,
        unit_price REAL NOT NULL,
        line_total REAL NOT NULL,
        FOREIGN KEY(order_id) REFERENCES online_orders(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    cursor.execute('''CREATE TABLE IF NOT EXISTS webhook_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT,
        dedupe_key TEXT UNIQUE,
        payload TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Integration Dead Letter Queue (Failed Outbound Dispatches)
    cursor.execute('''CREATE TABLE IF NOT EXISTS integration_dead_letters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT,
        event_type TEXT,
        event_id TEXT UNIQUE,
        target_url TEXT,
        payload_json TEXT,
        attempts INTEGER DEFAULT 0,
        last_http_status INTEGER,
        last_error TEXT,
        status TEXT DEFAULT 'pending',
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # ── Unified Notification Engine ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        channel TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        sent_at TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Advanced Production Tracking ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS recipe_production_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        qty_produced REAL NOT NULL,
        produced_at TEXT NOT NULL DEFAULT (datetime('now')),
        notes TEXT,
        FOREIGN KEY(recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )""")

    # ── Pricing Rules (Dynamic Margin Intelligence) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS pricing_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        min_cost REAL NOT NULL DEFAULT 0,
        max_cost REAL NOT NULL DEFAULT 9999999,
        target_margin_pct REAL NOT NULL,
        velocity_multiplier REAL DEFAULT 1.0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY(category_id) REFERENCES categories(id)
    )""")

    # ── Economic Intelligence: Market Signals ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS market_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        signal_type TEXT UNIQUE NOT NULL, -- e.g., 'Gold', 'Oil', 'USD_Index', 'Wheat_Futures'
        current_value REAL NOT NULL,
        previous_value REAL,
        trend TEXT, -- 'UP', 'DOWN', 'STABLE'
        last_updated TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Economic Intelligence: Product Risk Sensitivity ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS product_risk_factors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        signal_type TEXT NOT NULL,
        sensitivity_weight REAL DEFAULT 1.0, -- Multiplier for how much signal change affects target margin
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(signal_type) REFERENCES market_signals(signal_type)
    )""")

    # ── Economic Intelligence: Global Risk Events ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS global_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT NOT NULL,
        severity_score REAL DEFAULT 5.0, -- 1 to 10 scale
        affected_categories_json TEXT DEFAULT '[]', -- List of category names
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Quality Control: Rules (Phase 14) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS qc_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        product_id INTEGER,
        min_score_required REAL DEFAULT 70.0,
        is_mandatory INTEGER DEFAULT 1,
        FOREIGN KEY(category_id) REFERENCES categories(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Quality Control: Inspections (Phase 14) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS qc_inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER,
        product_id INTEGER NOT NULL,
        batch_id INTEGER,
        inspector_id INTEGER,
        inspection_date TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL, -- Passed, Failed, Partial
        score REAL DEFAULT 0,
        notes TEXT,
        FOREIGN KEY(purchase_id) REFERENCES purchases(id),
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(batch_id) REFERENCES product_batches(id)
    )""")

    # ── Quality Control: Defect Logs (Phase 14) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS qc_defect_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id INTEGER NOT NULL,
        defect_type TEXT NOT NULL, -- Damaged, Expired, WrongItem, Misc
        quantity REAL DEFAULT 0,
        description TEXT,
        FOREIGN KEY(inspection_id) REFERENCES qc_inspections(id)
    )""")

    # ── Fleet & Logistics: Vehicles (Phase 15) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS fleet_vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT UNIQUE NOT NULL,
        model TEXT NOT NULL,
        vehicle_type TEXT, -- Truck, Van, Bike
        payload_capacity_kg REAL,
        status TEXT DEFAULT 'available', -- available, in_transit, maintenance, retired
        odometer_reading REAL DEFAULT 0,
        last_service_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    # ── Fleet & Logistics: Driver Assignments (Phase 15) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS fleet_driver_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        driver_id INTEGER NOT NULL, -- references users(id)
        assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
        returned_at TEXT,
        notes TEXT,
        FOREIGN KEY(vehicle_id) REFERENCES fleet_vehicles(id),
        FOREIGN KEY(driver_id) REFERENCES users(id)
    )""")

    # ── Fleet & Logistics: Fuel Logs (Phase 15) ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS fleet_fuel_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        liters REAL NOT NULL,
        cost REAL NOT NULL,
        odometer_reading REAL,
        receipt_image TEXT,
        FOREIGN KEY(vehicle_id) REFERENCES fleet_vehicles(id)
    )""")

    # ── Phase 16: Advanced CRM & Marketing Automation ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS crm_segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        criteria_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS crm_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL, 
        status TEXT NOT NULL DEFAULT 'draft',
        segment_id INTEGER NOT NULL,
        message_template TEXT NOT NULL,
        scheduled_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(segment_id) REFERENCES crm_segments(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS crm_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        notes TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )""")

    logger.info("All tables created.")

    # ── Phase 19: Project Costing & WBS ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        customer_id INTEGER,
        description TEXT,
        budget REAL DEFAULT 0.0,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'planning',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS wbs_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        allocated_budget REAL DEFAULT 0.0,
        estimated_hours REAL DEFAULT 0.0,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY(project_id) REFERENCES projects(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS project_timesheets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        task_id INTEGER,
        employee_id INTEGER,
        date TEXT NOT NULL,
        hours_worked REAL NOT NULL,
        hourly_rate REAL NOT NULL,
        total_cost REAL NOT NULL,
        note TEXT,
        FOREIGN KEY(project_id) REFERENCES projects(id),
        FOREIGN KEY(task_id) REFERENCES wbs_tasks(id),
        FOREIGN KEY(employee_id) REFERENCES users(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS project_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        task_id INTEGER,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        unit_cost REAL NOT NULL,
        total_cost REAL NOT NULL,
        date_consumed TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY(project_id) REFERENCES projects(id),
        FOREIGN KEY(task_id) REFERENCES wbs_tasks(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Phase 20: HR Recruitment & Talent Management ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS hr_job_postings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        description TEXT,
        requirements TEXT,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS hr_applicants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        resume_url TEXT,
        status TEXT DEFAULT 'applied',
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(job_id) REFERENCES hr_job_postings(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS hr_interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        applicant_id INTEGER NOT NULL,
        interviewer_id INTEGER NOT NULL,
        scheduled_at TEXT NOT NULL,
        feedback TEXT,
        rating INTEGER,
        status TEXT DEFAULT 'scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(applicant_id) REFERENCES hr_applicants(id),
        FOREIGN KEY(interviewer_id) REFERENCES users(id)
    )""")

    # ── Phase 25: Device-Based Activation ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS system_activation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hardware_id TEXT NOT NULL,
        license_key TEXT,
        activated_at DATETIME,
        expires_at DATETIME,
        is_active INTEGER DEFAULT 0
    )""")

    # ── Phase 21: Subscription & Recurring Billing ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS subscription_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        interval_months INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        plan_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        next_invoice_date TEXT NOT NULL,
        status TEXT DEFAULT 'active', -- active, grace, cancelled
        notes TEXT,
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(plan_id) REFERENCES subscription_plans(id)
    )""")

    # ── Phase 22: MRP & Demand Forecasting ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS mrp_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        projected_demand REAL DEFAULT 0,
        planned_production_qty REAL DEFAULT 0,
        planned_purchase_qty REAL DEFAULT 0,
        plan_date TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS safety_stock_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER UNIQUE NOT NULL,
        min_qty REAL NOT NULL,
        lead_time_days INTEGER DEFAULT 1,
        auto_po INTEGER DEFAULT 0,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )""")

    # ── Phase 23: Omnichannel Orchestrator ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS platform_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        internal_product_id INTEGER NOT NULL,
        external_platform TEXT NOT NULL, -- Shopify, Amazon, etc.
        external_id TEXT NOT NULL,
        sync_enabled INTEGER DEFAULT 1,
        last_sync_at TEXT,
        FOREIGN KEY(internal_product_id) REFERENCES products(id)
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS external_sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        event_type TEXT NOT NULL, -- StockSync, OrderIngest
        status TEXT NOT NULL, -- success, failure
        payload_json TEXT,
        error_message TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    )""")

    # ── Phase 24: Advanced Treasury & Liquidity ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS treasury_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        forecast_date TEXT NOT NULL,
        estimated_inflow REAL DEFAULT 0,
        estimated_outflow REAL DEFAULT 0,
        notes TEXT
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS bank_statement_imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        import_date TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'processed',
        FOREIGN KEY(account_id) REFERENCES accounts(id)
    )""")

    # ── Phase 25/26: LMS & Internal Wiki ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS lms_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'SOP',
        content_markdown TEXT,
        author_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    )""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS employee_training_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        article_id INTEGER NOT NULL,
        completed_at TEXT DEFAULT (datetime('now')),
        score INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(article_id) REFERENCES lms_articles(id)
    )""")

    # ── Phase 26: Advanced Promotion Engine ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS promotion_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        rule_type TEXT NOT NULL, -- 'bogo', 'cart_total', 'category_discount', 'fixed_discount'
        min_total_amount REAL DEFAULT 0,
        min_qty INTEGER DEFAULT 1,
        buy_product_id INTEGER,
        get_product_id INTEGER,
        discount_percent REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        priority INTEGER DEFAULT 0
    )""")

    # ── Phase 27: Customer Wallets & Gift Cards ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS customer_wallets (
        customer_id INTEGER PRIMARY KEY,
        balance REAL DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS gift_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        initial_balance REAL NOT NULL,
        current_balance REAL NOT NULL,
        expiry_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'topup', 'payment', 'refund', 'gift_card_redeem'
        amount REAL NOT NULL,
        reference_type TEXT, -- 'invoice', 'gift_card'
        reference_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )""")

    # ── Phase 28: Hardware & Scale Pro ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS scale_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        prefix TEXT DEFAULT '20',
        mode TEXT DEFAULT 'weight', -- 'weight' or 'price'
        ean_type TEXT DEFAULT 'ean13',
        is_active INTEGER DEFAULT 1
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS label_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        width_mm INTEGER DEFAULT 40,
        height_mm INTEGER DEFAULT 30,
        content_template TEXT, -- JSON or ZPL/ESC-POS stub
        created_at TEXT DEFAULT (datetime('now'))
    )""")

    # ── Phase 29: Customer Self-Service & Service Desk ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        invoice_id INTEGER,
        subject TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'open', -- 'open', 'in-progress', 'resolved', 'closed'
        priority TEXT DEFAULT 'normal',
        category TEXT DEFAULT 'complaint', -- 'complaint', 'inquiry', 'refund_request'
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS ticket_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        sender_type TEXT NOT NULL, -- 'customer', 'staff'
        sender_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(ticket_id) REFERENCES support_tickets(id)
    )""")

    # ── Phase 30: Webhooks & Integration Hub ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        secret TEXT NOT NULL, -- For HMAC signature headers
        events TEXT, -- JSON array of events like ['invoice.created', 'stock.low']
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS webhook_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT,
        status_code INTEGER,
        response_body TEXT,
        attempt_number INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(endpoint_id) REFERENCES webhook_endpoints(id)
    )""")

    # ── Phase 31: Egyptian Geography & Sales Localizations ──
    cursor.execute("""CREATE TABLE IF NOT EXISTS governorates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_en TEXT DEFAULT ''
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        governorate_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_en TEXT DEFAULT '',
        FOREIGN KEY(governorate_id) REFERENCES governorates(id)
    )""")

    cursor.execute("""CREATE TABLE IF NOT EXISTS sales_zones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY(city_id) REFERENCES cities(id)
    )""")

