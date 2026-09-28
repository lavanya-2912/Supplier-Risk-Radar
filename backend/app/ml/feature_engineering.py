import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.models.delivery import Delivery
from app.models.quality import QualityIncident
from app.models.price import PriceHistory
from app.models.news import NewsArticle

def extract_supplier_features(db: Session, supplier_id: int) -> Dict[str, Any]:
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        return {}

    deliveries = db.query(Delivery).filter(Delivery.supplier_id == supplier_id).all()
    quality = db.query(QualityIncident).filter(QualityIncident.supplier_id == supplier_id).all()
    prices = db.query(PriceHistory).filter(PriceHistory.supplier_id == supplier_id).all()
    news = db.query(NewsArticle).filter(NewsArticle.supplier_id == supplier_id).all()

    total_deliveries = len(deliveries)
    delayed_deliveries = sum(1 for d in deliveries if d.delay_days > 0)
    avg_delay_days = (sum(d.delay_days for d in deliveries) / total_deliveries) if total_deliveries > 0 else 0.0
    otd_pct = ((total_deliveries - delayed_deliveries) / total_deliveries * 100.0) if total_deliveries > 0 else 100.0

    total_qty = sum(q.total_quantity for q in quality if q.total_quantity > 0)
    defect_qty = sum(q.defect_quantity for q in quality)
    defect_rate = (defect_qty / total_qty * 100.0) if total_qty > 0 else 0.0
    quality_incident_count = len(quality)

    cumulative_price_inc = sum(p.change_percentage for p in prices if p.change_percentage > 0)
    recent_news_risk = (sum(n.risk_score for n in news) / len(news)) if news else 20.0

    capacity_map = {"Low": 1, "Medium": 2, "High": 3}
    capacity_val = capacity_map.get(supplier.capacity, 2)

    return {
        "supplier_id": supplier_id,
        "total_deliveries": total_deliveries,
        "delayed_deliveries": delayed_deliveries,
        "avg_delay_days": avg_delay_days,
        "otd_pct": otd_pct,
        "defect_rate": defect_rate,
        "quality_incident_count": quality_incident_count,
        "cumulative_price_inc": cumulative_price_inc,
        "recent_news_risk": recent_news_risk,
        "lead_time": supplier.lead_time,
        "capacity_val": capacity_val,
        "contract_value": supplier.contract_value
    }
