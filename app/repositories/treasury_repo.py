import sqlite3
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from app.database.connection import get_db_connection
from app.models.treasury import TreasuryForecastCreate, BankStatementImportCreate, CashFlowPoint

logger = logging.getLogger(__name__)

def get_cash_flow_projection(days: int = 30) -> List[CashFlowPoint]:
    """
    Simulates a 30-day cash flow projection by looking at:
    - Subscriptions (Inflow)
    - Payable Checks (Outflow)
    - Receivable Checks (Inflow)
    - Planned Treasury Forecasts (Manual adjustments)
    """
    start_date = datetime.now().date()
    projection = []
    
    with get_db_connection() as conn:
        for i in range(days):
            current_day = start_date + timedelta(days=i)
            day_str = current_day.isoformat()
            
            inflow = 0
            outflow = 0
            
            # 1. Subscriptions due today
            sub_inflow = conn.execute(
                "SELECT SUM(p.price) FROM subscriptions s JOIN subscription_plans p ON s.plan_id = p.id WHERE s.status = 'active' AND date(s.next_invoice_date) = ?",
                (day_str,)
            ).fetchone()[0] or 0
            inflow += sub_inflow
            
            # 2. Receivable Checks due today
            check_inflow = conn.execute(
                "SELECT SUM(amount) FROM cheques WHERE type = 'receivable' AND status = 'pending' AND date(due_date) = ?",
                (day_str,)
            ).fetchone()[0] or 0
            inflow += check_inflow
            
            # 3. Payable Checks due today
            check_outflow = conn.execute(
                "SELECT SUM(amount) FROM cheques WHERE type = 'payable' AND status = 'pending' AND date(due_date) = ?",
                (day_str,)
            ).fetchone()[0] or 0
            outflow += check_outflow
            
            # 4. Manual adjustments
            manual = conn.execute(
                "SELECT SUM(estimated_inflow), SUM(estimated_outflow) FROM treasury_forecasts WHERE date(forecast_date) = ?",
                (day_str,)
            ).fetchone()
            inflow += (manual[0] or 0)
            outflow += (manual[1] or 0)
            
            net = inflow - outflow
            prev_cumulative = projection[-1].cumulative_net if projection else 0
            
            projection.append(CashFlowPoint(
                date=day_str,
                inflow=round(inflow, 2),
                outflow=round(outflow, 2),
                net=round(net, 2),
                cumulative_net=round(prev_cumulative + net, 2)
            ))
            
    return projection

def create_manual_forecast(forecast: TreasuryForecastCreate) -> int:
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO treasury_forecasts (forecast_date, estimated_inflow, estimated_outflow, notes) VALUES (?, ?, ?, ?)",
            (forecast.forecast_date, forecast.estimated_inflow, forecast.estimated_outflow, forecast.notes)
        )
        return cursor.lastrowid

def log_bank_import(data: BankStatementImportCreate) -> int:
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO bank_statement_imports (account_id, filename, import_date, status) VALUES (?, ?, ?, 'processed')",
            (data.account_id, data.filename, datetime.now().isoformat())
        )
        return cursor.lastrowid
