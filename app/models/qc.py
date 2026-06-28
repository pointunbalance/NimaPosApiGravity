"""Quality Control schemas."""
from pydantic import BaseModel
from typing import Optional, List

class QCDefectBase(BaseModel):
    defect_type: str
    quantity: float = 0
    description: Optional[str] = ""

class QCInspectionCreate(BaseModel):
    purchase_id: Optional[int] = None
    product_id: int
    batch_id: Optional[int] = None
    inspector_id: Optional[int] = None
    inspection_date: Optional[str] = None
    status: str # Passed, Failed, Partial
    score: float = 0
    notes: Optional[str] = ""
    defects: List[QCDefectBase] = []

class QCRuleCreate(BaseModel):
    category_id: Optional[int] = None
    product_id: Optional[int] = None
    min_score_required: float = 70.0
    is_mandatory: bool = True
