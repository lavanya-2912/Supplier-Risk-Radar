from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.schemas.risk import PredictionResponse
from app.ml.prediction_service import prediction_service
from app.models.supplier import Supplier
from app.models.news import NewsArticle
from app.services.groq_service import groq_service

router = APIRouter(tags=["Predictions"])

@router.post("/api/suppliers/{supplier_id}/prediction", response_model=PredictionResponse)
async def predict_supplier_disruption(supplier_id: int, db: Session = Depends(get_db)):
    res = await prediction_service.predict_disruption(db, supplier_id)
    return res

@router.get("/api/suppliers/{supplier_id}/prediction", response_model=PredictionResponse)
async def get_latest_prediction(supplier_id: int, db: Session = Depends(get_db)):
    res = await prediction_service.predict_disruption(db, supplier_id)
    return res

@router.get("/api/disruptions")
async def get_all_disruptions(db: Session = Depends(get_db)):
    """GET /api/disruptions: Returns AI-synthesized disruption predictions across all suppliers."""
    suppliers = db.query(Supplier).all()
    results = []

    for s in suppliers:
        pred = await prediction_service.predict_disruption(db, s.id)
        latest_news = db.query(NewsArticle).filter(NewsArticle.supplier_id == s.id).order_by(NewsArticle.published_at.desc()).first()

        headline = latest_news.title if latest_news else f"Logistics & operational status for {s.name}"
        summary = latest_news.summary if (latest_news and latest_news.summary) else f"Supplier {s.name} operating in {s.country} with {pred['disruption_probability']}% disruption probability."

        groq_news_analysis = groq_service.analyze_news_sentiment(headline, summary)

        results.append({
            "supplier_id": s.id,
            "supplier": {
                "id": s.id,
                "name": s.name,
                "supplier_code": s.supplier_code or f"SUP-{s.id:03d}",
                "category": s.category,
                "country": s.country
            },
            "disruption_probability": pred["disruption_probability"],
            "confidence": pred["confidence"],
            "risk_level": pred["risk_level"],
            "prediction_horizon": pred["prediction_horizon"],
            "model_type": pred["model_type"],
            "explanation": pred["explanation"],
            "evidence": pred["evidence"],
            "ai_synthesis": groq_news_analysis.get("ai_analysis", pred["explanation"]),
            "disruption_category": groq_news_analysis.get("category", "Logistics disruption"),
            "sentiment": groq_news_analysis.get("sentiment", "Risk"),
            "severity_weight": groq_news_analysis.get("severity_weight", "High"),
            "created_at": pred["created_at"]
        })

    results.sort(key=lambda x: x["disruption_probability"], reverse=True)
    return results
