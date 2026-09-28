from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.setting import SystemSetting
from app.config import settings as app_settings
from app.services.hindsight_service import hindsight_service

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    risk_threshold_high: Optional[float] = 50.0
    risk_threshold_critical: Optional[float] = 75.0
    price_creep_normal: Optional[float] = 3.0
    price_creep_moderate: Optional[float] = 7.0
    price_creep_significant: Optional[float] = 15.0
    prediction_horizon_days: Optional[int] = 30
    currency: Optional[str] = "USD"

@router.get("")
def get_system_settings(db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).first()
    if not setting:
        setting = SystemSetting()
        db.add(setting)
        db.commit()
        db.refresh(setting)

    return {
        "id": setting.id,
        "risk_threshold_high": setting.risk_threshold_high,
        "risk_threshold_critical": setting.risk_threshold_critical,
        "price_creep_normal": setting.price_creep_normal,
        "price_creep_moderate": setting.price_creep_moderate,
        "price_creep_significant": setting.price_creep_significant,
        "prediction_horizon_days": setting.prediction_horizon_days,
        "currency": setting.currency,
        "hindsight": {
            "api_url": app_settings.HINDSIGHT_API_URL,
            "bank_id": app_settings.HINDSIGHT_BANK_ID,
            "api_key_configured": bool(app_settings.HINDSIGHT_API_KEY and len(app_settings.HINDSIGHT_API_KEY.strip()) > 5)
        },
        "news_api": {
            "key_configured": bool(app_settings.NEWS_API_KEY and len(app_settings.NEWS_API_KEY.strip()) > 5)
        }
    }

@router.put("")
def update_system_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).first()
    if not setting:
        setting = SystemSetting()
        db.add(setting)

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(setting, field, val)

    db.commit()
    db.refresh(setting)
    return setting

@router.post("/test-hindsight")
async def test_hindsight_connection():
    res = await hindsight_service.check_health()
    return res
