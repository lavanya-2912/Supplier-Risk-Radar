from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.risk import PredictionResponse
from app.ml.prediction_service import prediction_service

router = APIRouter(prefix="/api/suppliers", tags=["Predictions"])

@router.post("/{supplier_id}/prediction", response_model=PredictionResponse)
async def predict_supplier_disruption(supplier_id: int, db: Session = Depends(get_db)):
    res = await prediction_service.predict_disruption(db, supplier_id)
    return res

@router.get("/{supplier_id}/prediction", response_model=PredictionResponse)
async def get_latest_prediction(supplier_id: int, db: Session = Depends(get_db)):
    res = await prediction_service.predict_disruption(db, supplier_id)
    return res
