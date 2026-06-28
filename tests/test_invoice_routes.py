import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import backup as backup_router
from app.middleware import license_middleware
from app.repositories import customer_repo, invoice_repo, settings_repo, supplier_repo, product_repo


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(
        license_middleware.activation_repo,
        "get_activation_status",
        lambda: {"is_active": True, "hardware_id": "test-hw"},
    )
    with TestClient(app) as c:
        yield c


def login_owner(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"pin": "1234", "branch_id": 1},
    )
    assert response.status_code == 200
    token = response.json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}


def test_arap_customer_aging_uses_real_receivables_data(client, db_conn):
    customer_id = customer_repo.create(
        {
            "code": f"C_{uuid.uuid4().hex[:8]}",
            "name": "Aging Customer",
            "balance": 0,
            "wallet_balance": 0,
        }
    )
    invoice_repo.create_invoice(
        {
            "customer_id": customer_id,
            "payment_method": "credit",
            "subtotal": 100,
            "tax": 0,
            "total": 100,
            "net_total": 100,
            "paid_amount": 0,
            "change_due": 0,
            "discount_type": "none",
            "discount_value": 0,
            "discount_amount": 0,
        }
    )

    response = client.get(
        "/api/v1/arap/aging?party_type=customer",
        headers=login_owner(client),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert any(item["id"] == customer_id for item in data["data"])


def test_arap_matching_returns_standard_response_envelope(client, db_conn):
    supplier_id = supplier_repo.create(
        {
            "code": f"S_{uuid.uuid4().hex[:8]}",
            "name": "Test Supplier",
        }
    )
    db_conn.execute(
        """
        INSERT INTO purchase_orders (
            po_number, supplier_id, supplier_name, status, total_items,
            subtotal, tax_amount, total_amount, purchase_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("PO-TEST-1", supplier_id, "Test Supplier", "submitted", 1, 100, 0, 100, None, "owner"),
    )
    db_conn.commit()

    response = client.get("/api/v1/arap/matching", headers=login_owner(client))

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert isinstance(data["data"], list)


def test_void_invoice_respects_max_edit_days_setting(client, db_conn):
    settings_repo.upsert("max_edit_days", "2")
    invoice_id = invoice_repo.create_invoice(
        {
            "subtotal": 50,
            "tax": 0,
            "total": 50,
            "net_total": 50,
            "payment_method": "cash",
            "paid_amount": 50,
            "change_due": 0,
            "discount_type": "none",
            "discount_value": 0,
            "discount_amount": 0,
        }
    )
    db_conn.execute(
        "UPDATE invoices SET created_at = datetime('now', '-5 day') WHERE id = ?",
        (invoice_id,),
    )
    db_conn.commit()

    response = client.post(
        f"/api/v1/invoices/{invoice_id}/void",
        json={"reason": "too late"},
        headers=login_owner(client),
    )

    assert response.status_code == 403
    assert "after 2 days" in response.json()["detail"]


def test_update_payment_method_reconciles_customer_and_journal(client, db_conn):
    customer_id = customer_repo.create(
        {
            "code": f"C_{uuid.uuid4().hex[:8]}",
            "name": "Wallet Customer",
            "balance": 0,
            "wallet_balance": 100,
            "credit_limit": 500,
        }
    )
    invoice_id = invoice_repo.create_invoice(
        {
            "customer_id": customer_id,
            "payment_method": "credit",
            "subtotal": 50,
            "tax": 0,
            "total": 50,
            "net_total": 50,
            "paid_amount": 0,
            "change_due": 0,
            "discount_type": "none",
            "discount_value": 0,
            "discount_amount": 0,
        }
    )

    response = client.put(
        f"/api/v1/invoices/{invoice_id}/payment-method?new_method=wallet",
        headers=login_owner(client),
    )

    assert response.status_code == 200
    customer = db_conn.execute(
        "SELECT balance, wallet_balance FROM customers WHERE id = ?",
        (customer_id,),
    ).fetchone()
    assert customer["balance"] == 0
    assert customer["wallet_balance"] == 50

    payment_line = db_conn.execute(
        "SELECT account_id, description FROM journal_entry_lines "
        "WHERE entry_id = (SELECT id FROM journal_entries WHERE reference = ? ORDER BY id ASC LIMIT 1) "
        "AND debit > 0 ORDER BY id ASC LIMIT 1",
        (f"INV-{invoice_id}",),
    ).fetchone()
    account = db_conn.execute(
        "SELECT name FROM accounts WHERE id = ?",
        (payment_line["account_id"],),
    ).fetchone()

    assert payment_line["description"].endswith("wallet")
    assert account["name"].endswith("Wallet Customer")


def test_reports_sales_by_user_uses_cashier_name(client, db_conn):
    invoice_id = invoice_repo.create_invoice(
        {
            "subtotal": 75,
            "tax": 0,
            "total": 75,
            "net_total": 75,
            "payment_method": "cash",
            "paid_amount": 75,
            "change_due": 0,
            "discount_type": "none",
            "discount_value": 0,
            "discount_amount": 0,
        }
    )
    db_conn.execute(
        "UPDATE invoices SET cashier_name = ?, created_at = ? WHERE id = ?",
        ("Front Desk", "2026-04-13 10:00:00", invoice_id),
    )
    db_conn.commit()

    response = client.get(
        "/api/v1/reports/sales-by-user?date_from=2026-04-13&date_to=2026-04-13",
        headers=login_owner(client),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert any(row["username"] == "Front Desk" for row in data["data"])


def test_reports_sales_by_category_and_product_ledger_return_live_data(client, db_conn):
    product_id = product_repo.create(
        {
            "sku": f"SKU-{uuid.uuid4().hex[:8]}",
            "name": "Ledger Product",
            "price": 40,
            "cost_price": 20,
            "stock_qty": 10,
            "category": "Beverages",
        }
    )
    invoice_id = invoice_repo.create_invoice(
        {
            "subtotal": 40,
            "tax": 0,
            "total": 40,
            "net_total": 40,
            "payment_method": "cash",
            "paid_amount": 40,
            "change_due": 0,
            "discount_type": "none",
            "discount_value": 0,
            "discount_amount": 0,
        }
    )
    invoice_repo.create_invoice_items(
        invoice_id,
        [
            {
                "product_id": product_id,
                "qty": 1,
                "bonus_qty": 0,
                "unit_price": 40,
                "line_total": 40,
                "net_line_total": 40,
            }
        ],
    )
    db_conn.execute(
        "UPDATE invoices SET created_at = ? WHERE id = ?",
        ("2026-04-13 11:00:00", invoice_id),
    )
    db_conn.commit()

    category_response = client.get(
        "/api/v1/reports/sales-by-category?date_from=2026-04-13&date_to=2026-04-13",
        headers=login_owner(client),
    )
    ledger_response = client.get(
        f"/api/v1/reports/product-ledger/{product_id}?date_from=2026-04-13&date_to=2026-04-13",
        headers=login_owner(client),
    )

    assert category_response.status_code == 200
    category_data = category_response.json()
    assert category_data["ok"] is True
    assert any(row["category_name"] == "Beverages" for row in category_data["data"])

    assert ledger_response.status_code == 200
    ledger_data = ledger_response.json()
    assert ledger_data["ok"] is True
    assert any(row["reference_type"] == "invoice" for row in ledger_data["data"])


def test_purchase_orders_endpoints_return_standard_response_envelope(client):
    supplier_id = supplier_repo.create(
        {
            "code": f"S_{uuid.uuid4().hex[:8]}",
            "name": "PO Supplier",
        }
    )
    product_id = product_repo.create(
        {
            "sku": f"PO-SKU-{uuid.uuid4().hex[:8]}",
            "name": "PO Product",
            "price": 15,
            "cost_price": 10,
            "stock_qty": 5,
            "category": "General",
        }
    )

    create_response = client.post(
        "/api/v1/purchase-orders/",
        json={
            "supplier_id": supplier_id,
            "supplier_name": "PO Supplier",
            "created_by": "owner",
            "items": [
                {
                    "product_id": product_id,
                    "product_name": "PO Product",
                    "ordered_qty": 2,
                    "unit_price": 15,
                }
            ],
        },
        headers=login_owner(client),
    )

    assert create_response.status_code == 200
    create_data = create_response.json()
    assert create_data["ok"] is True
    po_id = create_data["data"]["id"]

    list_response = client.get("/api/v1/purchase-orders/", headers=login_owner(client))
    details_response = client.get(f"/api/v1/purchase-orders/{po_id}", headers=login_owner(client))

    assert list_response.status_code == 200
    assert list_response.json()["ok"] is True
    assert any(row["id"] == po_id for row in list_response.json()["data"])

    assert details_response.status_code == 200
    details_data = details_response.json()
    assert details_data["ok"] is True
    assert details_data["data"]["id"] == po_id


def test_printing_endpoints_return_standard_response_envelope(client):
    create_response = client.post(
        "/api/v1/label-templates",
        json={
            "name": "Shelf Label",
            "type": "barcode",
            "width": 50,
            "height": 30,
        },
        headers=login_owner(client),
    )

    assert create_response.status_code == 200
    create_data = create_response.json()
    assert create_data["ok"] is True
    template_id = create_data["data"]["id"]

    list_response = client.get("/api/v1/label-templates", headers=login_owner(client))
    details_response = client.get(f"/api/v1/label-templates/{template_id}", headers=login_owner(client))

    assert list_response.status_code == 200
    assert list_response.json()["ok"] is True
    assert any(row["id"] == template_id for row in list_response.json()["data"])

    assert details_response.status_code == 200
    details_data = details_response.json()
    assert details_data["ok"] is True
    assert details_data["data"]["id"] == template_id


def test_notifications_endpoints_return_standard_response_envelope(client):
    send_response = client.post(
        "/api/v1/notifications/send",
        json={
            "channel": "sms",
            "recipient": "+201000000000",
            "content": "Test notification",
        },
        headers=login_owner(client),
    )

    assert send_response.status_code == 200
    send_data = send_response.json()
    assert send_data["ok"] is True
    notif_id = send_data["data"]["id"]

    list_response = client.get("/api/v1/notifications/", headers=login_owner(client))
    patch_response = client.patch(
        f"/api/v1/notifications/{notif_id}/status?status=sent",
        headers=login_owner(client),
    )

    assert list_response.status_code == 200
    assert list_response.json()["ok"] is True
    assert any(row["id"] == notif_id for row in list_response.json()["data"])

    assert patch_response.status_code == 200
    patch_data = patch_response.json()
    assert patch_data["ok"] is True
    assert patch_data["data"]["status"] == "success"


def test_backup_endpoints_create_and_list_backups(client, monkeypatch, tmp_path):
    backup_dir = tmp_path / "backups"
    monkeypatch.setattr(backup_router, "BACKUP_DIR", str(backup_dir))

    create_response = client.post("/api/v1/backup/create", headers=login_owner(client))
    list_response = client.get("/api/v1/backup/list", headers=login_owner(client))

    assert create_response.status_code == 200
    create_data = create_response.json()
    assert create_data["ok"] is True
    assert Path(create_data["data"]["path"]).exists()

    assert list_response.status_code == 200
    list_data = list_response.json()
    assert list_data["ok"] is True
    assert any(item["filename"] == create_data["data"]["filename"] for item in list_data["data"])


def test_dashboard_kpis_and_branch_kpis_return_live_counts(client, db_conn):
    invoice_id = invoice_repo.create_invoice(
        {
            "subtotal": 120,
            "tax": 0,
            "total": 120,
            "net_total": 120,
            "payment_method": "cash",
            "paid_amount": 120,
            "change_due": 0,
            "discount_type": "none",
            "discount_value": 0,
            "discount_amount": 0,
            "branch_id": 1,
        }
    )
    today = "2026-04-13"
    db_conn.execute(
        "UPDATE invoices SET created_at = ? WHERE id = ?",
        (f"{today} 09:00:00", invoice_id),
    )
    db_conn.execute(
        "INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?)",
        ("Stationery", 20, "office", today),
    )
    db_conn.commit()

    kpis_response = client.get("/api/v1/dashboard/kpis", headers=login_owner(client))
    branch_response = client.get("/api/v1/dashboard/branches", headers=login_owner(client))

    assert kpis_response.status_code == 200
    kpis_data = kpis_response.json()
    assert kpis_data["ok"] is True
    assert kpis_data["data"]["today_invoices"] >= 1
    assert kpis_data["data"]["today_sales"] >= 120
    assert kpis_data["data"]["today_expenses"] >= 20

    assert branch_response.status_code == 200
    branch_data = branch_response.json()
    assert branch_data["ok"] is True
    assert any(row["id"] == 1 and row["invoice_count"] >= 1 for row in branch_data["data"])


def test_reports_secondary_endpoints_return_expected_envelopes(client, db_conn):
    product_id = product_repo.create(
        {
            "sku": f"REP-SKU-{uuid.uuid4().hex[:8]}",
            "name": "Report Product",
            "price": 60,
            "cost_price": 30,
            "stock_qty": 12,
            "category": "Snacks",
        }
    )
    invoice_id = invoice_repo.create_invoice(
        {
            "subtotal": 60,
            "tax": 0,
            "total": 60,
            "net_total": 60,
            "payment_method": "card",
            "paid_amount": 60,
            "change_due": 0,
            "discount_type": "none",
            "discount_value": 0,
            "discount_amount": 0,
        }
    )
    invoice_repo.create_invoice_items(
        invoice_id,
        [
            {
                "product_id": product_id,
                "qty": 1,
                "bonus_qty": 0,
                "unit_price": 60,
                "line_total": 60,
                "net_line_total": 60,
            }
        ],
    )
    db_conn.execute(
        "UPDATE invoices SET created_at = ?, cashier_name = ? WHERE id = ?",
        ("2026-04-13 12:00:00", "Reports Cashier", invoice_id),
    )
    db_conn.commit()

    endpoints = [
        "/api/v1/reports/sales-by-payment-method?date_from=2026-04-13&date_to=2026-04-13",
        "/api/v1/reports/hourly-sales?date_from=2026-04-13&date_to=2026-04-13",
        "/api/v1/reports/inventory-valuation",
    ]

    for url in endpoints:
        response = client.get(url, headers=login_owner(client))
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
