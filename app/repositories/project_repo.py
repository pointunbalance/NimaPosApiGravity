"""Project Costing and WBS Repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

# ── Projects ──
def create_project(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO projects (name, customer_id, description, budget, start_date, end_date, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["name"], data.get("customer_id"), data.get("description", ""), data.get("budget", 0.0),
         data.get("start_date"), data.get("end_date"), data.get("status", "planning"), now_str())
    )
    conn.commit()
    return cursor.lastrowid

def get_projects(status: str = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    q = "SELECT * FROM projects WHERE 1=1"
    params = []
    if status:
        q += " AND status = ?"
        params.append(status)
    
    count_sql = q.replace("SELECT *", "SELECT COUNT(*)")
    total = conn.execute(count_sql, params).fetchone()[0]
    
    q += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    rows = conn.execute(q, params).fetchall()
    return rows_to_list(rows), total

def get_project(project_id: int):
    row = get_connection().execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return row_to_dict(row) if row else None

# ── WBS Tasks ──
def add_wbs_task(project_id: int, data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO wbs_tasks (project_id, name, allocated_budget, estimated_hours, status) VALUES (?, ?, ?, ?, ?)",
        (project_id, data["name"], data.get("allocated_budget", 0.0), data.get("estimated_hours", 0.0), data.get("status", "pending"))
    )
    conn.commit()
    return cursor.lastrowid

def get_wbs_tasks(project_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM wbs_tasks WHERE project_id = ? ORDER BY id ASC", (project_id,)).fetchall()
    return rows_to_list(rows)

# ── Timesheets & Labor Costing ──
def log_timesheet(project_id: int, data: dict) -> int:
    conn = get_connection()
    total_cost = data["hours_worked"] * data["hourly_rate"]
    cursor = conn.execute(
        """INSERT INTO project_timesheets (project_id, task_id, employee_id, date, hours_worked, hourly_rate, total_cost, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (project_id, data.get("task_id"), data.get("employee_id"), data["date"], data["hours_worked"], data["hourly_rate"], total_cost, data.get("note", ""))
    )
    conn.commit()
    return cursor.lastrowid

# ── Material Consumption & Inventory Logic ──
def consume_material(project_id: int, data: dict) -> int:
    conn = get_connection()
    
    # 1. Fetch current product cost (Average Cost method usually, but using DB cost for simplicity here)
    product = conn.execute("SELECT cost_price as cost, stock_qty, name FROM products WHERE id = ?", (data["product_id"],)).fetchone()
    if not product:
        raise ValueError("Product not found.")
        
    unit_cost = product["cost"]
    total_cost = unit_cost * data["quantity"]
    
    if product["stock_qty"] < data["quantity"]:
        raise ValueError(f"Insufficient stock for {product['name']}. Available: {product['stock_qty']}")
        
    # 2. Insert into project_materials
    cursor = conn.execute(
        """INSERT INTO project_materials (project_id, task_id, product_id, quantity, unit_cost, total_cost, date_consumed, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (project_id, data.get("task_id"), data["product_id"], data["quantity"], unit_cost, total_cost, now_str(), data.get("note", ""))
    )
    mat_id = cursor.lastrowid
    
    # 3. Deduct from Inventory (Atomically)
    conn.execute("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?", (data["quantity"], data["product_id"]))
    
    # Optional: Log to stock_movements for audit trail
    conn.execute(
        """INSERT INTO stock_movements (product_id, movement_type, qty_delta, reference_type, reference_id, created_at)
           VALUES (?, 'project_consumption', ?, 'project', ?, ?)""",
        (data["product_id"], -data["quantity"], project_id, now_str())
    )
    
    conn.commit()
    return mat_id

# ── Real-Time Project Costing Margin Engine ──
def get_project_costing_summary(project_id: int) -> dict:
    conn = get_connection()
    
    project = get_project(project_id)
    if not project:
        raise ValueError("Project not found.")
        
    # Aggregate Labor Costs
    labor_row = conn.execute("SELECT SUM(total_cost) FROM project_timesheets WHERE project_id = ?", (project_id,)).fetchone()
    total_labor = labor_row[0] if labor_row and labor_row[0] else 0.0
    
    # Aggregate Material Costs
    material_row = conn.execute("SELECT SUM(total_cost) FROM project_materials WHERE project_id = ?", (project_id,)).fetchone()
    total_material = material_row[0] if material_row and material_row[0] else 0.0
    
    total_actual_cost = total_labor + total_material
    remaining_budget = project["budget"] - total_actual_cost
    
    margin_pct = 0.0
    if project["budget"] > 0:
        margin_pct = (remaining_budget / project["budget"]) * 100
        
    return {
        "project_id": project_id,
        "project_name": project["name"],
        "total_budget": project["budget"],
        "total_labor_cost": total_labor,
        "total_material_cost": total_material,
        "total_actual_cost": total_actual_cost,
        "remaining_budget": remaining_budget,
        "profit_margin_percentage": round(margin_pct, 2)
    }
