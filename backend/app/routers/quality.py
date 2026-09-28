from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.supplier import Supplier
from app.models.quality import QualityIncident
from app.models.alert import Alert
from app.schemas.quality import QualityIncidentCreate, QualityIncidentResponse
from app.services.hindsight_service import hindsight_service
from app.services.risk_service import risk_service

router = APIRouter(prefix="/api/suppliers", tags=["Quality"])

@router.get("/{supplier_id}/quality", response_model=List[QualityIncidentResponse])
def get_quality_incidents(supplier_id: int, db: Session = Depends(get_db)):
    return db.query(QualityIncident).filter(QualityIncident.supplier_id == supplier_id).order_by(QualityIncident.date.desc()).all()

@router.post("/{supplier_id}/quality", response_model=QualityIncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_quality_incident(supplier_id: int, quality_in: QualityIncidentCreate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    defect_rate = (quality_in.defect_quantity / quality_in.total_quantity * 100.0) if quality_in.total_quantity > 0 else 0.0

    incident = QualityIncident(
        supplier_id=supplier_id,
        product_id=quality_in.product_id,
        defect_type=quality_in.defect_type,
        defect_quantity=quality_in.defect_quantity,
        total_quantity=quality_in.total_quantity,
        defect_rate=round(defect_rate, 2),
        severity=quality_in.severity or ("High" if defect_rate > 5.0 else "Medium"),
        inspection_result=quality_in.inspection_result or "Failed",
        date=quality_in.date or datetime.utcnow(),
        notes=quality_in.notes
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Store memory in Hindsight Cloud
    mem_text = f"Quality Incident | Defect Type: {incident.defect_type} | Defect Qty: {incident.defect_quantity}/{incident.total_quantity} ({defect_rate:.2f}%) | Severity: {incident.severity} | Result: {incident.inspection_result}"
    await hindsight_service.retain(
        supplier_id=supplier.id,
        supplier_name=supplier.name,
        event_type="Quality Incident",
        content=mem_text,
        metadata={"defect_rate": defect_rate, "defect_type": incident.defect_type, "severity": incident.severity}
    )

    # Alert generation
    if defect_rate > 3.0 or incident.severity in ["High", "Critical"]:
        alert = Alert(
            supplier_id=supplier.id,
            type="Quality Defect",
            severity="Critical" if defect_rate > 7.0 else "High",
            message=f"Quality defect rate spike of {defect_rate:.1f}% reported for {supplier.name} ({incident.defect_type}).",
            status="Active"
        )
        db.add(alert)
        db.commit()

    # Recalculate supplier risk
    await risk_service.calculate_supplier_risk(db, supplier.id)

    return incident
