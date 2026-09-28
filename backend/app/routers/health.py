from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
from app.services.hindsight_service import hindsight_service
from app.services.news_service import news_service
from app.ml.model import ml_model

router = APIRouter(prefix="/api/integrations", tags=["Integration Health"])

@router.get("/health")
async def get_integration_health(db: Session = Depends(get_db)):
    # 1. DB Health
    db_status = "CONNECTED"
    db_type = "PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"DEGRADED ({str(e)})"

    # 2. Hindsight Health
    hindsight_health = await hindsight_service.check_health()

    # 3. News API Health
    news_status = "CONNECTED" if news_service.is_configured() else "FALLBACK MODE (Stored News Signals)"

    # 4. Risk Engine
    risk_engine_status = "READY"

    # 5. ML Model
    ml_status = "READY (Random Forest Trained)" if ml_model.is_trained else "INITIALIZING"

    return {
        "status": "HEALTHY",
        "database": {
            "status": db_status,
            "type": db_type,
            "url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "local"
        },
        "hindsight": {
            "status": hindsight_health["status"],
            "connected": hindsight_health["connected"],
            "bank_id": settings.HINDSIGHT_BANK_ID,
            "message": hindsight_health["message"]
        },
        "news_api": {
            "status": news_status,
            "configured": news_service.is_configured()
        },
        "risk_engine": {
            "status": risk_engine_status,
            "weights": {"delivery": 0.30, "quality": 0.25, "price": 0.15, "historical": 0.15, "news": 0.15}
        },
        "ml_model": {
            "status": ml_status,
            "type": "Scikit-Learn Random Forest Classifier"
        }
    }
