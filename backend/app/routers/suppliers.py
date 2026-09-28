from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.price import PriceHistory
from app.models.risk import RiskScore
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.services.hindsight_service import hindsight_service
from app.services.risk_service import risk_service
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

def format_supplier_response(db: Session, s: Supplier) -> dict:
    latest_risk = db.query(RiskScore).filter(RiskScore.supplier_id == s.id).order_by(RiskScore.calculated_at.desc()).first()
    
    # Calculate OTD %, Defect %, Price %
    total_del = len(s.deliveries)
    delayed = sum(1 for d in s.deliveries if d.delay_days > 0)
    otd_pct = ((total_del - delayed) / total_del * 100.0) if total_del > 0 else 100.0

    total_qty = sum(q.total_quantity for q in s.quality_incidents if q.total_quantity > 0)
    defect_qty = sum(q.defect_quantity for q in s.quality_incidents)
    defect_rate = (defect_qty / total_qty * 100.0) if total_qty > 0 else 0.0

    price_change = sum(p.change_percentage for p in s.price_histories) if s.price_histories else 0.0

    return {
        "id": s.id,
        "supplier_code": s.supplier_code or f"SUP-{s.id:03d}",
        "name": s.name,
        "category": s.category,
        "country": s.country,
        "city": s.city,
        "address": s.address,
        "contact_person": s.contact_person,
        "email": s.email,
        "phone": s.phone,
        "status": s.status,
        "contract_value": s.contract_value,
        "currency": s.currency,
        "lead_time": s.lead_time,
        "capacity": s.capacity,
        "payment_terms": s.payment_terms,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "current_risk_score": latest_risk.score if latest_risk else 15.0,
        "current_risk_level": latest_risk.risk_level if latest_risk else "LOW",
        "on_time_delivery_pct": round(otd_pct, 1),
        "defect_rate_pct": round(defect_rate, 2),
        "recent_price_change_pct": round(price_change, 1),
        "products": [
            {"id": p.id, "name": p.name, "category": p.category, "current_price": p.current_price}
            for p in s.products
        ]
    }

@router.get("", response_model=List[SupplierResponse])
def get_suppliers(
    search: Optional[str] = None,
    category: Optional[str] = None,
    country: Optional[str] = None,
    status_filter: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Supplier)

    if search:
        s_pattern = f"%{search}%"
        query = query.filter((Supplier.name.ilike(s_pattern)) | (Supplier.category.ilike(s_pattern)) | (Supplier.supplier_code.ilike(s_pattern)) | (Supplier.country.ilike(s_pattern)))
    if category and category != "All":
        query = query.filter(Supplier.category == category)
    if country and country != "All":
        query = query.filter(Supplier.country == country)
    if status_filter and status_filter != "All":
        query = query.filter(Supplier.status == status_filter)

    suppliers = query.order_by(Supplier.created_at.desc()).all()
    results = [format_supplier_response(db, s) for s in suppliers]

    if risk_level and risk_level != "All":
        results = [r for r in results if r["current_risk_level"] == risk_level]

    return results

@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(supplier_in: SupplierCreate, db: Session = Depends(get_db)):
    code = supplier_in.supplier_code or f"SUP-{db.query(Supplier).count() + 1:03d}"
    
    supplier = Supplier(
        supplier_code=code,
        name=supplier_in.name,
        category=supplier_in.category,
        country=supplier_in.country,
        city=supplier_in.city,
        address=supplier_in.address,
        contact_person=supplier_in.contact_person,
        email=supplier_in.email,
        phone=supplier_in.phone,
        status=supplier_in.status or "Active",
        contract_value=supplier_in.contract_value,
        currency=supplier_in.currency or "USD",
        lead_time=supplier_in.lead_time,
        capacity=supplier_in.capacity or "Medium",
        payment_terms=supplier_in.payment_terms or "Net 30"
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    # Initial product creation if provided
    if supplier_in.initial_product_name:
        prod = Product(
            supplier_id=supplier.id,
            name=supplier_in.initial_product_name,
            category=supplier_in.initial_product_category or supplier_in.category,
            current_price=supplier_in.initial_product_price or 100.0
        )
        db.add(prod)
        db.commit()
        db.refresh(prod)

        if supplier_in.previous_price and supplier_in.previous_price != prod.current_price:
            pct = ((prod.current_price - supplier_in.previous_price) / supplier_in.previous_price) * 100.0
            ph = PriceHistory(
                supplier_id=supplier.id,
                product_id=prod.id,
                previous_price=supplier_in.previous_price,
                new_price=prod.current_price,
                change_percentage=round(pct, 2),
                effective_date=datetime.utcnow(),
                reason="Initial baseline price record"
            )
            db.add(ph)
            db.commit()

    # Initial risk score calculation
    await risk_service.calculate_supplier_risk(db, supplier.id)

    # Retain supplier creation event in Hindsight Cloud
    await hindsight_service.retain(
        supplier_id=supplier.id,
        supplier_name=supplier.name,
        event_type="Supplier Creation",
        content=f"Onboarded new supplier {supplier.name} ({code}) in {supplier.category} category located in {supplier.city}, {supplier.country}. Contract value: ${supplier.contract_value:,.2f}.",
        metadata={"category": supplier.category, "country": supplier.country}
    )

    return format_supplier_response(db, supplier)

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return format_supplier_response(db, supplier)

@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: int, supplier_in: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, val in supplier_in.dict(exclude_unset=True).items():
        setattr(supplier, field, val)

    db.commit()
    db.refresh(supplier)

    await hindsight_service.retain(
        supplier_id=supplier.id,
        supplier_name=supplier.name,
        event_type="Supplier Update",
        content=f"Updated supplier profile details. Status: {supplier.status}, Capacity: {supplier.capacity}, Lead Time: {supplier.lead_time} days.",
        metadata={"status": supplier.status}
    )

    return format_supplier_response(db, supplier)

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(supplier)
    db.commit()
    return {"message": f"Supplier ID {supplier_id} successfully deleted"}
