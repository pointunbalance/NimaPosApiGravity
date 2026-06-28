import sqlite3
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from app.database.connection import get_db_connection
from app.models.mrp import MRPPlanCreate, SafetyStockRuleCreate, SafetyStockRuleUpdate, DemandForecast

logger = logging.getLogger(__name__)

def create_safety_rule(rule: SafetyStockRuleCreate) -> int:
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT OR REPLACE INTO safety_stock_rules (product_id, min_qty, lead_time_days, auto_po) VALUES (?, ?, ?, ?)",
            (rule.product_id, rule.min_qty, rule.lead_time_days, 1 if rule.auto_po else 0)
        )
        return cursor.lastrowid

def get_safety_rules() -> List[dict]:
    with get_db_connection() as conn:
        rows = conn.execute("""
            SELECT r.*, p.name as product_name, p.stock_qty as current_stock
            FROM safety_stock_rules r
            JOIN products p ON r.product_id = p.id
        """).fetchall()
        return [dict(r) for r in rows]

def calculate_demand_forecast(days: int = 30) -> List[DemandForecast]:
    """
    Calculates average daily sales for all products and projects demand.
    """
    date_from = (datetime.now() - timedelta(days=days)).isoformat()
    with get_db_connection() as conn:
        # Calculate daily velocity
        velocity_sql = """
            SELECT p.id as product_id, p.name as product_name, p.stock_qty as current_stock,
                   SUM(ii.qty) as total_sold
            FROM products p
            LEFT JOIN invoice_items ii ON p.id = ii.product_id
            LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.is_void = 0 AND i.created_at >= ?
            GROUP BY p.id
        """
        rows = conn.execute(velocity_sql, (date_from,)).fetchall()
        
        forecasts = []
        for row in rows:
            total_sold = row["total_sold"] or 0
            daily_avg = total_sold / days
            # Project demand for next 30 days
            projected = daily_avg * 30
            shortage = max(0, projected - row["current_stock"])
            
            action = "Keep Stock"
            if shortage > 0:
                action = "Reorder Soon"
            if row["current_stock"] <= 0:
                action = "URGENT REORDER"
                
            forecasts.append(DemandForecast(
                product_id=row["product_id"],
                product_name=row["product_name"],
                current_stock=row["current_stock"],
                projected_demand=round(projected, 2),
                shortage=round(shortage, 2),
                recommended_action=action
            ))
        return forecasts

def get_reorder_suggestions() -> List[dict]:
    """
    Finds products where current_stock is below min_qty (Safety Stock).
    """
    with get_db_connection() as conn:
        rows = conn.execute("""
            SELECT p.id, p.name, p.sku, p.stock_qty, r.min_qty, r.lead_time_days
            FROM products p
            JOIN safety_stock_rules r ON p.id = r.product_id
            WHERE p.stock_qty <= r.min_qty
        """).fetchall()
        return [dict(r) for r in rows]

def create_mrp_plan(plan: MRPPlanCreate) -> int:
    with get_db_connection() as conn:
        cursor = conn.execute(
            """INSERT INTO mrp_plans (product_id, projected_demand, planned_production_qty, planned_purchase_qty, plan_date, status)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (plan.product_id, plan.projected_demand, plan.planned_production_qty, plan.planned_purchase_qty, plan.plan_date, plan.status)
        )
        return cursor.lastrowid
