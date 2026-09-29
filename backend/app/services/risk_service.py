import logging
from typing import Dict, Any, List, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.models.delivery import Delivery
from app.models.quality import QualityIncident
from app.models.price import PriceHistory
from app.models.news import NewsArticle
from app.models.risk import RiskScore
from app.services.hindsight_service import hindsight_service

logger = logging.getLogger("risk_service")

class RiskService:
    """
    Core Explainable Risk Engine for Supplier Risk Radar.
    Calculates weighted risk score based on:
      Delivery Risk: 30%
      Quality Risk: 25%
      Price Risk: 15%
      Historical Incident Risk: 15%
      External News Risk: 15%
    """

    def calculate_delivery_risk(self, deliveries: List[Delivery]) -> Tuple[float, List[str], List[str]]:
        if not deliveries:
            return 15.0, ["Clean initial delivery record"], []

        total = len(deliveries)
        delayed = [d for d in deliveries if d.delay_days > 0]
        on_time = total - len(delayed)
        otd_pct = (on_time / total) * 100.0

        avg_delay = sum(d.delay_days for d in deliveries) / total if total > 0 else 0

        # Score formula: 100 - OTD_pct with penalty for severe delays
        base_score = max(0.0, 100.0 - otd_pct)
        if avg_delay > 7:
            base_score = min(100.0, base_score + 20.0)
        elif avg_delay > 3:
            base_score = min(100.0, base_score + 10.0)

        positives = []
        negatives = []

        if otd_pct >= 95.0:
            positives.append(f"Strong delivery reliability ({otd_pct:.1f}% on-time rate)")
        elif otd_pct < 80.0:
            negatives.append(f"Low on-time delivery rate ({otd_pct:.1f}%)")

        if avg_delay > 5:
            negatives.append(f"High average delay duration ({avg_delay:.1f} days)")

        return round(base_score, 1), positives, negatives

    def calculate_quality_risk(self, quality_incidents: List[QualityIncident]) -> Tuple[float, List[str], List[str]]:
        if not quality_incidents:
            return 10.0, ["Zero recorded quality defects"], []

        total_qty = sum(q.total_quantity for q in quality_incidents if q.total_quantity > 0)
        defect_qty = sum(q.defect_quantity for q in quality_incidents)
        overall_defect_rate = (defect_qty / total_qty * 100.0) if total_qty > 0 else 0.0

        critical_count = sum(1 for q in quality_incidents if q.severity in ["High", "Critical"])

        # Base score based on defect rate (0-2% = low, 2-5% = med, >5% = high)
        if overall_defect_rate <= 1.0:
            score = 15.0
        elif overall_defect_rate <= 3.0:
            score = 40.0
        elif overall_defect_rate <= 6.0:
            score = 70.0
        else:
            score = 95.0

        score = min(100.0, score + (critical_count * 10.0))

        positives = []
        negatives = []

        if overall_defect_rate < 2.0:
            positives.append(f"Low defect rate ({overall_defect_rate:.2f}%)")
        else:
            negatives.append(f"Elevated defect rate ({overall_defect_rate:.2f}%)")

        if critical_count > 0:
            negatives.append(f"{critical_count} high-severity quality incident(s)")

        return round(score, 1), positives, negatives

    def calculate_price_risk(self, price_histories: List[PriceHistory]) -> Tuple[float, List[str], List[str]]:
        if not price_histories:
            return 15.0, ["Stable contractual pricing history"], []

        recent_changes = sorted(price_histories, key=lambda x: x.effective_date, reverse=True)
        latest_change = recent_changes[0].change_percentage if recent_changes else 0.0

        # Cumulative price creep in last 12 months
        total_creep = sum(p.change_percentage for p in price_histories if p.change_percentage > 0)

        if total_creep <= 3.0:
            score = 10.0
        elif total_creep <= 7.0:
            score = 45.0
        elif total_creep <= 15.0:
            score = 75.0
        else:
            score = 95.0

        positives = []
        negatives = []

        if total_creep <= 3.0:
            positives.append(f"Predictable pricing (+{total_creep:.1f}% cumulative change)")
        elif total_creep > 7.0:
            negatives.append(f"Significant price creep (+{total_creep:.1f}% cumulative change)")

        return round(score, 1), positives, negatives

    def calculate_historical_risk(self, supplier: Supplier, memories: List[Dict[str, Any]]) -> Tuple[float, List[str], List[str]]:
        incidents_count = len(supplier.deliveries) + len(supplier.quality_incidents)
        memory_penalty = len(memories) * 5.0

        if incidents_count == 0:
            score = 10.0
        elif incidents_count < 3:
            score = 30.0
        elif incidents_count < 7:
            score = 60.0
        else:
            score = 85.0

        score = min(100.0, score + memory_penalty)

        positives = []
        negatives = []

        if incidents_count <= 1:
            positives.append("Clean historical operational record")
        else:
            negatives.append(f"Multiple recorded operational incidents ({incidents_count} total)")

        if memories:
            negatives.append(f"Retrieved {len(memories)} relevant risk memories from Hindsight")

        return round(score, 1), positives, negatives

    def calculate_news_risk(self, news_articles: List[NewsArticle]) -> Tuple[float, List[str], List[str]]:
        if not news_articles:
            return 20.0, ["No negative external news signals"], []

        avg_news_score = sum(n.risk_score for n in news_articles) / len(news_articles)
        critical_news = [n for n in news_articles if n.sentiment in ["Risk", "Critical"]]

        positives = []
        negatives = []

        if not critical_news:
            positives.append("Favorable external news sentiment")
        else:
            negatives.append(f"{len(critical_news)} negative external news signal(s) detected")
            for n in critical_news[:2]:
                negatives.append(f"News: {n.category} - {n.title[:60]}...")

        return round(avg_news_score, 1), positives, negatives

    async def calculate_supplier_risk(self, db: Session, supplier_id: int) -> Dict[str, Any]:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise ValueError(f"Supplier ID {supplier_id} not found")

        deliveries = db.query(Delivery).filter(Delivery.supplier_id == supplier_id).all()
        quality_incidents = db.query(QualityIncident).filter(QualityIncident.supplier_id == supplier_id).all()
        price_histories = db.query(PriceHistory).filter(PriceHistory.supplier_id == supplier_id).all()
        news_articles = db.query(NewsArticle).filter(NewsArticle.supplier_id == supplier_id).all()

        # Retrieve Hindsight memories
        memories = await hindsight_service.recall(supplier_id=supplier_id, supplier_name=supplier.name, query="risk delay quality price incident")

        delivery_score, del_pos, del_neg = self.calculate_delivery_risk(deliveries)
        quality_score, qual_pos, qual_neg = self.calculate_quality_risk(quality_incidents)
        price_score, pr_pos, pr_neg = self.calculate_price_risk(price_histories)
        historical_score, hist_pos, hist_neg = self.calculate_historical_risk(supplier, memories)
        news_score, news_pos, news_neg = self.calculate_news_risk(news_articles)

        # Weighted calculation
        total_score = (
            delivery_score * 0.30 +
            quality_score * 0.25 +
            price_score * 0.15 +
            historical_score * 0.15 +
            news_score * 0.15
        )
        total_score = round(total_score, 1)

        # Risk Level Mapping
        if total_score < 25.0:
            risk_level = "LOW"
        elif total_score < 50.0:
            risk_level = "MEDIUM"
        elif total_score < 75.0:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        positives = del_pos + qual_pos + pr_pos + hist_pos + news_pos
        negatives = del_neg + qual_neg + pr_neg + hist_neg + news_neg

        # Additional default positive signals if few negatives exist
        if not negatives:
            positives.append("Stable production capacity and clean compliance history")

        # Save risk score record in DB
        risk_record = RiskScore(
            supplier_id=supplier_id,
            score=total_score,
            risk_level=risk_level,
            delivery_score=delivery_score,
            quality_score=quality_score,
            price_score=price_score,
            historical_score=historical_score,
            news_score=news_score,
            explanation=f"Risk Score {total_score} ({risk_level}). Delivery: {delivery_score}, Quality: {quality_score}, Price: {price_score}, Historical: {historical_score}, News: {news_score}.",
            calculated_at=datetime.utcnow()
        )
        db.add(risk_record)
        db.commit()

        # Update status if critical
        if risk_level in ["HIGH", "CRITICAL"] and supplier.status != "High Risk":
            supplier.status = "High Risk"
            db.commit()

        # Retain risk calculation event in Hindsight
        await hindsight_service.retain(
            supplier_id=supplier_id,
            supplier_name=supplier.name,
            event_type="Risk Assessment",
            content=f"Calculated Risk Score: {total_score}/100 ({risk_level}). Drivers: Delivery ({delivery_score}), Quality ({quality_score}), Price ({price_score}), News ({news_score}).",
            metadata={"risk_score": total_score, "risk_level": risk_level}
        )

        components = [
            {"name": "Delivery Delays", "weight_pct": 30.0, "score": delivery_score, "contribution_pct": round(delivery_score * 0.30, 1), "description": "Measures on-time delivery rate and delay durations"},
            {"name": "Quality Incidents", "weight_pct": 25.0, "score": quality_score, "contribution_pct": round(quality_score * 0.25, 1), "description": "Measures defect rates, inspection results, and defect severity"},
            {"name": "Price Creep", "weight_pct": 15.0, "score": price_score, "contribution_pct": round(price_score * 0.15, 1), "description": "Measures cumulative price escalation vs baseline contract"},
            {"name": "Historical Incidents", "weight_pct": 15.0, "score": historical_score, "contribution_pct": round(historical_score * 0.15, 1), "description": "Hindsight persistent memory of historical performance patterns"},
            {"name": "External News Signals", "weight_pct": 15.0, "score": news_score, "contribution_pct": round(news_score * 0.15, 1), "description": "Real-time news monitoring for geopolitical, port, labor, or financial risks"}
        ]

        # Calculate OTD %, Defect %, Price % for Groq input
        tot_del = len(deliveries)
        del_delay_count = sum(1 for d in deliveries if d.delay_days > 0)
        otd_pct = round(((tot_del - del_delay_count) / tot_del * 100.0) if tot_del > 0 else 95.0, 1)

        tot_qty = sum(q.total_quantity for q in quality_incidents if q.total_quantity > 0)
        def_qty = sum(q.defect_quantity for q in quality_incidents)
        def_rate_pct = round((def_qty / tot_qty * 100.0) if tot_qty > 0 else 1.2, 2)

        price_chg = round(sum(p.change_percentage for p in price_histories) if price_histories else 0.0, 1)

        supplier_metrics = {
            "name": supplier.name,
            "score": total_score,
            "risk_level": risk_level,
            "on_time_delivery_pct": otd_pct,
            "defect_rate_pct": def_rate_pct,
            "recent_price_change_pct": price_chg
        }

        from app.services.groq_service import groq_service
        ai_narrative = groq_service.explain_supplier_risk(
            supplier_data=supplier_metrics,
            history=memories,
            news_signals=[{"title": n.title, "sentiment": n.sentiment, "category": n.category} for n in news_articles]
        )

        return {
            "supplier_id": supplier_id,
            "score": total_score,
            "risk_level": risk_level,
            "delivery_score": delivery_score,
            "quality_score": quality_score,
            "price_score": price_score,
            "historical_score": historical_score,
            "news_score": news_score,
            "explanation": f"Supplier Risk Score: {total_score} ({risk_level}). Primary drivers: Delivery delays ({delivery_score}), Quality issues ({quality_score}), Price creep ({price_score}), News signals ({news_score}).",
            "components": components,
            "positive_signals": positives,
            "negative_signals": negatives,
            "calculated_at": datetime.utcnow(),
            "ai_narrative": ai_narrative,
            "ai_executive_summary": ai_narrative.get("executive_summary", ""),
            "ai_emerging_signals": ai_narrative.get("emerging_signals", []),
            "ai_risk_drivers": ai_narrative.get("risk_drivers", []),
            "ai_recommended_actions": ai_narrative.get("recommended_actions", [])
        }

    def run_what_if_simulation(self, current_score: float, current_level: str, delay_days: int, defect_rate_change: float, price_inc: float, news_risk: str) -> Dict[str, Any]:
        """Simulate projected risk under hypothetical conditions."""
        projected = current_score

        if delay_days > 0:
            projected += min(30.0, delay_days * 3.5)
        if defect_rate_change > 0:
            projected += min(25.0, defect_rate_change * 4.0)
        if price_inc > 0:
            projected += min(15.0, price_inc * 1.2)
        if news_risk == "Critical":
            projected += 15.0
        elif news_risk == "High":
            projected += 10.0

        projected = min(100.0, round(projected, 1))

        if projected < 25.0:
            new_level = "LOW"
        elif projected < 50.0:
            new_level = "MEDIUM"
        elif projected < 75.0:
            new_level = "HIGH"
        else:
            new_level = "CRITICAL"

        delta = round(projected - current_score, 1)

        return {
            "current_score": current_score,
            "current_risk_level": current_level,
            "projected_score": projected,
            "projected_risk_level": new_level,
            "delta": delta,
            "explanation": f"Projected risk increases by +{delta} points from {current_score} ({current_level}) to {projected} ({new_level}) under simulated stress conditions."
        }

risk_service = RiskService()
