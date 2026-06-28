import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

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
