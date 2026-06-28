"""Product repository — direct SQL access."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str


def get_all_active(search: str = None, category: str = None, brand_id: int = None, origin_id: int = None, location_id: int = None, offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT * FROM products WHERE is_active = 1"
    params = []
    if search:
        base += " AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ? OR color LIKE ? OR size LIKE ? OR material LIKE ? OR model_number LIKE ?)"
        q = f"%{search}%"
        params.extend([q, q, q, q, q, q, q])
    if category:
        base += " AND category = ?"
        params.append(category)
    if brand_id:
        base += " AND brand_id = ?"
        params.append(brand_id)
    if origin_id:
        base += " AND origin_id = ?"
        params.append(origin_id)
    if location_id:
        base += " AND location_id = ?"
        params.append(location_id)
    
    # Count
    count_sql = base.replace("SELECT *", "SELECT COUNT(*)")
    total = conn.execute(count_sql, params).fetchone()[0]
    # Data
    base += " ORDER BY name LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(base, params).fetchall()
    return rows_to_list(rows), total


def get_by_id(product_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    return row_to_dict(row) if row else None


def get_by_sku(sku: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM products WHERE sku = ?", (sku,)).fetchone()
    return row_to_dict(row) if row else None


def get_by_barcode(barcode: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM products WHERE barcode = ?", (barcode,)).fetchone()
    return row_to_dict(row) if row else None


def create(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO products (sku, name, name_en, price, price_wholesale, price_half_wholesale, price_other, "
        "cost_price, stock_qty, barcode, category, color, size, material, is_bundle, type, composition_json, reorder_level, "
        "brand_id, origin_id, location_id, manufacturer_id, is_important, is_shortage, model_number, tax_rate, tax_type, "
        "ref_currency_id, ref_cost_price, last_sold_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data["sku"], data["name"], data.get("name_en", ""), data.get("price", 0), 
         data.get("price_wholesale", 0), data.get("price_half_wholesale", 0), data.get("price_other", 0),
         data.get("cost_price", 0), data.get("stock_qty", 0), data.get("barcode", ""), 
         data.get("category", ""), data.get("color"), data.get("size"), data.get("material"),
         1 if data.get("is_bundle") else 0, data.get("type", "simple"), data.get("composition_json", "[]"), data.get("reorder_level", 5),
         data.get("brand_id"), data.get("origin_id"), data.get("location_id"), 
         data.get("manufacturer_id"), 1 if data.get("is_important") else 0,
         1 if data.get("is_shortage") else 0, data.get("model_number"), 
         data.get("tax_rate", 15), data.get("tax_type", "standard"),
         data.get("ref_currency_id"), data.get("ref_cost_price"), data.get("last_sold_at"), now_str()),
    )
    conn.commit()
    return cursor.lastrowid


def update(product_id: int, data: dict):
    conn = get_connection()
    fields, values = [], []
    valid_keys = ("name", "name_en", "price", "price_wholesale", "price_half_wholesale", "price_other", 
                  "cost_price", "stock_qty", "barcode", "category", "is_active", "color", "size", 
                  "material", "is_bundle", "type", "composition_json", "reorder_level", "brand_id", "origin_id", "location_id", 
                  "manufacturer_id", "is_important", "is_shortage", "model_number", "tax_rate", "tax_type",
                  "ref_currency_id", "ref_cost_price", "last_sold_at")
    
    for key in valid_keys:
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            val = data[key]
            if key in ("is_active", "is_bundle", "is_important", "is_shortage"):
                val = 1 if val else 0
            values.append(val)
    if not fields:
        return
    fields.append("updated_at = ?")
    values.append(now_str())
    values.append(product_id)
    conn.execute(f"UPDATE products SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()


def bulk_update(product_ids: list[int], data: dict):
    """Update multiple products at once (e.g., change category or brand)."""
    conn = get_connection()
    fields, values = [], []
    valid_keys = ("category", "brand_id", "origin_id", "location_id", "manufacturer_id", "is_active")
    
    for key in valid_keys:
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            val = data[key]
            if key == "is_active": val = 1 if val else 0
            values.append(val)
            
    if not fields: return
    fields.append("updated_at = ?")
    values.append(now_str())
    
    placeholders = ",".join(["?"] * len(product_ids))
    sql = f"UPDATE products SET {', '.join(fields)} WHERE id IN ({placeholders})"
    conn.execute(sql, values + product_ids)
    conn.commit()


def find_duplicate_barcodes():
    """Identify products sharing the same barcode."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT barcode, COUNT(*) as count, GROUP_CONCAT(name) as names "
        "FROM products WHERE barcode != '' AND is_active = 1 "
        "GROUP BY barcode HAVING count > 1"
    ).fetchall()
    return rows_to_list(rows)


def soft_delete(product_id: int):
    conn = get_connection()
    conn.execute("UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?",
                 (now_str(), product_id))
    conn.commit()


def get_low_stock(threshold: int = 10, limit: int = 50):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM products WHERE is_active = 1 AND stock_qty < ? ORDER BY stock_qty ASC LIMIT ?",
        (threshold, limit),
    ).fetchall()
    return rows_to_list(rows)


def get_categories():
    conn = get_connection()
    rows = conn.execute(
        "SELECT DISTINCT category FROM products WHERE is_active = 1 AND category != '' ORDER BY category"
    ).fetchall()
    return [r["category"] for r in rows]


def update_stock(product_id: int, qty_delta: float, conversion_factor: float = 1, conn=None, enforce_floor: bool = True):
    """
    Update stock and handle bundle components if applicable.
    qty_delta is negative for sales, positive for returns/purchases.
    """
    if conn is None:
        conn = get_connection()
        must_commit = True
    else:
        must_commit = False

    actual_delta = qty_delta * conversion_factor

    # Fetch product info
    p_row = conn.execute("SELECT name, stock_qty, type, is_bundle, composition_json FROM products WHERE id = ?", (product_id,)).fetchone()

    # Floor check
    if enforce_floor and actual_delta < 0 and p_row:
        # We don't enforce floor on the virtual parent of a composite/bundle, we enforce on its components.
        is_virtual = p_row["type"] == 'composite' or p_row["is_bundle"]
        if not is_virtual and p_row["stock_qty"] + actual_delta < 0:
            if must_commit: conn.rollback()
            raise ValueError(f"الرصيد الكلي غير كافٍ للمنتج: {p_row['name']}. المتوفر: {p_row['stock_qty']}, المطلوب خصمه: {-actual_delta}")

    # 1. Update the product itself (convert quantity to base units)
    conn.execute(
        "UPDATE products SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?",
        (actual_delta, now_str(), product_id),
    )

    # 2. If it's a bundle or composite, update components
    # We auto-deduct components on SALES/RETURNS via recursive call
    row = conn.execute("SELECT is_bundle, type, composition_json FROM products WHERE id = ?", (product_id,)).fetchone()
    if row:
        # Check v1.6 composite style (JSON)
        if row["type"] == 'composite' and row["composition_json"]:
            import json
            try:
                composition = json.loads(row["composition_json"])
                for comp in composition:
                    comp_product_id = comp.get("productId") or comp.get("product_id")
                    comp_qty = comp.get("quantity") or comp.get("qty", 0)
                    if comp_product_id and comp_qty:
                        comp_qty_delta = actual_delta * comp_qty
                        update_stock(comp_product_id, comp_qty_delta, conn=conn, enforce_floor=enforce_floor)
            except ValueError:
                if must_commit: conn.rollback()
                raise # Bubble up stock floor errors immediately
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error parsing composition for product {product_id}: {e}")
        
        # Check v1.15 bundle style (product_bundles table)
        elif row["is_bundle"]:
            components = conn.execute(
                "SELECT component_product_id, qty FROM product_bundles WHERE bundle_product_id = ?",
                (product_id,)
            ).fetchall()
            for comp in components:
                comp_qty_delta = actual_delta * comp["qty"]
                update_stock(comp["component_product_id"], comp_qty_delta, conn=conn, enforce_floor=enforce_floor)

    if must_commit:
        conn.commit()


def reconcile_stock_consistency() -> dict:
    """
    Reconciles product stock with the actual sum of stock_movements.
    Useful for health checks and self-healing.
    """
    conn = get_connection()
    products = conn.execute("SELECT id, name, stock_qty, type FROM products").fetchall()
    
    fixed = 0
    verified = 0
    
    for p in products:
        if p["type"] == "composite":
            # Composite products shouldn't have direct physical stock (usually).
            # But if they do, we let it be or just verify it.
            verified += 1
            continue
            
        # Calculate true stock from movements
        movement_sum = conn.execute("SELECT SUM(qty_delta) FROM stock_movements WHERE product_id = ?", (p["id"],)).fetchone()[0]
        actual_stock = movement_sum if movement_sum is not None else 0
        
        # We only really want to auto-fix if we fully trust the ledger.
        # Since this is a self-healing tool, we just log and fix if discrepant.
        # (Assuming the movement ledger is the absolute truth).
        # We'll skip auto-fix if actual_stock isn't calculated due to missing ledger history.
        if movement_sum is not None and round(actual_stock, 2) != round(p["stock_qty"], 2):
            conn.execute("UPDATE products SET stock_qty = ? WHERE id = ?", (actual_stock, p["id"]))
            
            # Log this systematic correction
            from app.repositories import ops_log_repo
            ops_log_repo.log_event(
                branch_id=1,
                user_id=0,
                role="system",
                event_type="system_reconcile",
                entity_type="product",
                entity_id=p["id"],
                payload={
                    "old_stock": p["stock_qty"],
                    "new_stock": actual_stock,
                    "difference": abs(actual_stock - p["stock_qty"])
                }
            )
            fixed += 1
        else:
            verified += 1
            
    conn.commit()
    return {"fixed": fixed, "verified": verified}



def count_active():
    conn = get_connection()
    return conn.execute("SELECT COUNT(*) FROM products WHERE is_active = 1").fetchone()[0]


def set_bundle_components(bundle_id: int, components: list):
    """
    Set components for a bundle.
    components: list of dicts [{'product_id': int, 'qty': int}]
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM product_bundles WHERE bundle_product_id = ?", (bundle_id,))
        for c in components:
            cursor.execute(
                "INSERT INTO product_bundles (bundle_product_id, component_product_id, qty) VALUES (?, ?, ?)",
                (bundle_id, c["product_id"], c["qty"])
            )
        # Mark as bundle
        cursor.execute("UPDATE products SET is_bundle = 1 WHERE id = ?", (bundle_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e


def get_bundle_components(bundle_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT pb.*, p.name, p.sku FROM product_bundles pb "
        "JOIN products p ON pb.component_product_id = p.id "
        "WHERE pb.bundle_product_id = ?", (bundle_id,)
    ).fetchall()
    return rows_to_list(rows)


def deactivate_zero_stock():
    """Bulk deactivate all products with 0 or negative stock."""
    conn = get_connection()
    cursor = conn.execute("UPDATE products SET is_active = 0, updated_at = ? WHERE stock_qty <= 0", (now_str(),))
    conn.commit()
    return cursor.rowcount


def get_stagnant_products(days: int):
    """
    Find products that have had NO movements (invoices or purchases) in the last X days.
    """
    conn = get_connection()
    rows = conn.execute(
        """SELECT * FROM products 
           WHERE is_active = 1 
           AND id NOT IN (
               SELECT DISTINCT product_id 
               FROM stock_movements 
               WHERE created_at >= date('now', '-' || ? || ' days')
           )""", (days,)
    ).fetchall()
    return rows_to_list(rows)


def get_product_ledger(product_id: int):
    """
    Get all stock movements for a specific product, ordered by date.
    """
    conn = get_connection()
    rows = conn.execute(
        """SELECT * FROM stock_movements 
           WHERE product_id = ? 
           ORDER BY created_at DESC""", (product_id,)
    ).fetchall()
    return rows_to_list(rows)
