from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    source = Column(String, nullable=True)
    url = Column(String, nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow)
    category = Column(String, default="Logistics disruption") # Factory shutdown, Strike, Natural disaster, Financial distress, Cyber incident, Regulatory issue, Logistics disruption, Product recall, Geopolitical issue, Port disruption
    sentiment = Column(String, default="Risk") # Positive, Neutral, Risk, Critical
    risk_score = Column(Float, default=50.0) # 0 to 100
    summary = Column(Text, nullable=True)

    supplier = relationship("Supplier", back_populates="news_articles")
