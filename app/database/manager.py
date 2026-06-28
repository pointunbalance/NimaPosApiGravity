"""Database manager — consolidated entry point for schema, migrations, and seeding."""
import logging
from app.database.connection import get_connection

# Import modularized components
from app.database.schema.tables import _create_tables
from app.database.schema.migrations import _run_migrations
from app.database.schema.indexes import _create_indexes
from app.database.schema.seeds import _seed_data

logger = logging.getLogger(__name__)

def initialize_db():
    """Main entry — creates tables, runs migrations, indexes, and seeds."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Create Tables
    _create_tables(cursor)
    
    # 2. Run Migrations
    _run_migrations(cursor)
    conn.commit()
    
    # 3. Create Indexes
    _create_indexes(cursor)
    conn.commit()
    
    # 4. Seed Data
    _seed_data(cursor)
    conn.commit()
    
    logger.info("Database initialized successfully (Modularized).")
