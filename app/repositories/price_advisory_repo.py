"""Repository for Price Monitoring and Smart Advisory (v2.11.0)."""
from datetime import datetime
from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, row_to_dict
from app.repositories import currency_repo, product_repo, pricing_rules_repo

def get_price_suggestions():
    """Calculates price adjustment suggestions based on exchange rate changes (Currency Pinning)."""
    conn = get_connection()
    sql = """
        SELECT p.id, p.sku, p.name, p.price as current_price, p.cost_price as current_cost, 
               p.ref_cost_price, p.ref_currency_id, c.code as ref_currency_code, c.exchange_rate as current_rate
        FROM products p
        JOIN currencies c ON p.ref_currency_id = c.id
        WHERE p.ref_cost_price > 0 AND p.ref_currency_id IS NOT NULL
    """
    rows = conn.execute(sql).fetchall()
    products = rows_to_list(rows)
    
    suggestions = []
    for p in products:
        expected_cost = round(p["ref_cost_price"] * p["current_rate"], 2)
        if abs(expected_cost - p["current_cost"]) > (p["current_cost"] * 0.01):
            margin_ratio = p["current_price"] / p["current_cost"] if p["current_cost"] > 0 else 1.2
            suggested_price = round(expected_cost * margin_ratio, 2)
            
            suggestions.append({
                "product_id": p["id"],
                "sku": p["sku"],
                "name": p["name"],
                "type": "currency_sync",
                "ref_currency": p["ref_currency_code"],
                "ref_cost": p["ref_cost_price"],
                "old_cost": p["current_cost"],
                "new_cost": expected_cost,
                "old_price": p["current_price"],
                "suggested_price": suggested_price,
                "diff_percentage": round(((suggested_price - p["current_price"]) / p["current_price"] * 100), 2) if p["current_price"] > 0 else 0
            })
    return suggestions

def get_optimization_suggestions():
    """Calculates price optimization suggestions based on dynamic margin rules and velocity."""
    conn = get_connection()
    sql = """
        SELECT p.id, p.sku, p.name, p.price as current_price, p.cost_price as current_cost, 
               p.category as category_name, p.last_sold_at,
               c.id as category_id, c.default_margin_pct as cat_margin
        FROM products p
        LEFT JOIN categories c ON p.category = c.name
        WHERE p.is_active = 1 AND p.cost_price > 0
    """
    rows = conn.execute(sql).fetchall()
    products = rows_to_list(rows)
    all_rules = pricing_rules_repo.get_all()
    
    suggestions = []
    now = datetime.now()
    
    for p in products:
        target_margin_pct = p.get("cat_margin") or 20.0
        velocity_multiplier = 1.0
        
        for rule in all_rules:
            if rule["category_id"] == p["category_id"] or rule["category_id"] is None:
                if rule["min_cost"] <= p["current_cost"] <= rule["max_cost"]:
                    target_margin_pct = rule["target_margin_pct"]
                    velocity_multiplier = rule["velocity_multiplier"]
                    break
        
        if p["last_sold_at"]:
            try:
                last_sold = datetime.strptime(p["last_sold_at"], "%Y-%m-%d %H:%M:%S")
                days_stagnant = (now - last_sold).days
                if days_stagnant > 60:
                    target_margin_pct += 5.0
                elif days_stagnant < 7:
                    target_margin_pct -= 2.0
            except (ValueError, TypeError):
                target_margin_pct += 3.0
        else:
            target_margin_pct += 3.0 
            
        suggested_price = round(p["current_cost"] * (1 + (target_margin_pct * velocity_multiplier / 100.0)), 2)
        diff_pct = abs((suggested_price - p["current_price"]) / p["current_price"] * 100) if p["current_price"] > 0 else 0
        
        if diff_pct > 2.0:
            suggestions.append({
                "product_id": p["id"],
                "sku": p["sku"],
                "name": p["name"],
                "type": "optimization",
                "category": p["category_name"],
                "current_price": p["current_price"],
                "current_cost": p["current_cost"],
                "target_margin": target_margin_pct,
                "suggested_price": suggested_price,
                "diff_percentage": round(((suggested_price - p["current_price"]) / p["current_price"] * 100), 2) if p["current_price"] > 0 else 0,
                "reason": "Stagnant" if (p["last_sold_at"] and (now - datetime.strptime(p["last_sold_at"], "%Y-%m-%d %H:%M:%S")).days > 60) else "Rule-based optimization"
            })
    return suggestions

def apply_suggestions(suggestions: list):
    """Bulk update prices and optionally costs based on suggestions."""
    conn = get_connection()
    try:
        conn.execute("BEGIN TRANSACTION")
        for s in suggestions:
            if s.get("type") == "currency_sync":
                conn.execute(
                    "UPDATE products SET price = ?, cost_price = ?, updated_at = datetime('now') WHERE id = ?",
                    (s["suggested_price"], s["new_cost"], s["product_id"])
                )
            else:
                conn.execute(
                    "UPDATE products SET price = ?, updated_at = datetime('now') WHERE id = ?",
                    (s["suggested_price"], s["product_id"])
                )
        conn.execute("COMMIT")
        return True
    except Exception as e:
        conn.rollback()
        raise e
