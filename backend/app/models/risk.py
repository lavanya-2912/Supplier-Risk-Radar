from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False) # 0 to 100
    risk_level = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    delivery_score = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    price_score = Column(Float, default=0.0)
    historical_score = Column(Float, default=0.0)
    news_score = Column(Float, default=0.0)
    explanation = Column(Text, nullable=True)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="risk_scores")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    disruption_probability = Column(Float, nullable=False) # 0.0 to 1.0 or %
    confidence = Column(Float, nullable=False) # 0.0 to 1.0 or %
    prediction_horizon = Column(String, default="30 days")
    model_type = Column(String, default="Random Forest") # ML vs Rule-Based
    explanation = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True) # JSON or bullet points
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="predictions")
