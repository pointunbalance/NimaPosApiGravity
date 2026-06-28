"""Reports schemas."""
from pydantic import BaseModel
from typing import List, Optional, Any, Dict


class SalesSummary(BaseModel):
    invoices_count: int = 0
    gross_sales: float = 0.0
    subtotal_sum: float = 0.0
    tax_sum: float = 0.0
    returns_amount: float = 0.0
    net_sales: float = 0.0
    avg_ticket: float = 0.0
    daily_breakdown: List[Dict[str, Any]] = []


class TopProduct(BaseModel):
    product_id: int
    sku: str
    name: str
    qty_sold: int
    gross_sales: float


class SalesHistoryItem(BaseModel):
    invoice_id: int
    created_at: str
    customer_name: Optional[str] = None
    net_total: float
    payment_method: str
    is_void: bool = False
    items_count: int = 0
