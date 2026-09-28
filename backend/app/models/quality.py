from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class QualityIncident(Base):
    __tablename__ = "quality_incidents"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    defect_type = Column(String, nullable=False)
    defect_quantity = Column(Integer, nullable=False)
    total_quantity = Column(Integer, nullable=False)
    defect_rate = Column(Float, default=0.0)
    severity = Column(String, default="Low") # Low, Medium, High, Critical
    inspection_result = Column(String, default="Failed") # Passed, Conditional, Failed
    date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    supplier = relationship("Supplier", back_populates="quality_incidents")
    product = relationship("Product", back_populates="quality_incidents")
