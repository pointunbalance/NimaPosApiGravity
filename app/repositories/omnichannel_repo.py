import sqlite3
import logging
import json
from datetime import datetime
from typing import List, Optional
from app.database.connection import get_db_connection
from app.models.omnichannel import PlatformMappingCreate, SyncLogCreate, ProductSyncStatus

logger = logging.getLogger(__name__)

def create_mapping(mapping: PlatformMappingCreate) -> int:
    with get_db_connection() as conn:
        cursor = conn.execute(
            """INSERT OR REPLACE INTO platform_mappings (internal_product_id, external_platform, external_id, sync_enabled)
               VALUES (?, ?, ?, ?)""",
            (mapping.internal_product_id, mapping.external_platform, mapping.external_id, 1 if mapping.sync_enabled else 0)
        )
        return cursor.lastrowid

def get_mapping_status() -> List[ProductSyncStatus]:
    with get_db_connection() as conn:
        rows = conn.execute("""
            SELECT m.*, p.name as product_name, p.stock_qty as current_stock
            FROM platform_mappings m
            JOIN products p ON m.internal_product_id = p.id
        """).fetchall()
        return [ProductSyncStatus(**dict(r)) for r in rows]

def log_sync_event(log: SyncLogCreate):
    with get_db_connection() as conn:
        conn.execute(
            """INSERT INTO external_sync_logs (platform, event_type, status, payload_json, error_message)
               VALUES (?, ?, ?, ?, ?)""",
            (log.platform, log.event_type, log.status, log.payload_json, log.error_message)
        )

def sync_stock_to_platform(product_id: int):
    """
    Simulates pushing the current stock level to all mapped external platforms.
    In a production app, this would perform actual HTTP requests to Shopify/Amazon APIs.
    """
    with get_db_connection() as conn:
        mappings = conn.execute("""
            SELECT m.*, p.name, p.stock_qty 
            FROM platform_mappings m
            JOIN products p ON m.internal_product_id = p.id
            WHERE m.internal_product_id = ? AND m.sync_enabled = 1
        """, (product_id,)).fetchall()
        
        for m in mappings:
            # Simulation of API Call
            payload = {"sku": m["external_id"], "inventory_quantity": m["stock_qty"]}
            logger.info(f"SYNCHRONIZING: Pushing stock for {m['name']} to {m['external_platform']} (Qty: {m['stock_qty']})")
            
            # Log the success
            log_sync_event(SyncLogCreate(
                platform=m["external_platform"],
                event_type="StockSync",
                status="success",
                payload_json=json.dumps(payload)
            ))
            
            # Update last sync time
            conn.execute(
                "UPDATE platform_mappings SET last_sync_at = ? WHERE id = ?",
                (datetime.now().isoformat(), m["id"])
            )
        conn.commit()

def sync_all_mapped_products():
    with get_db_connection() as conn:
        product_ids = conn.execute("SELECT DISTINCT internal_product_id FROM platform_mappings WHERE sync_enabled = 1").fetchall()
        unique_ids = [r[0] for r in product_ids]
    
    for pid in unique_ids:
        sync_stock_to_platform(pid)
