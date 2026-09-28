from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.alert import Alert
from app.models.supplier import Supplier
from app.schemas.alert import AlertResponse, AlertUpdate

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if status_filter and status_filter != "All":
        query = query.filter(Alert.status == status_filter)

    alerts = query.order_by(Alert.created_at.desc()).all()
    results = []
    for a in alerts:
        sup = db.query(Supplier).filter(Supplier.id == a.supplier_id).first()
        results.append({
            "id": a.id,
            "supplier_id": a.supplier_id,
            "supplier_name": sup.name if sup else f"Supplier #{a.supplier_id}",
            "type": a.type,
            "severity": a.severity,
            "message": a.message,
            "status": a.status,
            "created_at": a.created_at
        })
    return results

@router.put("/{alert_id}", response_model=AlertResponse)
def update_alert(alert_id: int, alert_in: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = alert_in.status
    db.commit()
    db.refresh(alert)

    sup = db.query(Supplier).filter(Supplier.id == alert.supplier_id).first()
    return {
        "id": alert.id,
        "supplier_id": alert.supplier_id,
        "supplier_name": sup.name if sup else f"Supplier #{alert.supplier_id}",
        "type": alert.type,
        "severity": alert.severity,
        "message": alert.message,
        "status": alert.status,
        "created_at": alert.created_at
    }
