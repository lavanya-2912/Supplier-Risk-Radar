from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    current_price = Column(Float, nullable=False)

    supplier = relationship("Supplier", back_populates="products")
    quality_incidents = relationship("QualityIncident", back_populates="product")
    price_histories = relationship("PriceHistory", back_populates="product")
