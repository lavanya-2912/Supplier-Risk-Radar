from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from app.database import Base

class SystemSetting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    risk_threshold_high = Column(Float, default=50.0)
    risk_threshold_critical = Column(Float, default=75.0)
    price_creep_normal = Column(Float, default=3.0)
    price_creep_moderate = Column(Float, default=7.0)
    price_creep_significant = Column(Float, default=15.0)
    prediction_horizon_days = Column(Integer, default=30)
    currency = Column(String, default="USD")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
