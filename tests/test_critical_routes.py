"""Tests for critical backend routes: Products, Customers, Dashboard, Reports."""
import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.middleware import license_middleware


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
    resp = client.post("/api/v1/auth/login", json={"pin": "1234", "branch_id": 1})
    assert resp.status_code == 200
    return {"Authorization": f"Bearer {resp.json()['data']['token']}"}


# ──────────────────────────────────────────────
# PRODUCTS
# ──────────────────────────────────────────────

class TestProducts:
    def test_list_products_empty(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/products", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert data["data"]["items"] == []

    def test_create_product(self, client):
        h = login_owner(client)
        resp = client.post("/api/v1/products", headers=h, json={
            "name": "Test Product",
            "price": 99.99,
            "cost_price": 50.0,
            "stock_qty": 100,
            "sku": f"SKU-{uuid.uuid4().hex[:6]}",
            "barcode": f"BAR{uuid.uuid4().hex[:10]}",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True

    def test_bulk_update_validates_fields(self, client):
        h = login_owner(client)
        resp = client.post("/api/v1/products/bulk-update", headers=h, json={
            "product_ids": [1, 2],
            "payload": {"evil_field": "hack"},
        })
        assert resp.status_code == 400

    def test_bulk_update_validates_empty_ids(self, client):
        h = login_owner(client)
        resp = client.post("/api/v1/products/bulk-update", headers=h, json={
            "product_ids": [],
            "payload": {"category": "test"},
        })
        assert resp.status_code == 400

    def test_bulk_update_validates_max_ids(self, client):
        h = login_owner(client)
        resp = client.post("/api/v1/products/bulk-update", headers=h, json={
            "product_ids": list(range(501)),
            "payload": {"category": "test"},
        })
        assert resp.status_code == 400

    def test_low_stock_products(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/products/low-stock?threshold=10", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_categories_list(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/products/categories", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ──────────────────────────────────────────────
# CUSTOMERS
# ──────────────────────────────────────────────

class TestCustomers:
    def test_list_customers_empty(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/customers", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_create_customer(self, client):
        h = login_owner(client)
        resp = client.post("/api/v1/customers", headers=h, json={
            "name": "Test Customer",
            "phone": "01012345678",
            "code": f"CUST-{uuid.uuid4().hex[:6]}",
        })
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ──────────────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────────────

class TestDashboard:
    def test_kpis_returns_200(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/dashboard/kpis", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "today_sales" in data["data"]
        assert "today_invoices" in data["data"]
        assert "today_expenses" in data["data"]
        assert "low_stock_count" in data["data"]
        assert "active_products" in data["data"]
        assert "active_customers" in data["data"]
        assert "pending_orders" in data["data"]
        assert "held_orders_count" in data["data"]
        assert "payment_split" in data["data"]
        assert "top_products_today" in data["data"]

    def test_branch_kpis_returns_200(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/dashboard/branches", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ──────────────────────────────────────────────
# REPORTS
# ──────────────────────────────────────────────

class TestReports:
    def test_sales_summary(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/sales-summary?date_from=2026-01-01&date_to=2026-12-31", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "gross_sales" in data["data"]
        assert "net_sales" in data["data"]

    def test_top_products(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/top-products?date_from=2026-01-01&date_to=2026-12-31", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_daily_breakdown(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/daily-breakdown?date_from=2026-01-01&date_to=2026-12-31", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_profit_metrics(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/profit-metrics?date_from=2026-01-01&date_to=2026-12-31", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "revenue" in data["data"]
        assert "cogs" in data["data"]
        assert "profit_margin_percent" in data["data"]

    def test_inventory_valuation(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/inventory-valuation", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "items" in data["data"]
        assert "total_valuation" in data["data"]

    def test_inventory_aging(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/inventory-aging", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_sales_by_user(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/sales-by-user?date_from=2026-01-01&date_to=2026-12-31", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_sales_by_payment_method(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/sales-by-payment-method?date_from=2026-01-01&date_to=2026-12-31", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_hourly_sales(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/hourly-sales?date_from=2026-01-01&date_to=2026-12-31", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_trading_summary(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/trading-summary?date_from=2026-01-01&date_to=2026-12-31", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "revenue" in data["data"]
        assert "costs" in data["data"]

    def test_stagnant_products(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/reports/stagnant-products?days=30", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ──────────────────────────────────────────────
# SETTINGS
# ──────────────────────────────────────────────

class TestSettings:
    def test_get_settings(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/settings", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_update_setting_by_key(self, client):
        h = login_owner(client)
        resp = client.put("/api/v1/settings/store_name", headers=h, json={
            "value": "Test Store",
        })
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_bulk_update_settings(self, client):
        h = login_owner(client)
        resp = client.post("/api/v1/settings/bulk", headers=h, json={
            "store_name": "Bulk Store",
            "vat_number": "12345",
        })
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ──────────────────────────────────────────────
# EXPENSES
# ──────────────────────────────────────────────

class TestExpenses:
    def test_create_expense(self, client):
        h = login_owner(client)
        resp = client.post("/api/v1/expenses", headers=h, json={
            "title": "Test Expense",
            "amount": 150.0,
            "category": "office",
            "date": "2026-06-29",
        })
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_list_expenses(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/expenses", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ──────────────────────────────────────────────
# BACKUP
# ──────────────────────────────────────────────

class TestBackup:
    def test_create_backup(self, client):
        h = login_owner(client)
        resp = client.post("/api/v1/backup/create", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "filename" in data["data"]
        assert "size_bytes" in data["data"]
        assert "path" not in data["data"]  # Should NOT expose server path

    def test_list_backups(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/backup/list", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ──────────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────────

class TestAuth:
    def test_login_success(self, client):
        resp = client.post("/api/v1/auth/login", json={"pin": "1234", "branch_id": 1})
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "token" in data["data"]
        assert data["data"]["user"]["role"] == "owner"

    def test_login_wrong_pin(self, client):
        resp = client.post("/api/v1/auth/login", json={"pin": "0000", "branch_id": 1})
        assert resp.status_code == 401

    def test_me_endpoint(self, client):
        h = login_owner(client)
        resp = client.get("/api/v1/auth/me", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert data["data"]["role"] == "owner"

    def test_me_without_token(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_logout(self, client):
        h = login_owner(client)
        resp = client.post("/api/v1/auth/logout", headers=h)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ──────────────────────────────────────────────
# SYSTEM
# ──────────────────────────────────────────────

class TestSystem:
    def test_health_check(self, client):
        resp = client.get("/api/v1/system/health")
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_version(self, client):
        resp = client.get("/api/v1/system/version")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "2.32" in data["data"]["version"]

    def test_health_returns_200_when_db_ok(self, client):
        resp = client.get("/api/v1/system/health")
        assert resp.status_code == 200
        assert resp.json()["ok"] is True
