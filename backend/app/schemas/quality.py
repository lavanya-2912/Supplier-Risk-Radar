from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class QualityIncidentCreate(BaseModel):
    supplier_id: int
    product_id: Optional[int] = None
    defect_type: str
    defect_quantity: int
    total_quantity: int
    severity: Optional[str] = "Low"
    inspection_result: Optional[str] = "Failed"
    date: Optional[datetime] = None
    notes: Optional[str] = None

class QualityIncidentResponse(BaseModel):
    id: int
    supplier_id: int
    product_id: Optional[int]
    defect_type: str
    defect_quantity: int
    total_quantity: int
    defect_rate: float
    severity: str
    inspection_result: str
    date: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True
