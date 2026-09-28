from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.price import PriceHistory
from app.models.alert import Alert
from app.schemas.price import PriceHistoryCreate, PriceHistoryResponse
from app.services.hindsight_service import hindsight_service
from app.services.risk_service import risk_service

router = APIRouter(prefix="/api/suppliers", tags=["Price Creep"])

@router.get("/{supplier_id}/prices", response_model=List[PriceHistoryResponse])
def get_price_history(supplier_id: int, db: Session = Depends(get_db)):
    return db.query(PriceHistory).filter(PriceHistory.supplier_id == supplier_id).order_by(PriceHistory.effective_date.desc()).all()

@router.post("/{supplier_id}/prices", response_model=PriceHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_price_record(supplier_id: int, price_in: PriceHistoryCreate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    pct = ((price_in.new_price - price_in.previous_price) / price_in.previous_price * 100.0) if price_in.previous_price > 0 else 0.0

    ph = PriceHistory(
        supplier_id=supplier_id,
        product_id=price_in.product_id,
        previous_price=price_in.previous_price,
        new_price=price_in.new_price,
        change_percentage=round(pct, 2),
        effective_date=price_in.effective_date or datetime.utcnow(),
        reason=price_in.reason or "Contract price update"
    )
    db.add(ph)

    # Update product current_price if product_id is specified
    if price_in.product_id:
        prod = db.query(Product).filter(Product.id == price_in.product_id).first()
        if prod:
            prod.current_price = price_in.new_price

    db.commit()
    db.refresh(ph)

    # Hindsight Memory Retain
    mem_text = f"Price Adjustment | Previous Price: ${price_in.previous_price:.2f} | New Price: ${price_in.new_price:.2f} | Increase: {pct:.1f}% | Reason: {ph.reason}"
    await hindsight_service.retain(
        supplier_id=supplier.id,
        supplier_name=supplier.name,
        event_type="Price Change",
        content=mem_text,
        metadata={"price_increase_pct": pct, "previous_price": price_in.previous_price, "new_price": price_in.new_price}
    )

    # Alert generation for significant price creep
    if pct > 7.0:
        alert = Alert(
            supplier_id=supplier.id,
            type="Price Creep",
            severity="Critical" if pct > 15.0 else "High",
            message=f"Price increase of +{pct:.1f}% recorded for {supplier.name} (${price_in.previous_price} -> ${price_in.new_price}).",
            status="Active"
        )
        db.add(alert)
        db.commit()

    # Recalculate risk score
    await risk_service.calculate_supplier_risk(db, supplier.id)

    return ph
