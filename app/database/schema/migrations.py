def _run_migrations(cursor):
    defaults = [
        ("read_only_mode", "0"),
        ("cashier_can_discount", "0"),
        ("cashier_can_return", "0"),
        ("tax_rate", "15"),
        ("currency", "SAR"),
        ("currency_code", "SAR"),
        ("store_name", "My Store"),
        ("vat_number", "300000000000003"),
        ("store_address", ""),
        ("store_phone", ""),
        ("receipt_footer", "Thank you!"),
        ("invoice_footer", ""),
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
        ("max_edit_days", "14"),
        ("prevent_negative_stock", "0"),
        ("auto_backup_on_close", "0"),
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
        # v1.35 expansion
        ("enable_hospitality", "1"),
        ("enable_rentals", "1"),
        ("enable_online", "1"),
        ("enable_notifications", "1"),
        ("whatsapp_api_enabled", "0"),
        ("shopify_sync_enabled", "0"),
    ]
    for key, value in defaults:
        cursor.execute(
            "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)",
            (key, value),
        )

    # Phase 9: Seed Multi-Currency
    cursor.execute("INSERT OR IGNORE INTO currencies (code, name, symbol, exchange_rate, is_base, is_active) VALUES (?, ?, ?, ?, ?, ?)",
                   ("SAR", "Saudi Riyal", "ر.س", 1.0, 1, 1))

    # Phase 2 Reform: Drop the legacy 'pin' column from users table
    # Since SQLite doesn't support DROP COLUMN in older versions easily, 
    # we first check if the column exists.
    try:
        cursor.execute("SELECT pin FROM users LIMIT 1")
        # If we reach here, column exists. We attempt to drop it if SQLite version >= 3.35.0
        # Otherwise, we just leave it (it's safe but slightly untidy).
        cursor.execute("ALTER TABLE users DROP COLUMN pin")
    except Exception:
        # Column likely doesn't exist or drop failed, which is fine for now.
        pass

    # Keep invoice schema aligned with repositories that track partial refunds.
    try:
        cursor.execute("SELECT refunded_amount FROM invoices LIMIT 1")
    except Exception:
        cursor.execute(
            "ALTER TABLE invoices ADD COLUMN refunded_amount REAL NOT NULL DEFAULT 0"
        )
