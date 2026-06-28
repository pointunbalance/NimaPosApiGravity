"""Economic Intelligence & Risk Advisory repository."""
import json
from datetime import datetime
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def get_market_signals():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM market_signals").fetchall()
    return rows_to_list(rows)

def update_signal(signal_type: str, current_value: float):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT current_value FROM market_signals WHERE signal_type = ?", (signal_type,)).fetchone()
        if existing:
            prev_value = existing["current_value"]
            trend = "UP" if current_value > prev_value else "DOWN" if current_value < prev_value else "STABLE"
            conn.execute(
                "UPDATE market_signals SET current_value = ?, previous_value = ?, trend = ?, last_updated = ? WHERE signal_type = ?",
                (current_value, prev_value, trend, now_str(), signal_type)
            )
        else:
            conn.execute(
                "INSERT INTO market_signals (signal_type, current_value, trend, last_updated) VALUES (?, ?, 'STABLE', ?)",
                (signal_type, current_value, now_str())
            )
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e

def create_global_event(data: dict):
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO global_events (event_name, severity_score, affected_categories_json, is_active, created_at) VALUES (?, ?, ?, ?, ?)",
            (data["event_name"], data.get("severity_score", 5.0), json.dumps(data.get("affected_categories", [])), 1, now_str())
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e

def get_active_events():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM global_events WHERE is_active = 1").fetchall()
    return rows_to_list(rows)

def calculate_risk_forecast():
    """Predictive pricing engine based on market signals and global risks."""
    conn = get_connection()
    
    # 1. Load context
    signals = {s["signal_type"]: s for s in get_market_signals()}
    active_events = get_active_events()
    
    # 2. Get products with risk factors
    sql = """
        SELECT p.id, p.sku, p.name, p.price, p.cost_price, p.category,
               rf.signal_type, rf.sensitivity_weight
        FROM products p
        JOIN product_risk_factors rf ON p.id = rf.product_id
        WHERE p.is_active = 1
    """
    rows = conn.execute(sql).fetchall()
    products_with_risk = rows_to_list(rows)
    
    suggestions = []
    
    for p in products_with_risk:
        signal = signals.get(p["signal_type"])
        if not signal or not signal["previous_value"]:
            continue
            
        # Signal change percentage
        signal_change_pct = ((signal["current_value"] - signal["previous_value"]) / signal["previous_value"]) * 100
        
        # Proactive adjustment (Hedging)
        # Prediction: Suggest a hike proportional to signal surge * sensitivity
        proactive_adjustment = signal_change_pct * p["sensitivity_weight"]
        
        # Only suggest if the predictive hike is positive and significant (e.g. > 1%)
        if proactive_adjustment > 1.0:
            suggested_price = round(p["price"] * (1 + (proactive_adjustment / 100.0)), 2)
            
            # Additional Event-Driven Surcharge
            for event in active_events:
                affected_cats = json.loads(event["affected_categories_json"])
                if p["category"] in affected_cats:
                    # Severity-based surcharge (e.g. score 10 = +5%)
                    surcharge = (event["severity_score"] / 2.0)
                    suggested_price = round(suggested_price * (1 + (surcharge / 100.0)), 2)
            
            suggestions.append({
                "product_id": p["id"],
                "sku": p["sku"],
                "name": p["name"],
                "trigger_signal": p["signal_type"],
                "signal_change": round(signal_change_pct, 2),
                "current_price": p["price"],
                "suggested_price": suggested_price,
                "diff_percentage": round(((suggested_price - p["price"]) / p["price"] * 100), 2) if p["price"] > 0 else 0,
                "reason": f"Market Surge: {p['signal_type']} trend is {signal['trend']}"
            })
            
    return suggestions
