from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String, unique=True, index=True, nullable=True) # e.g. SUP-001
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    country = Column(String, nullable=False, index=True)
    city = Column(String, nullable=False)
    address = Column(String, nullable=True)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, default="Active") # Active, Under Review, High Risk, Suspended
    contract_value = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    lead_time = Column(Integer, default=14) # in days
    capacity = Column(String, default="Medium") # Low, Medium, High
    payment_terms = Column(String, default="Net 30")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products = relationship("Product", back_populates="supplier", cascade="all, delete-orphan")
    deliveries = relationship("Delivery", back_populates="supplier", cascade="all, delete-orphan")
    quality_incidents = relationship("QualityIncident", back_populates="supplier", cascade="all, delete-orphan")
    price_histories = relationship("PriceHistory", back_populates="supplier", cascade="all, delete-orphan")
    news_articles = relationship("NewsArticle", back_populates="supplier", cascade="all, delete-orphan")
    risk_scores = relationship("RiskScore", back_populates="supplier", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="supplier", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="supplier", cascade="all, delete-orphan")
