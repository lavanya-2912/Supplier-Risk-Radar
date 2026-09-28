from pydantic import BaseModel
from typing import Optional, List

class ReportGenerateRequest(BaseModel):
    supplier_ids: Optional[List[int]] = None
    format: str = "pdf" # "pdf" or "csv"
    include_hindsight_memory: bool = True
    include_news: bool = True
    include_recommendations: bool = True
