from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/suppliers", tags=["Backup Suppliers"])

class CompareRequest(BaseModel):
    alternative_ids: List[int]

@router.get("/{supplier_id}/alternatives")
def get_backup_recommendations(supplier_id: int, limit: int = 4, db: Session = Depends(get_db)):
    recs = recommendation_service.recommend_alternatives(db, supplier_id, limit=limit)
    return recs

@router.post("/{supplier_id}/compare")
def compare_supplier_alternatives(supplier_id: int, payload: CompareRequest, db: Session = Depends(get_db)):
    res = recommendation_service.compare_suppliers(db, supplier_id, payload.alternative_ids)
    return res
