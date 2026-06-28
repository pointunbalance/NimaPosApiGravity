"""Fleet repository — vehicles, assignments, and fuel logs."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def create_vehicle(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO fleet_vehicles (plate_number, model, vehicle_type, payload_capacity_kg, status, odometer_reading)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (data["plate_number"], data["model"], data.get("vehicle_type"), 
         data.get("payload_capacity_kg"), data.get("status", "available"), data.get("odometer_reading", 0))
    )
    conn.commit()
    return cursor.lastrowid

def update_vehicle(v_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    valid_keys = ("plate_number", "model", "vehicle_type", "payload_capacity_kg", "status", "odometer_reading", "last_service_date", "is_active")
    for key in valid_keys:
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            values.append(data[key])
    if not fields:
        return
    values.append(v_id)
    conn.execute(f"UPDATE fleet_vehicles SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()

def assign_driver(vehicle_id: int, driver_id: int, notes: str = ""):
    conn = get_connection()
    # 1. End any active assignment for this vehicle
    conn.execute(
        "UPDATE fleet_driver_assignments SET returned_at = ? WHERE vehicle_id = ? AND returned_at IS NULL",
        (now_str(), vehicle_id)
    )
    # 2. Create new assignment
    conn.execute(
        "INSERT INTO fleet_driver_assignments (vehicle_id, driver_id, notes) VALUES (?, ?, ?)",
        (vehicle_id, driver_id, notes)
    )
    # 3. Update vehicle status
    conn.execute("UPDATE fleet_vehicles SET status = 'in_transit' WHERE id = ?", (vehicle_id,))
    conn.commit()

def log_fuel(data: dict):
    conn = get_connection()
    conn.execute(
        """INSERT INTO fleet_fuel_logs (vehicle_id, date, liters, cost, odometer_reading, receipt_image)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (data["vehicle_id"], data.get("date", now_str()), data["liters"], data["cost"], 
         data.get("odometer_reading"), data.get("receipt_image"))
    )
    # Update vehicle odometer if provided
    if data.get("odometer_reading"):
        conn.execute(
            "UPDATE fleet_vehicles SET odometer_reading = ? WHERE id = ?",
            (data["odometer_reading"], data["vehicle_id"])
        )
    conn.commit()

def get_all_vehicles():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM fleet_vehicles WHERE is_active = 1").fetchall()
    return rows_to_list(rows)

def get_vehicle_history(v_id: int):
    conn = get_connection()
    assignments = conn.execute(
        """SELECT fda.*, u.username as driver_name 
           FROM fleet_driver_assignments fda 
           JOIN users u ON fda.driver_id = u.id 
           WHERE vehicle_id = ? ORDER BY assigned_at DESC""", (v_id,)
    ).fetchall()
    fuel = conn.execute(
        "SELECT * FROM fleet_fuel_logs WHERE vehicle_id = ? ORDER BY date DESC", (v_id,)
    ).fetchall()
    return {
        "assignments": rows_to_list(assignments),
        "fuel_logs": rows_to_list(fuel)
    }
