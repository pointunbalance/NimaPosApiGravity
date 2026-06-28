"""Manufacturing repository — BOMs and Production Orders."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def create_bom(data: dict) -> int:
    conn = get_connection()
    try:
        conn.execute("BEGIN TRANSACTION")
        cursor = conn.execute(
            "INSERT INTO bom_headers (product_id, name, version, total_estimated_cost) VALUES (?, ?, ?, ?)",
            (data["product_id"], data["name"], data.get("version", "1.0"), data.get("total_estimated_cost", 0))
        )
        bom_id = cursor.lastrowid
        for item in data.get("items", []):
            conn.execute(
                "INSERT INTO bom_items (bom_id, component_product_id, quantity, unit_name, wastage_percent, unit_cost) VALUES (?, ?, ?, ?, ?, ?)",
                (bom_id, item["component_product_id"], item["quantity"], item.get("unit_name", ""),
                 item.get("wastage_percent", 0), item.get("unit_cost", 0))
            )
        conn.execute("COMMIT")
        return bom_id
    except Exception as e:
        conn.execute("ROLLBACK")
        raise e

def get_bom(bom_id: int):
    conn = get_connection()
    row = conn.execute("SELECT b.*, p.name as product_name FROM bom_headers b JOIN products p ON p.id = b.product_id WHERE b.id = ?", (bom_id,)).fetchone()
    if not row: return None
    bom = row_to_dict(row)
    bom["items"] = rows_to_list(conn.execute(
        "SELECT bi.*, p.name as component_name FROM bom_items bi JOIN products p ON p.id = bi.component_product_id WHERE bi.bom_id = ?",
        (bom_id,)).fetchall())
    return bom

def list_boms(product_id: int = None):
    conn = get_connection()
    sql = "SELECT b.*, p.name as product_name FROM bom_headers b JOIN products p ON p.id = b.product_id"
    params = []
    if product_id:
        sql += " WHERE b.product_id = ?"
        params.append(product_id)
    return rows_to_list(conn.execute(sql, params).fetchall())

def produce_product(bom_id: int, quantity: float, user_id: int = 1):
    """Executes production: deducts components and adds finished good."""
    conn = get_connection()
    bom = get_bom(bom_id)
    if not bom: raise Exception("BOM not found")
    
    try:
        conn.execute("BEGIN TRANSACTION")
        
        # 1. Deduct Raw Materials
        for item in bom["items"]:
            needed_qty = item["quantity"] * quantity * (1 + item["wastage_percent"]/100)
            # Check stock
            curr_stock = conn.execute("SELECT stock_qty FROM products WHERE id = ?", (item["component_product_id"],)).fetchone()[0]
            if curr_stock < needed_qty:
                raise Exception(f"Insufficient stock for {item['component_name']}: Need {needed_qty}, Have {curr_stock}")
            
            conn.execute("UPDATE products SET stock_qty = stock_qty - ?, updated_at = ? WHERE id = ?",
                         (needed_qty, now_str(), item["component_product_id"]))
            
            # Log Movement
            from app.repositories import stock_movement_repo
            stock_movement_repo.create_movement(conn, {
                "product_id": item["component_product_id"],
                "qty": -needed_qty,
                "type": "production_deduction",
                "reference": f"BOM-{bom_id}",
                "notes": f"Production of {quantity} units of {bom['product_name']}"
            })

        # 2. Add Finished Good
        conn.execute("UPDATE products SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?",
                     (quantity, now_str(), bom["product_id"]))
        
        # Log Movement
        stock_movement_repo.create_movement(conn, {
            "product_id": bom["product_id"],
            "qty": quantity,
            "type": "production_output",
            "reference": f"BOM-{bom_id}",
            "notes": f"Finished good entry from BOM"
        })

        conn.execute("COMMIT")
    except Exception as e:
        conn.execute("ROLLBACK")
        raise e
