from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.supplier import Supplier
from app.models.risk import RiskScore
from app.schemas.risk import RiskCalculationResponse, WhatIfRequest, WhatIfResponse
from app.services.risk_service import risk_service

router = APIRouter(prefix="/api/suppliers", tags=["Risk Radar"])

@router.get("/{supplier_id}/risk")
async def get_supplier_risk(supplier_id: int, db: Session = Depends(get_db)):
    res = await risk_service.calculate_supplier_risk(db, supplier_id)
    return res

@router.post("/{supplier_id}/risk/analyze", response_model=RiskCalculationResponse)
async def analyze_supplier_risk(supplier_id: int, db: Session = Depends(get_db)):
    res = await risk_service.calculate_supplier_risk(db, supplier_id)
    return res

@router.post("/{supplier_id}/ai-risk-assessment")
async def generate_ai_risk_assessment(supplier_id: int, db: Session = Depends(get_db)):
    """Generate or regenerate Groq LPU AI Executive Narrative and Disruption Breakdown."""
    res = await risk_service.calculate_supplier_risk(db, supplier_id)
    return res


@router.post("/{supplier_id}/what-if", response_model=WhatIfResponse)
async def simulate_what_if(supplier_id: int, payload: WhatIfRequest, db: Session = Depends(get_db)):
    current_risk = await risk_service.calculate_supplier_risk(db, supplier_id)
    
    sim = risk_service.run_what_if_simulation(
        current_score=current_risk["score"],
        current_level=current_risk["risk_level"],
        delay_days=payload.additional_delay_days or 0,
        defect_rate_change=payload.defect_rate_change_pct or 0.0,
        price_inc=payload.price_increase_pct or 0.0,
        news_risk=payload.news_risk_level or "Neutral"
    )

    return WhatIfResponse(
        supplier_id=supplier_id,
        current_score=sim["current_score"],
        current_risk_level=sim["current_risk_level"],
        projected_score=sim["projected_score"],
        projected_risk_level=sim["projected_risk_level"],
        delta=sim["delta"],
        explanation=sim["explanation"]
    )

@router.get("/risk/matrix/all")
def get_risk_matrix(db: Session = Depends(get_db)):
    """Returns interactive Risk Radar matrix data (Impact vs Probability vs Exposure)."""
    suppliers = db.query(Supplier).all()
    bubbles = []

    for s in suppliers:
        latest_risk = db.query(RiskScore).filter(RiskScore.supplier_id == s.id).order_by(RiskScore.calculated_at.desc()).first()
        score = latest_risk.score if latest_risk else 20.0
        
        # Business Impact mapped from contract value
        # Impact: 1 (Low) to 10 (High)
        if s.contract_value > 2500000:
            impact = 9.5
        elif s.contract_value > 1000000:
            impact = 7.5
        elif s.contract_value > 300000:
            impact = 5.0
        else:
            impact = 3.0

        # Disruption Probability derived from risk score
        prob = round(score * 0.9, 1)

        bubbles.append({
            "id": s.id,
            "name": s.name,
            "supplier_code": s.supplier_code or f"SUP-{s.id:03d}",
            "category": s.category,
            "country": s.country,
            "contract_value": s.contract_value,
            "risk_score": score,
            "risk_level": latest_risk.risk_level if latest_risk else "LOW",
            "probability": prob, # X-axis
            "business_impact": impact, # Y-axis
            "exposure": s.contract_value # Bubble size
        })

    return bubbles

@router.get("/risk/heatmap/all")
def get_risk_heatmap(db: Session = Depends(get_db)):
    """Returns matrix of Suppliers vs 6 Risk Vectors for Supply Chain Heatmap."""
    suppliers = db.query(Supplier).all()
    matrix = []

    for s in suppliers:
        deliveries = s.deliveries
        quality = s.quality_incidents
        prices = s.price_histories
        news = s.news_articles
        latest_risk = db.query(RiskScore).filter(RiskScore.supplier_id == s.id).order_by(RiskScore.calculated_at.desc()).first()

        del_risk, _, _ = risk_service.calculate_delivery_risk(deliveries)
        qual_risk, _, _ = risk_service.calculate_quality_risk(quality)
        price_risk, _, _ = risk_service.calculate_price_risk(prices)
        news_risk, _, _ = risk_service.calculate_news_risk(news)

        matrix.append({
            "supplier_id": s.id,
            "supplier_name": s.name,
            "category": s.category,
            "country": s.country,
            "overall_score": latest_risk.score if latest_risk else 20.0,
            "overall_level": latest_risk.risk_level if latest_risk else "LOW",
            "vectors": {
                "delivery": del_risk,
                "quality": qual_risk,
                "price": price_risk,
                "news": news_risk,
                "historical": latest_risk.historical_score if latest_risk else 15.0,
                "geographic": 75.0 if s.country in ["Taiwan", "Vietnam", "India"] else 30.0
            }
        })

    return matrix
