from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductSchema(BaseModel):
    id: Optional[int] = None
    name: str
    category: str
    current_price: float

    class Config:
        from_attributes = True

class SupplierBase(BaseModel):
    name: str
    category: str
    country: str
    city: str
    address: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = "Active"
    contract_value: float = 0.0
    currency: Optional[str] = "USD"
    lead_time: int = 14
    capacity: Optional[str] = "Medium"
    payment_terms: Optional[str] = "Net 30"

class SupplierCreate(SupplierBase):
    supplier_code: Optional[str] = None
    initial_product_name: Optional[str] = None
    initial_product_category: Optional[str] = None
    initial_product_price: Optional[float] = None
    previous_price: Optional[float] = None

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    contract_value: Optional[float] = None
    currency: Optional[str] = None
    lead_time: Optional[int] = None
    capacity: Optional[str] = None
    payment_terms: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int
    supplier_code: str
    created_at: datetime
    updated_at: datetime
    current_risk_score: Optional[float] = 0.0
    current_risk_level: Optional[str] = "LOW"
    on_time_delivery_pct: Optional[float] = 100.0
    defect_rate_pct: Optional[float] = 0.0
    recent_price_change_pct: Optional[float] = 0.0
    products: List[ProductSchema] = []

    class Config:
        from_attributes = True
