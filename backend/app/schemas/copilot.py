from pydantic import BaseModel
from typing import Optional, List

class CopilotQueryRequest(BaseModel):
    query: str
    supplier_id: Optional[int] = None

class CopilotQueryResponse(BaseModel):
    answer: str
    evidence: List[str]
    historical_context: List[str]
    current_signals: List[str]
    recommendation: Optional[str] = None
    confidence: float # percentage e.g. 85.0
