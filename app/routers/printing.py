"""Barcode / Sticker Printing router."""
from fastapi import APIRouter, Depends, HTTPException
from app.models.common import ApiResponse
from app.models.printing import LabelTemplateCreate, LabelTemplateUpdate
from app.database.connection import get_connection
from app.middleware.auth_middleware import get_current_user
from app.utils.helpers import rows_to_list, row_to_dict, now_str

router = APIRouter(tags=["Inventory"])


# ─── Label Templates ───
@router.get("/label-templates", summary="List barcode or sticker templates")
def list_templates(type: str = None, user=Depends(get_current_user)):
    conn = get_connection()
    if type:
        rows = conn.execute(
            "SELECT * FROM label_templates WHERE type = ? ORDER BY created_at DESC", (type,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM label_templates ORDER BY created_at DESC").fetchall()
    return ApiResponse(ok=True, data=rows_to_list(rows))


@router.post("/label-templates", summary="Create a new printing template")
def create_template(body: LabelTemplateCreate, user=Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO label_templates "
        "(name, type, width, height, horizontal_gap, vertical_gap, font_size, "
        "show_name, show_price, show_code, show_store_name, custom_text, "
        "barcode_format, paper_type, labels_per_row, design_type, config_json) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (body.name, body.type, body.width, body.height,
         body.horizontal_gap, body.vertical_gap, body.font_size,
         int(body.show_name), int(body.show_price), int(body.show_code),
         int(body.show_store_name), body.custom_text or "",
         body.barcode_format, body.paper_type, body.labels_per_row,
         body.design_type, body.config_json or "{}"),
    )
    conn.commit()
    return ApiResponse(ok=True, data={"id": cursor.lastrowid})


@router.get("/label-templates/{template_id}", summary="Get printing template details")
def get_template(template_id: int, user=Depends(get_current_user)):
    conn = get_connection()
    row = conn.execute("SELECT * FROM label_templates WHERE id = ?", (template_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Template not found")
    return ApiResponse(ok=True, data=row_to_dict(row))


@router.put("/label-templates/{template_id}", summary="Update an existing printing template")
def update_template(template_id: int, body: LabelTemplateUpdate, user=Depends(get_current_user)):
    conn = get_connection()
    fields, params = [], []
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is not None:
            if isinstance(value, bool):
                value = int(value)
            fields.append(f"{field} = ?")
            params.append(value)
    if not fields:
        raise HTTPException(400, "No fields to update")
    params.append(template_id)
    conn.execute(f"UPDATE label_templates SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()
    row = conn.execute("SELECT * FROM label_templates WHERE id = ?", (template_id,)).fetchone()
    return ApiResponse(ok=True, data=row_to_dict(row))


@router.delete("/label-templates/{template_id}", summary="Delete a printing template")
def delete_template(template_id: int, user=Depends(get_current_user)):
    conn = get_connection()
    conn.execute("DELETE FROM label_templates WHERE id = ?", (template_id,))
    conn.commit()
    return ApiResponse(ok=True, data={"deleted": template_id})


# ─── Print Queue Helpers ───
@router.get("/printing/products")
def get_printable_products(search: str = None, user=Depends(get_current_user)):
    """Get products for barcode printing with optional search."""
    conn = get_connection()
    if search:
        rows = conn.execute(
            "SELECT id, name, barcode, price, sku, stock_qty FROM products "
            "WHERE (name LIKE ? OR barcode LIKE ? OR sku LIKE ?) AND is_active = 1 LIMIT 50",
            (f"%{search}%", f"%{search}%", f"%{search}%"),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, name, barcode, price, sku, stock_qty FROM products "
            "WHERE is_active = 1 AND barcode != '' LIMIT 50"
        ).fetchall()
    return ApiResponse(ok=True, data=rows_to_list(rows))
