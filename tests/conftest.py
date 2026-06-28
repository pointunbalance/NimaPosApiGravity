import pytest
import os
import sqlite3
import uuid
from app.database import connection
import app.config

@pytest.fixture(autouse=True)
def test_setup(tmp_path, monkeypatch):
    """Setup an isolated environment for EACH test with a unique DB file."""
    # 1. Unique DB file to prevent ANY persistence leaks
    db_name = f"test_{uuid.uuid4().hex}.db"
    db_path = str(tmp_path / db_name)
    
    # 2. Patch DB_PATH globally
    monkeypatch.setattr(app.config, "DB_PATH", db_path)
    
    # 3. Force Close any old connection
    connection.close_connection()
    
    # 4. Initialize Schema
    from app.database.manager import initialize_db
    initialize_db()
    
    # 5. Flush connection to ensure test uses the one pointing to db_path
    connection.close_connection()
    
    # 6. Reset rate limiter store between tests
    from app.middleware.rate_limit_middleware import _rate_limit_store
    _rate_limit_store.clear()
    
    yield db_path
    
    # 7. Cleanup
    connection.close_connection()

@pytest.fixture
def db_conn(test_setup):
    """Provides a fresh database connection for a test."""
    from app.database.connection import get_connection
    conn = get_connection()
    yield conn
