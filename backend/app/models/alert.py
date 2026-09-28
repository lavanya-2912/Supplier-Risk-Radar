from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # Risk Spike, Delivery Drop, Quality Defect, Price Creep, News Signal
    severity = Column(String, default="High") # Low, Medium, High, Critical
    message = Column(Text, nullable=False)
    status = Column(String, default="Active") # Active, Reviewed, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="alerts")
