from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PriceHistoryCreate(BaseModel):
    supplier_id: int
    product_id: Optional[int] = None
    previous_price: float
    new_price: float
    reason: Optional[str] = "Market adjustment"
    effective_date: Optional[datetime] = None

class PriceHistoryResponse(BaseModel):
    id: int
    supplier_id: int
    product_id: Optional[int]
    previous_price: float
    new_price: float
    change_percentage: float
    effective_date: datetime
    reason: Optional[str]

    class Config:
        from_attributes = True
