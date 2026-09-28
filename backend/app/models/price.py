from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    previous_price = Column(Float, nullable=False)
    new_price = Column(Float, nullable=False)
    change_percentage = Column(Float, nullable=False)
    effective_date = Column(DateTime, default=datetime.utcnow)
    reason = Column(String, nullable=True)

    supplier = relationship("Supplier", back_populates="price_histories")
    product = relationship("Product", back_populates="price_histories")
