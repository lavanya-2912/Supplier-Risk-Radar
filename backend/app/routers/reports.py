from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
import io
from app.database import get_db
from app.schemas.report import ReportGenerateRequest
from app.services.report_service import report_service

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("/generate")
async def generate_report(req: ReportGenerateRequest, db: Session = Depends(get_db)):
    if req.format == "csv":
        csv_content = await report_service.generate_csv_report(db, req.supplier_ids)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=supplier_risk_report.csv"}
        )
    else:
        pdf_bytes = await report_service.generate_pdf_report(db, req.supplier_ids)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=supplier_risk_report.pdf"}
        )
