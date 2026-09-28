from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NewsArticleCreate(BaseModel):
    supplier_id: int
    title: str
    source: Optional[str] = "Global Trade Watch"
    url: Optional[str] = None
    category: Optional[str] = "Logistics disruption"
    sentiment: Optional[str] = "Risk"
    risk_score: Optional[float] = 50.0
    summary: Optional[str] = None
    published_at: Optional[datetime] = None

class NewsArticleResponse(BaseModel):
    id: int
    supplier_id: int
    title: str
    source: Optional[str]
    url: Optional[str]
    published_at: datetime
    category: str
    sentiment: str
    risk_score: float
    summary: Optional[str]

    class Config:
        from_attributes = True

class NewsSyncRequest(BaseModel):
    supplier_id: Optional[int] = None
