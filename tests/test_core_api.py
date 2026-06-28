import pytest
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


def owner_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"pin": "1234", "branch_id": 1})
    assert response.status_code == 200
    token = response.json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check(client):
    """Verify health endpoint is reachable."""
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["data"]["status"] == "healthy"

def test_version_endpoint(client):
    """Verify version endpoint returns v2.1.0 or higher."""
    response = client.get("/api/v1/system/version")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "2." in data["data"]["version"]

def test_docs_ui(client):
    """Verify custom Swagger UI loads."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "SwaggerUIBundle" in response.text

def test_modern_docs_ui(client):
    """Verify Scalar UI loads."""
    response = client.get("/scalar")
    assert response.status_code == 200
    assert "api-reference" in response.text


def test_settings_runtime_endpoint(client):
    """Verify runtime settings endpoint is reachable for authenticated users."""
    response = client.get("/api/v1/settings/runtime", headers=owner_headers(client))
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "api_version" in data["data"]
    assert "printer_width" in data["data"]


def test_settings_health_endpoint(client):
    """Verify settings health endpoint is reachable for authenticated users."""
    response = client.get("/api/v1/settings/health", headers=owner_headers(client))
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["data"]["status"] == "healthy"


def test_openapi_operation_ids_are_unique(client):
    """Verify generated OpenAPI operationIds remain unique."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()

    operation_ids: list[str] = []
    for path_item in schema["paths"].values():
        for operation in path_item.values():
            if isinstance(operation, dict) and "operationId" in operation:
                operation_ids.append(operation["operationId"])

    assert len(operation_ids) == len(set(operation_ids))
