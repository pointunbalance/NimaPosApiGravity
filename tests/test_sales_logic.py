import pytest
import sqlite3
import json
from datetime import datetime
from app.database.connection import get_connection

# Database setup is handled by tests/conftest.py

def test_void_invoice_reverses_financials_and_stock(db_conn):
    from app.repositories import invoice_repo, customer_repo, product_repo
    conn = db_conn
    import uuid
    c_code = f"C_{uuid.uuid4().hex[:8]}"
    c_id = customer_repo.create({"code": c_code, "name": "Test User", "balance": 0, "wallet_balance": 100})
    p_id = conn.execute("INSERT INTO products (name, price, stock_qty) VALUES (?, ?, ?)", ("Apple", 10, 100)).lastrowid
    conn.commit()
    
    # 2. Perform Sale (Credit)
    inv_data = {
        "customer_id": c_id,
        "payment_method": "credit",
        "subtotal": 50,
        "tax": 0,
        "total": 50,
        "net_total": 50,
        "paid_amount": 0,
        "change_due": 0,
        "discount_type": "none",
        "discount_value": 0,
        "discount_amount": 0
    }
    inv_id = invoice_repo.create_invoice(inv_data)
    invoice_repo.create_invoice_items(inv_id, [{"product_id": p_id, "qty": 5, "bonus_qty": 2, "unit_price": 10, "line_total": 50}], user_id=1)
    
    # Check intermediate state
    prod = conn.execute("SELECT stock_qty FROM products WHERE id = ?", (p_id,)).fetchone()
    cust = conn.execute("SELECT balance, total_purchases FROM customers WHERE id = ?", (c_id,)).fetchone()
    assert prod["stock_qty"] == 93 # 100 - (5 + 2)
    assert cust["balance"] == 50
    assert cust["total_purchases"] == 50
    
    # 3. Void Invoice
    assert invoice_repo.void_invoice(inv_id, 1, "Testing") is True

    # Verify reversal
    prod_after = conn.execute("SELECT stock_qty FROM products WHERE id = ?", (p_id,)).fetchone()
    cust_after = conn.execute("SELECT balance, total_purchases FROM customers WHERE id = ?", (c_id,)).fetchone()
    inv_after = conn.execute("SELECT is_void FROM invoices WHERE id = ?", (inv_id,)).fetchone()
    
    assert prod_after["stock_qty"] == 100 # Correctly restored 7
    assert cust_after["balance"] == 0
    assert cust_after["total_purchases"] == 0
    assert inv_after["is_void"] == 1

def test_return_restores_stock_only_once(db_conn):
    from app.repositories import invoice_repo, returns_repo, product_repo
    conn = db_conn
    # 1. Setup
    p_id = conn.execute("INSERT INTO products (name, price, stock_qty) VALUES (?, ?, ?)", ("Banana", 2, 50)).lastrowid
    conn.commit()
    inv_id = invoice_repo.create_invoice({"subtotal": 10, "tax": 0, "total": 10, "net_total": 10, "payment_method": "cash", "paid_amount": 10, "change_due": 0, "discount_type": "none", "discount_value": 0, "discount_amount": 0})
    invoice_repo.create_invoice_items(inv_id, [{"product_id": p_id, "qty": 5, "unit_price": 2, "line_total": 10}], user_id=1)
    
    assert conn.execute("SELECT stock_qty FROM products WHERE id = ?", (p_id,)).fetchone()["stock_qty"] == 45
    
    # 2. Process Return (simulating BUG-01 fix)
    return_data = {
        "original_invoice_id": inv_id,
        "user_id": 1,
        "refund_amount": 10,
        "items": [{"product_id": p_id, "qty": 5, "unit_price": 2, "line_total": 10}]
    }
    returns_repo.create_return(return_data)
    
    # Verify stock
    prod = conn.execute("SELECT stock_qty FROM products WHERE id = ?", (p_id,)).fetchone()
    assert prod["stock_qty"] == 50 # If it was 55, then BUG-01 is still there.

def test_purchase_deletion_reverses_stock(db_conn):
    from app.repositories import purchase_repo
    conn = db_conn
    import uuid
    s_code = f"S_{uuid.uuid4().hex[:8]}"
    p_id = conn.execute("INSERT INTO products (name, stock_qty, cost_price) VALUES (?, ?, ?)", ("Milk", 10, 5)).lastrowid
    s_id = conn.execute("INSERT INTO suppliers (code, name) VALUES (?, ?)", (s_code, "Supp1")).lastrowid
    conn.commit()
    
    # 2. Create Purchase
    items_json = json.dumps([{"product_id": p_id, "quantity": 20, "bonus_qty": 5, "price": 4}])
    p_data = {
        "supplier_id": s_id,
        "date": "2024-01-01",
        "items_json": items_json,
        "total_amount": 80
    }
    purchase_id = purchase_repo.create(p_data)
    
    assert conn.execute("SELECT stock_qty FROM products WHERE id = ?", (p_id,)).fetchone()["stock_qty"] == 35 # 10 + 25
    
    # 3. Delete Purchase
    purchase_repo.delete(purchase_id)
    
    # Verify stock reversal
    prod = conn.execute("SELECT stock_qty FROM products WHERE id = ?", (p_id,)).fetchone()
    assert prod["stock_qty"] == 10 # Correctly back to 10


def test_invoice_print_data_includes_store_and_print_settings(db_conn):
    from app.repositories import invoice_repo, settings_repo

    conn = db_conn
    product_id = conn.execute(
        "INSERT INTO products (name, price, stock_qty, sku, barcode) VALUES (?, ?, ?, ?, ?)",
        ("Receipt Item", 25, 10, "RCPT-1", "1234567890123"),
    ).lastrowid
    conn.commit()

    settings_repo.upsert("store_name", "Nima POS")
    settings_repo.upsert("vat_number", "123456789012345")
    settings_repo.upsert("store_phone", "01000000000")
    settings_repo.upsert("receipt_header", "Welcome back")
    settings_repo.upsert("receipt_footer", "See you soon")
    settings_repo.upsert("printer_width", "58mm")
    settings_repo.upsert("enable_qr", "1")

    invoice_id = invoice_repo.create_invoice({
        "subtotal": 25,
        "tax": 3.75,
        "total": 28.75,
        "net_total": 28.75,
        "payment_method": "cash",
        "paid_amount": 30,
        "change_due": 1.25,
        "discount_type": "none",
        "discount_value": 0,
        "discount_amount": 0,
    })
    invoice_repo.create_invoice_items(
        invoice_id,
        [{"product_id": product_id, "qty": 1, "unit_price": 25, "line_total": 25}],
        user_id=1,
    )

    print_data = invoice_repo.get_print_data(invoice_id)

    assert print_data["store"]["name"] == "Nima POS"
    assert print_data["store"]["vat_number"] == "123456789012345"
    assert print_data["store"]["phone"] == "01000000000"
    assert print_data["print_settings"]["receipt_header"] == "Welcome back"
    assert print_data["print_settings"]["receipt_footer"] == "See you soon"
    assert print_data["print_settings"]["printer_width"] == "58mm"
    assert print_data["print_settings"]["enable_qr"] == "1"
    assert print_data["items"][0]["product_name"] == "Receipt Item"
