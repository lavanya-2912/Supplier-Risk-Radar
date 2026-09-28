import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.delivery import Delivery
from app.models.quality import QualityIncident
from app.models.price import PriceHistory
from app.models.news import NewsArticle
from app.models.risk import RiskScore, Prediction
from app.models.alert import Alert
from app.auth.security import get_password_hash

logger = logging.getLogger("seed")

def seed_demo_data():
    db: Session = SessionLocal()
    try:
        # Check if users already seeded
        if db.query(User).filter(User.email == "demo@supplierrisk.com").first():
            logger.info("Demo data already seeded.")
            return

        logger.info("Seeding realistic fictional demo data for Supplier Risk Radar...")

        # 1. Create Demo User Account
        demo_user = User(
            name="Sarah Jenkins (Procurement Lead)",
            email="demo@supplierrisk.com",
            password_hash=get_password_hash("Demo@123"),
            role="Chief Procurement Officer",
            created_at=datetime.utcnow() - timedelta(days=180)
        )
        db.add(demo_user)
        db.commit()

        # 2. Key Demo Supplier 1: Apex Industrial Components (Rising Risk Progression Story)
        apex = Supplier(
            supplier_code="SUP-001",
            name="Apex Industrial Components",
            category="Electronics",
            country="Taiwan",
            city="Hsinchu",
            address="45 Innovation Parkway, Hsinchu Science Park",
            contact_person="David Lin",
            email="d.lin@apexcomponents.tw",
            phone="+886 3 578 9000",
            status="High Risk",
            contract_value=4800000.0,
            currency="USD",
            lead_time=28,
            capacity="Medium",
            payment_terms="Net 45",
            created_at=datetime.utcnow() - timedelta(days=250)
        )
        db.add(apex)

        # 3. Key Demo Supplier 2: GlobalTech Components (Backup Candidate)
        globaltech = Supplier(
            supplier_code="SUP-002",
            name="GlobalTech Components",
            category="Electronics",
            country="South Korea",
            city="Incheon",
            address="88 Industrial Boulevard, Songdo Techpark",
            contact_person="Min-Jun Park",
            email="m.park@globaltech-comp.kr",
            phone="+82 32 850 1100",
            status="Active",
            contract_value=2200000.0,
            currency="USD",
            lead_time=14,
            capacity="High",
            payment_terms="Net 30",
            created_at=datetime.utcnow() - timedelta(days=250)
        )
        db.add(globaltech)

        # 4. Other 13 Fictional Suppliers
        other_suppliers_data = [
            ("SUP-003", "Precision Steel Works", "Raw Materials", "Germany", "Stuttgart", "Active", 3500000.0, 14, "High"),
            ("SUP-004", "BioPharm Solutions", "Pharmaceuticals", "Switzerland", "Basel", "Active", 6200000.0, 21, "Medium"),
            ("SUP-005", "EuroPack Containers", "Packaging", "Poland", "Katowice", "Active", 950000.0, 7, "High"),
            ("SUP-006", "AgriCorp Global Ingredients", "Food", "Brazil", "Santos", "Active", 1800000.0, 30, "Medium"),
            ("SUP-007", "Vanguard Automotive Systems", "Automotive", "Japan", "Nagoya", "High Risk", 5100000.0, 35, "Low"),
            ("SUP-008", "Silicon Circuit Technologies", "Electronics", "Vietnam", "Ho Chi Minh City", "Active", 2900000.0, 18, "High"),
            ("SUP-009", "Nordic Polymer Materials", "Raw Materials", "Sweden", "Gothenburg", "Active", 1400000.0, 10, "Medium"),
            ("SUP-010", "Pacific ColdChain Logistics", "Food", "Australia", "Melbourne", "Active", 820000.0, 5, "High"),
            ("SUP-011", "Apex Precision Castings", "Automotive", "Mexico", "Monterrey", "Active", 2100000.0, 20, "Medium"),
            ("SUP-012", "PharmaShield Packaging", "Pharmaceuticals", "India", "Hyderabad", "Active", 3100000.0, 15, "High"),
            ("SUP-013", "Titan Polymer Synthetics", "Raw Materials", "USA", "Houston", "Active", 4500000.0, 12, "High"),
            ("SUP-014", "Orion Micro-Motors", "Automotive", "South Korea", "Ulsan", "Active", 1750000.0, 16, "Medium"),
            ("SUP-015", "EcoBoard Sustainable Packaging", "Packaging", "Canada", "Vancouver", "Active", 680000.0, 8, "High")
        ]

        other_suppliers = []
        for code, name, cat, country, city, status, val, lt, cap in other_suppliers_data:
            s = Supplier(
                supplier_code=code,
                name=name,
                category=cat,
                country=country,
                city=city,
                status=status,
                contract_value=val,
                currency="USD",
                lead_time=lt,
                capacity=cap,
                created_at=datetime.utcnow() - timedelta(days=200)
            )
            db.add(s)
            other_suppliers.append(s)

        db.commit()
        db.refresh(apex)
        db.refresh(globaltech)

        # 5. Seed Products
        prod_apex = Product(supplier_id=apex.id, name="Microcontroller Unit (MCU-V4)", category="Electronics", current_price=112.0)
        prod_gt = Product(supplier_id=globaltech.id, name="Microcontroller Unit (MCU-V4 Compatible)", category="Electronics", current_price=102.0)
        db.add_all([prod_apex, prod_gt])

        for s in other_suppliers:
            p = Product(supplier_id=s.id, name=f"{s.category} Core Component", category=s.category, current_price=150.0)
            db.add(p)
        db.commit()

        # 6. Seed Deliveries for Apex Industrial Components (Demo Timeline Story)
        # Jan: 94% on-time, Mar: drop to 87%, Jun: drop to 76%
        now = datetime.utcnow()
        apex_deliveries = [
            # Jan
            Delivery(supplier_id=apex.id, purchase_order="PO-2026-0101", expected_date=now-timedelta(days=240), actual_date=now-timedelta(days=240), delay_days=0, reason="On-time delivery", severity="Low"),
            Delivery(supplier_id=apex.id, purchase_order="PO-2026-0102", expected_date=now-timedelta(days=230), actual_date=now-timedelta(days=230), delay_days=0, reason="On-time delivery", severity="Low"),
            # Mar
            Delivery(supplier_id=apex.id, purchase_order="PO-2026-0301", expected_date=now-timedelta(days=180), actual_date=now-timedelta(days=176), delay_days=4, reason="Port customs delay", severity="Medium"),
            # Jun
            Delivery(supplier_id=apex.id, purchase_order="PO-2026-0601", expected_date=now-timedelta(days=90), actual_date=now-timedelta(days=82), delay_days=8, reason="Wafer fabrication backlog", severity="High"),
            Delivery(supplier_id=apex.id, purchase_order="PO-2026-0602", expected_date=now-timedelta(days=75), actual_date=now-timedelta(days=64), delay_days=11, reason="Logistics air freight route bottleneck", severity="Critical"),
            # Aug / Sep
            Delivery(supplier_id=apex.id, purchase_order="PO-2026-0801", expected_date=now-timedelta(days=30), actual_date=now-timedelta(days=16), delay_days=14, reason="Regional logistics disruption & labor shortage", severity="Critical")
        ]
        db.add_all(apex_deliveries)

        # Seed Deliveries for GlobalTech (Clean performance)
        gt_deliveries = [
            Delivery(supplier_id=globaltech.id, purchase_order=f"PO-GT-00{i}", expected_date=now-timedelta(days=30*i), actual_date=now-timedelta(days=30*i), delay_days=0, reason="On-time delivery", severity="Low")
            for i in range(1, 7)
        ]
        db.add_all(gt_deliveries)

        # Seed 40+ deliveries across other suppliers
        for s in other_suppliers:
            for i in range(1, 4):
                d_days = 0 if s.status == "Active" else (i * 3)
                d = Delivery(
                    supplier_id=s.id,
                    purchase_order=f"PO-{s.supplier_code}-{i}",
                    expected_date=now-timedelta(days=20*i),
                    actual_date=now-timedelta(days=20*i - d_days),
                    delay_days=d_days,
                    reason="Logistics schedule" if d_days > 0 else "On-time delivery",
                    severity="Low" if d_days == 0 else "Medium"
                )
                db.add(d)

        # 7. Seed Quality Incidents
        # Apex: Apr defect spike to 6.8%
        apex_quality = [
            QualityIncident(supplier_id=apex.id, product_id=prod_apex.id, defect_type="Solder Void Defect", defect_quantity=68, total_quantity=1000, defect_rate=6.8, severity="High", inspection_result="Failed", date=now-timedelta(days=150), notes="Microscopic voids in BGA soldering batch."),
            QualityIncident(supplier_id=apex.id, product_id=prod_apex.id, defect_type="Thermal Tolerance Variance", defect_quantity=45, total_quantity=1000, defect_rate=4.5, severity="High", inspection_result="Conditional", date=now-timedelta(days=45), notes="Sub-component thermal breakdown during stress test.")
        ]
        db.add_all(apex_quality)

        gt_quality = [
            QualityIncident(supplier_id=globaltech.id, product_id=prod_gt.id, defect_type="Minor Packaging Scratch", defect_quantity=18, total_quantity=1000, defect_rate=1.8, severity="Low", inspection_result="Passed", date=now-timedelta(days=60), notes="Packaging cosmetic scratch, chip functional.")
        ]
        db.add_all(gt_quality)

        for s in other_suppliers:
            q = QualityIncident(
                supplier_id=s.id,
                defect_type="Dimensional Tolerance Variance",
                defect_quantity=15 if s.status == "Active" else 55,
                total_quantity=1000,
                defect_rate=1.5 if s.status == "Active" else 5.5,
                severity="Low" if s.status == "Active" else "High",
                inspection_result="Passed" if s.status == "Active" else "Failed",
                date=now-timedelta(days=40)
            )
            db.add(q)

        # 8. Seed Price History
        # Apex: May price increase 8%, July price increase 12%
        apex_prices = [
            PriceHistory(supplier_id=apex.id, product_id=prod_apex.id, previous_price=100.0, new_price=108.0, change_percentage=8.0, effective_date=now-timedelta(days=120), reason="Raw wafer cost increase"),
            PriceHistory(supplier_id=apex.id, product_id=prod_apex.id, previous_price=108.0, new_price=121.0, change_percentage=12.0, effective_date=now-timedelta(days=60), reason="Freight surcharge and energy rate increase")
        ]
        db.add_all(apex_prices)

        gt_prices = [
            PriceHistory(supplier_id=globaltech.id, product_id=prod_gt.id, previous_price=100.0, new_price=102.0, change_percentage=2.0, effective_date=now-timedelta(days=90), reason="Annual index adjustment")
        ]
        db.add_all(gt_prices)

        for s in other_suppliers:
            ph = PriceHistory(
                supplier_id=s.id,
                previous_price=140.0,
                new_price=144.2,
                change_percentage=3.0,
                effective_date=now-timedelta(days=70),
                reason="Standard annual inflation step"
            )
            db.add(ph)

        # 9. Seed News Articles (30+ records)
        news_items = [
            NewsArticle(supplier_id=apex.id, title="Logistics Disruption and Customs Backlog Reported in Hsinchu Corridor", source="Global Supply Chain Wire", published_at=now-timedelta(days=40), category="Logistics disruption", sentiment="Risk", risk_score=78.0, summary="Major air freight route congestion impacting electronic component shipments out of Taiwan."),
            NewsArticle(supplier_id=apex.id, title="Semiconductor Packaging Facility In Hsinchu Undergoes Unscheduled Maintenance", source="Tech Manufacturing Daily", published_at=now-timedelta(days=20), category="Factory shutdown", sentiment="Critical", risk_score=88.0, summary="Unplanned power outage forces temporary halt of Tier-1 MCU packaging lines."),
            NewsArticle(supplier_id=globaltech.id, title="GlobalTech Incheon Facility Expands ISO 9001 Cleanroom Operations", source="Electronics Trade Journal", published_at=now-timedelta(days=15), category="Logistics disruption", sentiment="Positive", risk_score=15.0, summary="New automated assembly lines boost monthly production capacity by 35%.")
        ]
        db.add_all(news_items)

        for s in other_suppliers:
            n = NewsArticle(
                supplier_id=s.id,
                title=f"Industry Market Update: {s.category} Trends and Regional Outlook in {s.country}",
                source="Trade Sentinel News",
                published_at=now-timedelta(days=10),
                category="Logistics disruption",
                sentiment="Neutral" if s.status == "Active" else "Risk",
                risk_score=35.0 if s.status == "Active" else 65.0,
                summary=f"Market summary covering operational trends across {s.country} manufacturing hubs."
            )
            db.add(n)

        # 10. Seed Risk Scores & Predictions
        db.commit()

        # Risk score for Apex
        apex_risk = RiskScore(
            supplier_id=apex.id,
            score=78.0,
            risk_level="CRITICAL",
            delivery_score=85.0,
            quality_score=75.0,
            price_score=80.0,
            historical_score=70.0,
            news_score=80.0,
            explanation="Risk Score 78.0 (CRITICAL). Primary drivers: Severe delivery delays (14 days avg), quality defect rate (6.8%), and cumulative price escalation (+20%).",
            calculated_at=now
        )
        db.add(apex_risk)

        apex_pred = Prediction(
            supplier_id=apex.id,
            disruption_probability=72.0,
            confidence=84.0,
            prediction_horizon="30 days",
            model_type="Random Forest Machine Learning Model (Scikit-Learn)",
            explanation="Supplier Apex Industrial Components has a predicted 72% disruption probability over the next 30 days due to compound delivery and quality signals.",
            evidence="14-day delay on PO-2026-0801 | 6.8% defect rate on MCU-V4 | Hsinchu logistics news signal | +20% price creep",
            created_at=now
        )
        db.add(apex_pred)

        # Risk score for GlobalTech
        gt_risk = RiskScore(
            supplier_id=globaltech.id,
            score=18.0,
            risk_level="LOW",
            delivery_score=10.0,
            quality_score=15.0,
            price_score=15.0,
            historical_score=10.0,
            news_score=15.0,
            explanation="Risk Score 18.0 (LOW). Excellent operational reliability across all vectors.",
            calculated_at=now
        )
        db.add(gt_risk)

        for s in other_suppliers:
            score_val = 22.0 if s.status == "Active" else 68.0
            r = RiskScore(
                supplier_id=s.id,
                score=score_val,
                risk_level="LOW" if score_val < 25 else ("MEDIUM" if score_val < 50 else "HIGH"),
                delivery_score=score_val,
                quality_score=score_val,
                price_score=20.0,
                historical_score=20.0,
                news_score=20.0,
                explanation=f"Calculated risk score {score_val} for {s.name}.",
                calculated_at=now
            )
            db.add(r)

        # 11. Seed Alerts
        apex_alert = Alert(
            supplier_id=apex.id,
            type="Risk Spike",
            severity="Critical",
            message="CRITICAL: Apex Industrial Components risk increased from 42 to 78. Main cause: Delivery reliability deterioration and quality defect spike.",
            status="Active",
            created_at=now-timedelta(hours=4)
        )
        db.add(apex_alert)

        for s in other_suppliers:
            if s.status == "High Risk":
                a = Alert(
                    supplier_id=s.id,
                    type="Delivery Drop",
                    severity="High",
                    message=f"High risk alert triggered for {s.name}: Extended lead time delay reported.",
                    status="Active",
                    created_at=now-timedelta(days=2)
                )
                db.add(a)

        db.commit()
        logger.info("Successfully seeded all realistic demo data for Supplier Risk Radar!")

    except Exception as e:
        logger.error(f"Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
