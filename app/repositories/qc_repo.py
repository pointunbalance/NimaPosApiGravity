"""Quality Control repository — inspections, rules, and defects."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def create_inspection(data: dict) -> int:
    conn = get_connection()
    try:
        # 1. Insert inspection
        cursor = conn.execute(
            """INSERT INTO qc_inspections (purchase_id, product_id, batch_id, inspector_id, inspection_date, status, score, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (data.get("purchase_id"), data["product_id"], data.get("batch_id"), data.get("inspector_id"),
             data.get("inspection_date", now_str()), data["status"], data.get("score", 0), data.get("notes", ""))
        )
        inspection_id = cursor.lastrowid
        
        # 2. Insert defects if any
        defects = data.get("defects", [])
        for defect in defects:
            conn.execute(
                """INSERT INTO qc_defect_logs (inspection_id, defect_type, quantity, description)
                   VALUES (?, ?, ?, ?)""",
                (inspection_id, defect["type"], defect.get("quantity", 0), defect.get("description", ""))
            )
        
        # 3. Update Batch Status
        if data.get("batch_id"):
            conn.execute(
                "UPDATE product_batches SET qc_status = ?, updated_at = ? WHERE id = ?",
                (data["status"], now_str(), data["batch_id"])
            )
            
        conn.commit()
        return inspection_id
    except Exception as e:
        conn.rollback()
        raise e

def get_pending_inspections():
    """List batches that are still 'Pending' QC."""
    conn = get_connection()
    rows = conn.execute(
        """SELECT pb.*, p.name as product_name, p.sku, pur.supplier_name, pur.date as purchase_date
           FROM product_batches pb
           JOIN products p ON pb.product_id = p.id
           LEFT JOIN purchases pur ON pb.purchase_id = pur.id
           WHERE pb.qc_status = 'Pending'
           ORDER BY pb.created_at ASC"""
    ).fetchall()
    return rows_to_list(rows)

def get_inspection_history(product_id: int = None):
    conn = get_connection()
    sql = "SELECT * FROM qc_inspections"
    params = []
    if product_id:
        sql += " WHERE product_id = ?"
        params.append(product_id)
    sql += " ORDER BY inspection_date DESC"
    rows = conn.execute(sql, params).fetchall()
    return rows_to_list(rows)

def get_defects(inspection_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM qc_defect_logs WHERE inspection_id = ?", (inspection_id,)).fetchall()
    return rows_to_list(rows)

def set_qc_rule(data: dict):
    conn = get_connection()
    # Upsert logic for rules
    existing = conn.execute(
        "SELECT id FROM qc_rules WHERE product_id = ? OR category_id = ?",
        (data.get("product_id"), data.get("category_id"))
    ).fetchone()
    
    if existing:
        conn.execute(
            "UPDATE qc_rules SET min_score_required = ?, is_mandatory = ? WHERE id = ?",
            (data["min_score_required"], 1 if data.get("is_mandatory") else 0, existing["id"])
        )
    else:
        conn.execute(
            "INSERT INTO qc_rules (category_id, product_id, min_score_required, is_mandatory) VALUES (?, ?, ?, ?)",
            (data.get("category_id"), data.get("product_id"), data["min_score_required"], 1 if data.get("is_mandatory") else 0)
        )
    conn.commit()
