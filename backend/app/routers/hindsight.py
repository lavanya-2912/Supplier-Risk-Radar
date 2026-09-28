from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.database import get_db
from app.models.supplier import Supplier
from app.services.hindsight_service import hindsight_service

router = APIRouter(prefix="/api/suppliers", tags=["Hindsight Memory"])

class SearchMemoryRequest(BaseModel):
    query: str

@router.get("/{supplier_id}/memory")
async def get_supplier_memories(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    memories = await hindsight_service.recall(
        supplier_id=supplier.id,
        supplier_name=supplier.name,
        query="performance delay quality price risk incident",
        limit=20
    )
    return {"supplier_id": supplier.id, "supplier_name": supplier.name, "memories": memories}

@router.post("/{supplier_id}/memory/search")
async def search_supplier_memory(supplier_id: int, req: SearchMemoryRequest, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    results = await hindsight_service.recall(
        supplier_id=supplier.id,
        supplier_name=supplier.name,
        query=req.query,
        limit=10
    )
    return {"query": req.query, "results": results}
