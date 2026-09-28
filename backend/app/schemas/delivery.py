from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DeliveryCreate(BaseModel):
    supplier_id: int
    purchase_order: str
    expected_date: datetime
    actual_date: datetime
    reason: Optional[str] = "Normal delivery"
    severity: Optional[str] = "Low"
    notes: Optional[str] = None

class DeliveryResponse(BaseModel):
    id: int
    supplier_id: int
    purchase_order: str
    expected_date: datetime
    actual_date: datetime
    delay_days: int
    reason: Optional[str]
    severity: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
