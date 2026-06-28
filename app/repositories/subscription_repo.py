import sqlite3
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from app.database.connection import get_db_connection
from app.models.subscription import SubscriptionPlanCreate, SubscriptionPlanUpdate, SubscriptionCreate, SubscriptionUpdate

logger = logging.getLogger(__name__)

def _add_months(sourcedate, months):
    import calendar
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return datetime(year, month, day)

def create_plan(plan: SubscriptionPlanCreate) -> int:
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO subscription_plans (name, price, interval_months, is_active) VALUES (?, ?, ?, ?)",
            (plan.name, plan.price, plan.interval_months, 1 if plan.is_active else 0)
        )
        return cursor.lastrowid

def get_plans() -> List[dict]:
    with get_db_connection() as conn:
        rows = conn.execute("SELECT * FROM subscription_plans WHERE is_active = 1").fetchall()
        return [dict(r) for r in rows]

def create_subscription(sub: SubscriptionCreate) -> int:
    with get_db_connection() as conn:
        # Get plan interval
        plan = conn.execute("SELECT interval_months FROM subscription_plans WHERE id = ?", (sub.plan_id,)).fetchone()
        if not plan:
            raise ValueError("Plan not found")
        
        start_dt = datetime.fromisoformat(sub.start_date) if sub.start_date else datetime.now()
        next_dt = _add_months(start_dt, plan["interval_months"])
        
        cursor = conn.execute(
            """INSERT INTO subscriptions (customer_id, plan_id, start_date, next_invoice_date, status, notes) 
               VALUES (?, ?, ?, ?, 'active', ?)""",
            (sub.customer_id, sub.plan_id, start_dt.isoformat(), next_dt.isoformat(), sub.notes)
        )
        return cursor.lastrowid

def get_active_subscriptions() -> List[dict]:
    with get_db_connection() as conn:
        rows = conn.execute("""
            SELECT s.*, c.name as customer_name, p.name as plan_name, p.price 
            FROM subscriptions s
            JOIN customers c ON s.customer_id = c.id
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
        """).fetchall()
        return [dict(r) for r in rows]

def process_recurring_billing():
    """
    Finds subscriptions due for billing and generates invoices.
    In a real app, this would be a CRON job.
    """
    today = datetime.now().isoformat()
    with get_db_connection() as conn:
        due = conn.execute("""
            SELECT s.*, p.price, p.interval_months 
            FROM subscriptions s 
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.status = 'active' AND s.next_invoice_date <= ?
        """, (today,)).fetchall()
        
        for sub in due:
            # 1. Generate Invoice (calling invoice_repo logic would be better)
            # For now, we update the next_invoice_date
            current_next = datetime.fromisoformat(sub["next_invoice_date"])
            new_next = _add_months(current_next, sub["interval_months"])
            
            conn.execute(
                "UPDATE subscriptions SET next_invoice_date = ? WHERE id = ?",
                (new_next.isoformat(), sub["id"])
            )
            logger.info(f"Billed subscription {sub['id']} for customer {sub['customer_id']}. Next date: {new_next}")
        
        conn.commit()

def update_subscription(sub_id: int, update: SubscriptionUpdate):
    with get_db_connection() as conn:
        fields = []
        params = []
        if update.status is not None:
            fields.append("status = ?")
            params.append(update.status)
        if update.notes is not None:
            fields.append("notes = ?")
            params.append(update.notes)
        if update.next_invoice_date is not None:
            fields.append("next_invoice_date = ?")
            params.append(update.next_invoice_date)
            
        if not fields:
            return
            
        params.append(sub_id)
        conn.execute(f"UPDATE subscriptions SET {', '.join(fields)} WHERE id = ?", params)
