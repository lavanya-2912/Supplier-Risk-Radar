from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.supplier import Supplier
from app.models.risk import Prediction
from app.ml.feature_engineering import extract_supplier_features
from app.ml.model import ml_model
from app.services.hindsight_service import hindsight_service

class PredictionService:
    """
    Service for calculating disruption probability, confidence, horizon, evidence and limitations.
    Combines Scikit-learn ML inference with Hindsight memory recall.
    """

    async def predict_disruption(self, db: Session, supplier_id: int) -> Dict[str, Any]:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise ValueError(f"Supplier ID {supplier_id} not found")

        features = extract_supplier_features(db, supplier_id)
        total_records = (features.get("total_deliveries", 0) + features.get("quality_incident_count", 0))

        # Retrieve Hindsight historical context
        memories = await hindsight_service.recall(
            supplier_id=supplier_id,
            supplier_name=supplier.name,
            query="delivery delay disruption quality risk history",
            limit=5
        )

        has_sufficient_data = total_records >= 2

        if has_sufficient_data:
            prob, conf = ml_model.predict(features)
            model_type = "Random Forest Machine Learning Model (Scikit-Learn)"
            limitations = "Model predictions are probabilistic estimates based on historical operational metrics and real-time news signals. They do not constitute guaranteed facts."
        else:
            # Rule based fallback
            prob = min(85.0, max(15.0, (features.get("avg_delay_days", 0) * 8.0) + (features.get("defect_rate", 0) * 5.0)))
            conf = 65.0
            model_type = "Explainable Rule-Based Assessment (Insufficient Historical ML Data)"
            limitations = "Insufficient historical operational records for deep ML model inference. Displaying rule-based assessment."

        prob = round(prob, 1)
        conf = round(conf, 1)

        # Risk level text
        if prob < 25.0:
            level = "LOW"
        elif prob < 50.0:
            level = "MEDIUM"
        elif prob < 75.0:
            level = "HIGH"
        else:
            level = "CRITICAL"

        evidence = []
        if features.get("avg_delay_days", 0) > 0:
            evidence.append(f"Average delivery delay: {features['avg_delay_days']:.1f} days")
        if features.get("otd_pct", 100) < 90.0:
            evidence.append(f"Historical On-Time Delivery: {features['otd_pct']:.1f}%")
        if features.get("defect_rate", 0) > 0:
            evidence.append(f"Defect rate: {features['defect_rate']:.2f}% across recent batches")
        if features.get("cumulative_price_inc", 0) > 5.0:
            evidence.append(f"Cumulative price increase: +{features['cumulative_price_inc']:.1f}%")
        if features.get("recent_news_risk", 0) > 50.0:
            evidence.append(f"Recent external news risk index: {features['recent_news_risk']:.0f}/100")
        
        for mem in memories[:2]:
            evidence.append(f"Hindsight Recall Memory: {mem['event_type']} - {mem['text'][:75]}...")

        explanation = (
            f"Supplier {supplier.name} has a predicted {prob}% probability of supply chain disruption "
            f"over the next 30 days (Confidence: {conf}%). Key risk signals include "
            + (", ".join(evidence[:3]) if evidence else "stable historical performance metrics") + "."
        )

        # Save prediction in database
        pred_record = Prediction(
            supplier_id=supplier_id,
            disruption_probability=prob,
            confidence=conf,
            prediction_horizon="30 days",
            model_type=model_type,
            explanation=explanation,
            evidence=" | ".join(evidence),
            created_at=datetime.utcnow()
        )
        db.add(pred_record)
        db.commit()

        # Retain prediction event in Hindsight
        await hindsight_service.retain(
            supplier_id=supplier_id,
            supplier_name=supplier.name,
            event_type="Disruption Prediction",
            content=f"Predicted Disruption Probability: {prob}% | Confidence: {conf}% | Horizon: 30 days | Model: {model_type}",
            metadata={"disruption_probability": prob, "confidence": conf}
        )

        return {
            "supplier_id": supplier_id,
            "disruption_probability": prob,
            "confidence": conf,
            "risk_level": level,
            "prediction_horizon": "30 days",
            "model_type": model_type,
            "explanation": explanation,
            "evidence": evidence,
            "limitations": limitations,
            "created_at": datetime.utcnow()
        }

prediction_service = PredictionService()
