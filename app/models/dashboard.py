"""Dashboard schemas."""
from pydantic import BaseModel
from typing import List, Dict, Any


class DashboardKPIs(BaseModel):
    today_sales: float = 0.0
    today_invoices: int = 0
    today_returns: float = 0.0
    today_net: float = 0.0
    low_stock_count: int = 0
    active_products: int = 0
    active_customers: int = 0
