import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("groq_service")

class GroqService:
    """
    Groq LPU Inference Service for Supplier Risk Radar.
    Integrates Groq API (llama-3.3-70b-versatile) for high-speed executive narratives,
    backup supplier recommendation reasoning, and news sentiment/disruption analysis.
    Includes deterministic fallback logic to ensure uninterrupted operations if API calls fail or time out.
    """

    def __init__(self):
        self.model = getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile") or "llama-3.3-70b-versatile"
        self._client = None

    def _get_client(self):
        api_key = getattr(settings, "GROQ_API_KEY", "")
        if not api_key:
            logger.warning("GROQ_API_KEY not configured. Operating in deterministic fallback mode.")
            return None

        if self._client is None:
            try:
                import groq
                self._client = groq.Groq(api_key=api_key, timeout=10.0)
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                return None
        return self._client

    def explain_supplier_risk(self, supplier_data: Dict[str, Any], history: List[Any], news_signals: List[Any]) -> Dict[str, Any]:
        """
        1. explain_supplier_risk(supplier_data, history, news_signals):
        Generates an executive narrative explaining why the supplier is risky, emerging signals, and recommended strategic actions.
        """
        client = self._get_client()

        supplier_name = supplier_data.get("name", "Target Supplier")
        risk_score = supplier_data.get("score", supplier_data.get("current_risk_score", 50.0))
        risk_level = supplier_data.get("risk_level", supplier_data.get("current_risk_level", "MEDIUM"))
        otd = supplier_data.get("on_time_delivery_pct", 90.0)
        defect_rate = supplier_data.get("defect_rate_pct", 1.5)
        price_change = supplier_data.get("recent_price_change_pct", 0.0)

        history_summary = []
        if isinstance(history, list):
            for h in history[:3]:
                if isinstance(h, dict):
                    history_summary.append(h.get("text", h.get("content", str(h))))
                else:
                    history_summary.append(str(h))

        news_summary = []
        if isinstance(news_signals, list):
            for n in news_signals[:3]:
                if isinstance(n, dict):
                    news_summary.append(f"{n.get('title', '')} (Sentiment: {n.get('sentiment', 'Neutral')})")
                else:
                    news_summary.append(str(n))

        prompt = f"""You are a Lead Procurement Risk Director analyzing supplier operational disruption risk.
Generate a structured JSON executive assessment for supplier: {supplier_name}.

SUPPLIER METRICS:
- Overall Risk Score: {risk_score}/100 ({risk_level})
- On-Time Delivery Rate: {otd}%
- Quality Defect Rate: {defect_rate}%
- Recent Price Escalation: +{price_change}%
- Historical Memory Context: {'; '.join(history_summary) if history_summary else 'No recent anomalies recorded'}
- External News Signals: {'; '.join(news_summary) if news_summary else 'Clean news profile'}

Respond ONLY with valid JSON in this exact structure without markdown formatting or code blocks:
{{
  "executive_summary": "Executive narrative of why this supplier carries this risk level and operational impact.",
  "emerging_signals": [
    "Signal 1",
    "Signal 2"
  ],
  "risk_drivers": [
    {{"category": "Delivery / Quality / Financial", "description": "Specific metric analysis"}}
  ],
  "recommended_actions": [
    "Strategic recommendation 1",
    "Strategic recommendation 2"
  ]
}}"""

        if client:
            try:
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a precise procurement AI assistant returning raw JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    temperature=0.3,
                    max_tokens=700
                )
                raw_text = response.choices[0].message.content.strip()

                # Clean markdown formatting if present
                if raw_text.startswith("```"):
                    lines = raw_text.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    raw_text = "\n".join(lines).strip()

                data = json.loads(raw_text)
                if isinstance(data, dict) and "executive_summary" in data:
                    return data
            except Exception as e:
                logger.warning(f"Groq API call for explain_supplier_risk failed/timed out: {e}. Utilizing baseline calculation fallback.")

        # Deterministic Baseline Calculation Fallback
        signals = []
        if otd < 90.0:
            signals.append(f"Sub-optimal delivery reliability ({otd:.1f}% OTD)")
        if defect_rate > 2.0:
            signals.append(f"Elevated quality defect rate ({defect_rate:.2f}%)")
        if price_change > 5.0:
            signals.append(f"Unplanned price escalation (+{price_change:.1f}%)")
        if not signals:
            signals.append("Baseline operational monitoring active")

        drivers = []
        if otd < 90.0:
            drivers.append({"category": "Delivery Reliability", "description": f"On-time shipment rate dropped to {otd:.1f}%, increasing stockout exposure."})
        if defect_rate > 2.0:
            drivers.append({"category": "Quality Assurance", "description": f"Defect rate reached {defect_rate:.2f}%, requiring secondary inspection batching."})
        if price_change > 5.0:
            drivers.append({"category": "Cost Creep", "description": f"Cumulative pricing increased by +{price_change:.1f}%, impacting unit margins."})
        if not drivers:
            drivers.append({"category": "General Operational Risk", "description": f"Overall risk index calculated at {risk_score}/100 ({risk_level})."})

        actions = []
        if risk_level in ["HIGH", "CRITICAL"]:
            actions.append(f"Initiate dual-sourcing contingency plan and activate backup suppliers for {supplier_name}.")
            actions.append("Request urgent Corrective Action Plan (CAPA) from vendor quality management.")
            actions.append("Enforce SLAs and hold weekly supply chain status reviews.")
        else:
            actions.append("Maintain routine operational monitoring and verify quarterly KPI benchmarks.")
            actions.append("Review contract renewal terms prior to peak demand period.")

        exec_summary = (
            f"Executive Analysis for {supplier_name}: Assessed at {risk_score}/100 ({risk_level} Risk). "
            f"Performance shows {otd:.1f}% on-time delivery and {defect_rate:.2f}% defect rate. "
            f"Primary operational focus remains on mitigating delay risks and maintaining supply continuity."
        )

        return {
            "executive_summary": exec_summary,
            "emerging_signals": signals,
            "risk_drivers": drivers,
            "recommended_actions": actions
        }

    def recommend_backup_supplier_reasoning(self, current_supplier: Dict[str, Any], backup_candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        2. recommend_backup_supplier_reasoning(current_supplier, backup_candidates):
        Produces specific, data-backed reasons for why each backup supplier is recommended.
        """
        if not backup_candidates:
            return []

        client = self._get_client()

        curr_name = current_supplier.get("name", "Current Supplier")
        curr_risk = current_supplier.get("risk_score", 50.0)
        curr_otd = current_supplier.get("otd_pct", 85.0)

        candidates_text = []
        for idx, cand in enumerate(backup_candidates):
            candidates_text.append(
                f"Candidate {idx+1} [ID: {cand.get('supplier_id')}]: {cand.get('name')} | Category: {cand.get('category')} | "
                f"Location: {cand.get('country')} | OTD: {cand.get('on_time_delivery_pct')}% | Defect Rate: {cand.get('defect_rate_pct')}% | "
                f"Risk Score: {cand.get('risk_score')}/100 | Lead Time: {cand.get('lead_time')} days | Match Score: {cand.get('match_score')}%"
            )

        prompt = f"""You are a Strategic Sourcing Director evaluating backup suppliers to replace or dual-source with {curr_name} (Current Risk: {curr_risk}/100, OTD: {curr_otd}%).

EVALUATE THESE BACKUP CANDIDATES:
{chr(10).join(candidates_text)}

For EACH candidate, provide a specific, compelling 1-2 sentence data-backed rationale explaining why this supplier is recommended as a strategic backup over {curr_name}.

Respond ONLY with valid JSON in this structure (array of objects):
[
  {{
    "supplier_id": 123,
    "ai_rationale": "Recommended backup because it offers superior 98% OTD, 5-day shorter lead time, and a low 18/100 risk score compared to {curr_name}."
  }}
]"""

        if client:
            try:
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a strategic sourcing expert returning raw JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    temperature=0.3,
                    max_tokens=600
                )
                raw_text = response.choices[0].message.content.strip()

                if raw_text.startswith("```"):
                    lines = raw_text.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    raw_text = "\n".join(lines).strip()

                parsed = json.loads(raw_text)
                if isinstance(parsed, list):
                    rationales_by_id = {item.get("supplier_id"): item.get("ai_rationale") for item in parsed if isinstance(item, dict)}
                    
                    enhanced = []
                    for cand in backup_candidates:
                        cand_copy = dict(cand)
                        cid = cand_copy.get("supplier_id")
                        if cid in rationales_by_id and rationales_by_id[cid]:
                            cand_copy["ai_rationale"] = rationales_by_id[cid]
                        else:
                            cand_copy["ai_rationale"] = self._generate_fallback_rationale(curr_name, cand_copy)
                        enhanced.append(cand_copy)
                    return enhanced
            except Exception as e:
                logger.warning(f"Groq API call for recommend_backup_supplier_reasoning failed/timed out: {e}. Using baseline fallback.")

        # Fallback
        enhanced = []
        for cand in backup_candidates:
            cand_copy = dict(cand)
            cand_copy["ai_rationale"] = self._generate_fallback_rationale(curr_name, cand_copy)
            enhanced.append(cand_copy)
        return enhanced

    def _generate_fallback_rationale(self, target_name: str, cand: Dict[str, Any]) -> str:
        otd = cand.get("on_time_delivery_pct", 95.0)
        defect = cand.get("defect_rate_pct", 1.0)
        lead = cand.get("lead_time", 7)
        risk = cand.get("risk_score", 20.0)
        match = cand.get("match_score", 90.0)
        name = cand.get("name", "Alternative Supplier")

        return (
            f"Strong backup candidate with {match}% match score. Demonstrates high delivery reliability ({otd}% OTD), "
            f"low defect rate ({defect}%), and a resilient risk profile ({risk}/100) with a {lead}-day lead time."
        )

    def analyze_news_sentiment(self, headline: str, summary: str) -> Dict[str, Any]:
        """
        3. analyze_news_sentiment(headline, summary):
        Analyzes disruption signals and assigns risk categories and severity weights.
        """
        client = self._get_client()

        prompt = f"""Analyze the following supply chain news event for operational disruption risk:

HEADLINE: {headline}
SUMMARY: {summary}

Respond ONLY with valid JSON in this exact structure without markdown:
{{
  "category": "Factory shutdown / Strike / Natural disaster / Financial distress / Cyber incident / Regulatory issue / Logistics disruption / Product recall / Geopolitical issue / Port disruption",
  "sentiment": "Critical / Risk / Neutral / Positive",
  "risk_score": 75.0,
  "severity_weight": "Critical / High / Medium / Low",
  "ai_analysis": "Concise synthesis of predicted supply chain impact."
}}"""

        if client:
            try:
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a supply chain intelligence analyst returning raw JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    temperature=0.2,
                    max_tokens=400
                )
                raw_text = response.choices[0].message.content.strip()

                if raw_text.startswith("```"):
                    lines = raw_text.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    raw_text = "\n".join(lines).strip()

                data = json.loads(raw_text)
                if isinstance(data, dict) and "category" in data and "sentiment" in data:
                    return data
            except Exception as e:
                logger.warning(f"Groq API call for analyze_news_sentiment failed/timed out: {e}. Utilizing baseline classification fallback.")

        # Deterministic Fallback Logic
        text = f"{headline} {summary}".lower()
        category = "Logistics disruption"
        if "factory" in text or "plant" in text or "shutdown" in text or "fire" in text:
            category = "Factory shutdown"
        elif "strike" in text or "labor" in text or "union" in text:
            category = "Strike"
        elif "disaster" in text or "flood" in text or "storm" in text or "typhoon" in text:
            category = "Natural disaster"
        elif "bankrupt" in text or "financial" in text or "debt" in text:
            category = "Financial distress"
        elif "cyber" in text or "hack" in text or "breach" in text:
            category = "Cyber incident"
        elif "port" in text or "shipping" in text or "container" in text:
            category = "Port disruption"

        if any(w in text for w in ["critical", "catastrophic", "shutdown", "halt", "bankruptcy"]):
            sentiment = "Critical"
            risk_score = 90.0
            severity = "Critical"
        elif any(w in text for w in ["delay", "disruption", "strike", "shortage", "risk"]):
            sentiment = "Risk"
            risk_score = 65.0
            severity = "High"
        else:
            sentiment = "Neutral"
            risk_score = 40.0
            severity = "Medium"

        return {
            "category": category,
            "sentiment": sentiment,
            "risk_score": risk_score,
            "severity_weight": severity,
            "ai_analysis": f"External signal categorized under {category}. Risk score assigned at {risk_score}/100 based on text keywords."
        }

groq_service = GroqService()
