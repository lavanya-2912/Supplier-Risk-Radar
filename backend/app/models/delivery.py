from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    purchase_order = Column(String, nullable=False)
    expected_date = Column(DateTime, nullable=False)
    actual_date = Column(DateTime, nullable=False)
    delay_days = Column(Integer, default=0)
    reason = Column(String, nullable=True)
    severity = Column(String, default="Low") # Low, Medium, High, Critical
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="deliveries")
