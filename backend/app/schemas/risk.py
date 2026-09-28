from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class RiskBreakdownComponent(BaseModel):
    name: str
    weight_pct: float
    score: float
    contribution_pct: float
    description: str

class RiskCalculationResponse(BaseModel):
    supplier_id: int
    score: float
    risk_level: str # LOW, MEDIUM, HIGH, CRITICAL
    delivery_score: float
    quality_score: float
    price_score: float
    historical_score: float
    news_score: float
    explanation: str
    components: List[RiskBreakdownComponent]
    positive_signals: List[str]
    negative_signals: List[str]
    calculated_at: datetime

class PredictionResponse(BaseModel):
    model_config = {'protected_namespaces': ()}
    
    supplier_id: int
    disruption_probability: float # e.g. 72.0 (%)
    confidence: float # e.g. 84.0 (%)
    risk_level: str
    prediction_horizon: str # e.g. "30 days"
    model_type: str # "Random Forest / Gradient Boosting" or "Explainable Rule-Based Risk Engine"
    explanation: str
    evidence: List[str]
    limitations: str
    created_at: datetime

class WhatIfRequest(BaseModel):
    supplier_id: int
    additional_delay_days: Optional[int] = 0
    defect_rate_change_pct: Optional[float] = 0.0
    price_increase_pct: Optional[float] = 0.0
    news_risk_level: Optional[str] = "Neutral" # Low, Medium, High, Critical

class WhatIfResponse(BaseModel):
    supplier_id: int
    current_score: float
    current_risk_level: str
    projected_score: float
    projected_risk_level: str
    delta: float
    explanation: str
