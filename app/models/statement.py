from pydantic import BaseModel
from typing import List, Optional

class StatementEntry(BaseModel):
    date: str
    type: str # 'invoice', 'return', 'voucher', 'opening_balance'
    reference_id: int
    description: str
    debit: float
    credit: float
    balance: float # Running balance

class StatementOfAccountOut(BaseModel):
    entity_id: int
    entity_name: str
    entity_type: str # 'customer', 'supplier'
    entries: List[StatementEntry]
    total_debit: float
    total_credit: float
    final_balance: float
