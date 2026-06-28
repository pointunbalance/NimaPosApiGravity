"""SQLite connection manager with WAL mode and thread-safe access."""
import logging
import sqlite3
import threading

import app.config

logger = logging.getLogger(__name__)

_local = threading.local()


def get_connection(db_path: str = None) -> sqlite3.Connection:
    """Get or create a thread-local SQLite connection with WAL mode."""
    path = db_path or app.config.DB_PATH
    if not hasattr(_local, "connection") or _local.connection is None:
        _local.connection = sqlite3.connect(path, check_same_thread=False)
        _local.connection.row_factory = sqlite3.Row
        _local.connection.execute("PRAGMA journal_mode=WAL")
        _local.connection.execute("PRAGMA synchronous=NORMAL")
        _local.connection.execute("PRAGMA temp_store=MEMORY")
        _local.connection.execute("PRAGMA foreign_keys=ON")
        _local.connection.execute("PRAGMA busy_timeout=5000")
        logger.info("SQLite connection opened: %s", path)
    return _local.connection


def close_connection():
    """Close the thread-local connection if open."""
    if hasattr(_local, "connection") and _local.connection:
        _local.connection.close()
        _local.connection = None
        logger.info("SQLite connection closed.")

# Alias for compatibility with older repository versions
get_db_connection = get_connection
