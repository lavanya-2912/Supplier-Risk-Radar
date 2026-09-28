from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.supplier import Supplier
from app.models.delivery import Delivery
from app.models.alert import Alert
from app.schemas.delivery import DeliveryCreate, DeliveryResponse
from app.services.hindsight_service import hindsight_service
from app.services.risk_service import risk_service

router = APIRouter(prefix="/api/suppliers", tags=["Deliveries"])

@router.get("/{supplier_id}/deliveries", response_model=List[DeliveryResponse])
def get_deliveries(supplier_id: int, db: Session = Depends(get_db)):
    return db.query(Delivery).filter(Delivery.supplier_id == supplier_id).order_by(Delivery.created_at.desc()).all()

@router.post("/{supplier_id}/deliveries", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
async def create_delivery(supplier_id: int, delivery_in: DeliveryCreate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Calculate delay_days = Actual Date - Expected Date
    exp = delivery_in.expected_date.replace(tzinfo=None) if delivery_in.expected_date.tzinfo else delivery_in.expected_date
    act = delivery_in.actual_date.replace(tzinfo=None) if delivery_in.actual_date.tzinfo else delivery_in.actual_date
    
    delta = (act - exp).days
    delay_days = max(0, delta)

    severity = delivery_in.severity or ("Critical" if delay_days > 7 else ("High" if delay_days > 3 else ("Medium" if delay_days > 0 else "Low")))

    delivery = Delivery(
        supplier_id=supplier_id,
        purchase_order=delivery_in.purchase_order,
        expected_date=exp,
        actual_date=act,
        delay_days=delay_days,
        reason=delivery_in.reason or ("Logistics disruption" if delay_days > 0 else "On-time delivery"),
        severity=severity,
        notes=delivery_in.notes
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    # Store memory in Hindsight Cloud
    mem_text = f"Purchase Order: {delivery.purchase_order} | Expected: {exp.strftime('%Y-%m-%d')} | Actual: {act.strftime('%Y-%m-%d')} | Delay: {delay_days} days | Reason: {delivery.reason} | Severity: {severity}"
    await hindsight_service.retain(
        supplier_id=supplier.id,
        supplier_name=supplier.name,
        event_type="Delivery Delay" if delay_days > 0 else "Successful Delivery",
        content=mem_text,
        metadata={"delay_days": delay_days, "purchase_order": delivery.purchase_order, "severity": severity}
    )

    # Trigger alert if critical delay
    if delay_days > 3:
        alert = Alert(
            supplier_id=supplier.id,
            type="Delivery Drop",
            severity="High" if delay_days <= 7 else "Critical",
            message=f"Delivery delay of {delay_days} days detected on Purchase Order {delivery.purchase_order}. Reason: {delivery.reason}.",
            status="Active"
        )
        db.add(alert)
        db.commit()

    # Recalculate supplier risk
    await risk_service.calculate_supplier_risk(db, supplier.id)

    return delivery
