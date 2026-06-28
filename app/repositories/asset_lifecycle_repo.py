"""Repository for Fixed Asset Lifecycle — movements, maintenance, and disposal."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def log_movement(asset_id: int, to_location: str, authorized_by: str = "", reason: str = ""):
    conn = get_connection()
    try:
        # 1. Get current location
        asset = conn.execute("SELECT location FROM fixed_assets WHERE id = ?", (asset_id,)).fetchone()
        from_location = asset["location"] if asset else None
        
        # 2. Record movement
        conn.execute(
            """INSERT INTO asset_movements (asset_id, from_location, to_location, movement_date, authorized_by, reason)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (asset_id, from_location, to_location, now_str(), authorized_by, reason)
        )
        
        # 3. Update asset location
        conn.execute("UPDATE fixed_assets SET location = ? WHERE id = ?", (to_location, asset_id))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e

def log_maintenance(asset_id: int, data: dict):
    conn = get_connection()
    try:
        # 1. Record maintenance log
        conn.execute(
            """INSERT INTO asset_maintenance_log (asset_id, maintenance_date, maintenance_type, cost, performed_by, details, next_due_date)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (asset_id, data["maintenance_date"], data["maintenance_type"], data.get("cost", 0),
             data.get("performed_by", ""), data.get("details", ""), data.get("next_due_date"))
        )
        
        # 2. Update asset status and last maintenance
        conn.execute(
            "UPDATE fixed_assets SET last_maintenance_date = ?, status = 'Active' WHERE id = ?",
            (data["maintenance_date"], asset_id)
        )
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e

def get_movement_history(asset_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM asset_movements WHERE asset_id = ? ORDER BY movement_date DESC", (asset_id,)).fetchall()
    return rows_to_list(rows)

def get_maintenance_history(asset_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM asset_maintenance_log WHERE asset_id = ? ORDER BY maintenance_date DESC", (asset_id,)).fetchall()
    return rows_to_list(rows)

def dispose_asset(asset_id: int, salvage_value: float, reason: str = ""):
    """Retires an asset and updates its final value."""
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE fixed_assets SET status = 'Disposed', value = ?, note = ? || ' ' || note WHERE id = ?",
            (salvage_value, f"Disposed: {reason}", asset_id)
        )
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
