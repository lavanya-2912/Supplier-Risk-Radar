from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.copilot import CopilotQueryRequest, CopilotQueryResponse
from app.services.copilot_service import copilot_service

router = APIRouter(prefix="/api/copilot", tags=["Risk Copilot"])

@router.post("/query", response_model=CopilotQueryResponse)
async def query_copilot(req: CopilotQueryRequest, db: Session = Depends(get_db)):
    res = await copilot_service.process_query(db, req.query, req.supplier_id)
    return res
