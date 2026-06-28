import os
import sqlite3
import pytest
from app.database.schema.tables import _create_tables
from app.database.schema.migrations import _run_migrations
from app.database.schema.indexes import _create_indexes
from app.database.schema.seeds import _seed_data

@pytest.fixture
def temp_db():
    """Create an in-memory database for testing."""
    conn = sqlite3.connect(":memory:")
    yield conn
    conn.close()

def test_modular_initialization(temp_db):
    """Verify that all modular parts work together to create a valid schema."""
    cursor = temp_db.cursor()
    
    # 1. Create Tables
    _create_tables(cursor)
    
    # Verify a few tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products'")
    assert cursor.fetchone() is not None
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    assert cursor.fetchone() is not None

    # 2. Run Migrations
    _run_migrations(cursor)
    
    # Verify app_settings seeded
    cursor.execute("SELECT value FROM app_settings WHERE key='currency'")
    assert cursor.fetchone()[0] == 'SAR'
    cursor.execute("SELECT value FROM app_settings WHERE key='vat_number'")
    assert cursor.fetchone()[0] == '300000000000003'
    cursor.execute("SELECT value FROM app_settings WHERE key='receipt_header'")
    assert cursor.fetchone()[0] == ''
    cursor.execute("SELECT value FROM app_settings WHERE key='receipt_footer'")
    assert cursor.fetchone()[0] == 'Thank you!'
    cursor.execute("SELECT value FROM app_settings WHERE key='printer_width'")
    assert cursor.fetchone()[0] == '80mm'
    cursor.execute("SELECT value FROM app_settings WHERE key='enable_qr'")
    assert cursor.fetchone()[0] == '0'

    # 3. Create Indexes
    _create_indexes(cursor)
    
    # Verify an index exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_products_sku'")
    assert cursor.fetchone() is not None

    # 4. Seed Data
    _seed_data(cursor)
    
    # Verify owner user seeded
    cursor.execute("SELECT username FROM users WHERE role='owner'")
    assert cursor.fetchone()[0] == 'owner'
    
    # Verify users table doesn't have 'pin' column (from migration)
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    assert 'pin' not in columns
    assert 'pin_hash' in columns
