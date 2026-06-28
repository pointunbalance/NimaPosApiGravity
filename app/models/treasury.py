from pydantic import BaseModel
from typing import Optional, List

class TreasuryForecastCreate(BaseModel):
    forecast_date: str
    estimated_inflow: float = 0
    estimated_outflow: float = 0
    notes: Optional[str] = ""

class BankStatementImportCreate(BaseModel):
    account_id: int
    filename: str

class CashFlowPoint(BaseModel):
    date: str
    inflow: float
    outflow: float
    net: float
    cumulative_net: float
