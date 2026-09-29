from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.models.delivery import Delivery
from app.models.quality import QualityIncident
from app.models.price import PriceHistory
from app.models.risk import RiskScore

class RecommendationService:
    """
    Intelligent Alternative Supplier Recommendation & Side-by-Side Comparison Engine.
    Evaluates candidate replacement suppliers using multi-attribute utility matching.
    """

    def get_supplier_metrics(self, db: Session, supplier_id: int) -> Dict[str, Any]:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return {}

        deliveries = db.query(Delivery).filter(Delivery.supplier_id == supplier_id).all()
        quality = db.query(QualityIncident).filter(QualityIncident.supplier_id == supplier_id).all()
        prices = db.query(PriceHistory).filter(PriceHistory.supplier_id == supplier_id).all()
        latest_risk = db.query(RiskScore).filter(RiskScore.supplier_id == supplier_id).order_by(RiskScore.calculated_at.desc()).first()

        total_del = len(deliveries)
        delayed = sum(1 for d in deliveries if d.delay_days > 0)
        otd_pct = ((total_del - delayed) / total_del * 100.0) if total_del > 0 else 95.0

        total_qty = sum(q.total_quantity for q in quality if q.total_quantity > 0)
        defect_qty = sum(q.defect_quantity for q in quality)
        defect_rate = (defect_qty / total_qty * 100.0) if total_qty > 0 else 1.2

        price_change = sum(p.change_percentage for p in prices) if prices else 0.0
        risk_score = latest_risk.score if latest_risk else 30.0

        return {
            "id": supplier.id,
            "name": supplier.name,
            "supplier_code": supplier.supplier_code or f"SUP-{supplier.id:03d}",
            "category": supplier.category,
            "country": supplier.country,
            "city": supplier.city,
            "contract_value": supplier.contract_value,
            "lead_time": supplier.lead_time,
            "capacity": supplier.capacity,
            "otd_pct": round(otd_pct, 1),
            "defect_rate": round(defect_rate, 2),
            "price_change": round(price_change, 1),
            "risk_score": round(risk_score, 1),
            "status": supplier.status
        }

    def recommend_alternatives(self, db: Session, target_supplier_id: int, limit: int = 4) -> List[Dict[str, Any]]:
        target = self.get_supplier_metrics(db, target_supplier_id)
        if not target:
            return []

        # Find candidate suppliers in same category (excluding target itself)
        candidates = db.query(Supplier).filter(
            Supplier.id != target_supplier_id,
            Supplier.category == target["category"]
        ).all()

        # If not enough in category, pull candidates across all categories
        if len(candidates) < limit:
            other_candidates = db.query(Supplier).filter(
                Supplier.id != target_supplier_id,
                Supplier.category != target["category"]
            ).all()
            candidates.extend(other_candidates)

        recommendations = []

        for cand in candidates:
            cand_metrics = self.get_supplier_metrics(db, cand.id)
            if not cand_metrics:
                continue

            # Calculate match score
            score = 0.0

            # 1. Category Match (25 pts)
            is_same_category = cand_metrics["category"] == target["category"]
            score += 25.0 if is_same_category else 10.0

            # 2. Delivery Reliability (25 pts)
            otd = cand_metrics["otd_pct"]
            score += (otd / 100.0) * 25.0

            # 3. Quality Performance (20 pts)
            def_rate = cand_metrics["defect_rate"]
            qual_score = max(0.0, 20.0 - (def_rate * 2.5))
            score += qual_score

            # 4. Low Disruption Risk (15 pts)
            risk = cand_metrics["risk_score"]
            risk_match = max(0.0, (100.0 - risk) / 100.0 * 15.0)
            score += risk_match

            # 5. Lead Time & Capacity (15 pts)
            lead_time_diff = abs(cand_metrics["lead_time"] - target["lead_time"])
            score += max(0.0, 15.0 - (lead_time_diff * 0.5))

            match_score = round(min(99.0, max(50.0, score)), 1)

            # Reasons & Potential Concerns
            reasons = []
            if is_same_category:
                reasons.append(f"✓ Same product category ({cand_metrics['category']})")
            if otd >= 92.0:
                reasons.append(f"✓ Strong {otd}% On-Time Delivery performance")
            if def_rate <= 2.5:
                reasons.append(f"✓ Low defect rate ({def_rate}%)")
            if risk <= 35.0:
                reasons.append("✓ Low disruption risk profile")
            if cand_metrics["lead_time"] <= target["lead_time"]:
                reasons.append(f"✓ Fast lead time ({cand_metrics['lead_time']} days)")

            concerns = []
            if cand_metrics["capacity"] == "Low":
                concerns.append("Limited peak-season capacity")
            elif cand_metrics["lead_time"] > target["lead_time"]:
                concerns.append(f"Slightly longer lead time ({cand_metrics['lead_time']} days vs {target['lead_time']} days)")
            elif cand_metrics["price_change"] > 5.0:
                concerns.append(f"Recent price adjustment (+{cand_metrics['price_change']}%)")
            else:
                concerns.append("Requires standard onboarding verification")

            recommendations.append({
                "supplier_id": cand.id,
                "name": cand_metrics["name"],
                "supplier_code": cand_metrics["supplier_code"],
                "category": cand_metrics["category"],
                "country": cand_metrics["country"],
                "match_score": match_score,
                "on_time_delivery_pct": otd,
                "defect_rate_pct": def_rate,
                "risk_score": risk,
                "lead_time": cand_metrics["lead_time"],
                "capacity": cand_metrics["capacity"],
                "contract_value": cand_metrics["contract_value"],
                "reasons": reasons,
                "concerns": concerns
            })

        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        top_recs = recommendations[:limit]

        from app.services.groq_service import groq_service
        enhanced_recs = groq_service.recommend_backup_supplier_reasoning(target, top_recs)
        return enhanced_recs

    def compare_suppliers(self, db: Session, target_supplier_id: int, alternative_ids: List[int]) -> Dict[str, Any]:
        target = self.get_supplier_metrics(db, target_supplier_id)
        alternatives = [self.get_supplier_metrics(db, aid) for aid in alternative_ids if aid != target_supplier_id]
        alt_dicts = [a for a in alternatives if a]

        # Format candidates for Groq evaluation
        cand_eval_list = []
        for a in alt_dicts:
            cand_eval_list.append({
                "supplier_id": a.get("id"),
                "name": a.get("name"),
                "category": a.get("category"),
                "country": a.get("country"),
                "on_time_delivery_pct": a.get("otd_pct", 90.0),
                "defect_rate_pct": a.get("defect_rate", 1.0),
                "risk_score": a.get("risk_score", 30.0),
                "lead_time": a.get("lead_time", 7),
                "capacity": a.get("capacity", "Medium"),
                "contract_value": a.get("contract_value", 0),
                "match_score": 92.0
            })

        from app.services.groq_service import groq_service
        enhanced_alts = groq_service.recommend_backup_supplier_reasoning(target or {}, cand_eval_list)

        # Merge ai_rationale back into alternatives
        ai_map = {e["supplier_id"]: e.get("ai_rationale", "") for e in enhanced_alts if "supplier_id" in e}
        for a in alt_dicts:
            a["ai_rationale"] = ai_map.get(a.get("id"), "")

        return {
            "target_supplier": target,
            "alternatives": alt_dicts
        }

recommendation_service = RecommendationService()

