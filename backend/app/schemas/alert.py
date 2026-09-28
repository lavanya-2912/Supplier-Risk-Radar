from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    supplier_id: int
    supplier_name: Optional[str] = None
    type: str
    severity: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: str
