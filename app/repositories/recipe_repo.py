from app.database.connection import get_connection
from app.models.recipe import RecipeCreate, RecipeUpdate
from datetime import datetime

def create_recipe(data: RecipeCreate):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO recipes (recipe_no, product_id, output_qty, notes) VALUES (?, ?, ?, ?)",
            (data.recipe_no, data.product_id, data.output_qty, data.notes)
        )
        recipe_id = cursor.lastrowid
        for item in data.items:
            cursor.execute(
                "INSERT INTO recipe_items (recipe_id, ingredient_id, qty, wastage_pct) VALUES (?, ?, ?, ?)",
                (recipe_id, item.ingredient_id, item.qty, item.wastage_pct)
            )
        conn.commit()
        return recipe_id

def get_recipe_by_product(product_id: int):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM recipes WHERE product_id = ?", (product_id,))
        recipe = cursor.fetchone()
        if not recipe:
            return None
        cursor.execute("SELECT * FROM recipe_items WHERE recipe_id = ?", (recipe['id'],))
        items = cursor.fetchall()
        return {**dict(recipe), "items": [dict(i) for i in items]}

def create_production_batch(recipe_id: int, output_qty: float, notes: str = None):
    with get_connection() as conn:
        cursor = conn.cursor()
        batch_no = f"BCH-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        cursor.execute(
            "INSERT INTO recipe_batches (batch_no, recipe_id, output_qty, status, notes) VALUES (?, ?, ?, 'pending', ?)",
            (batch_no, recipe_id, output_qty, notes)
        )
        conn.commit()
        return cursor.lastrowid

def complete_production_batch(batch_id: int, user_id: int):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM recipe_batches WHERE id = ?", (batch_id,))
        batch = cursor.fetchone()
        if not batch or batch['status'] != 'pending':
            return False

        cursor.execute("SELECT * FROM recipe_items WHERE recipe_id = ?", (batch['recipe_id'],))
        items = cursor.fetchall()

        # 1. Deduct ingredients (including wastage)
        for item in items:
            total_qty = item['qty'] * (batch['output_qty'] / 1) # Simplified if recipe is per 1 unit
            # Add wastage
            total_qty = total_qty * (1 + (item['wastage_pct'] / 100))
            
            cursor.execute(
                "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
                (total_qty, item['ingredient_id'])
            )
            # Log movement
            cursor.execute(
                "INSERT INTO stock_movements (product_id, type, qty, reason, ref_id, user_id) VALUES (?, 'OUT', ?, ?, ?, ?)",
                (item['ingredient_id'], total_qty, f"Batch Production {batch['batch_no']}", batch_id, user_id)
            )

        # 2. Increment finished good
        cursor.execute("SELECT product_id FROM recipes WHERE id = ?", (batch['recipe_id'],))
        recipe = cursor.fetchone()
        cursor.execute(
            "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
            (batch['output_qty'], recipe['product_id'])
        )
        cursor.execute(
            "INSERT INTO stock_movements (product_id, type, qty, reason, ref_id, user_id) VALUES (?, 'IN', ?, ?, ?, ?)",
            (recipe['product_id'], batch['output_qty'], f"Batch Production {batch['batch_no']}", batch_id, user_id)
        )

        # 3. Finalize batch
        cursor.execute(
            "UPDATE recipe_batches SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
            (batch_id,)
        )
        conn.commit()
        return True
