import io
import csv
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.models.delivery import Delivery
from app.models.quality import QualityIncident
from app.models.price import PriceHistory
from app.models.news import NewsArticle
from app.models.risk import RiskScore, Prediction
from app.services.hindsight_service import hindsight_service
from app.services.recommendation_service import recommendation_service

logger = logging.getLogger("report_service")

class ReportService:
    """
    Report generation service for downloading CSV and PDF Supplier Risk Intelligence Reports.
    """

    async def generate_csv_report(self, db: Session, supplier_ids: Optional[List[int]] = None) -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "Supplier Code", "Supplier Name", "Category", "Country", "Status",
            "Contract Value", "Lead Time (Days)", "Capacity", "Risk Score", "Risk Level",
            "On-Time Delivery %", "Defect Rate %", "Cumulative Price Change %",
            "Latest Disruption Probability", "Last Audit Date"
        ])

        query = db.query(Supplier)
        if supplier_ids:
            query = query.filter(Supplier.id.in_(supplier_ids))
        suppliers = query.all()

        for s in suppliers:
            deliveries = db.query(Delivery).filter(Delivery.supplier_id == s.id).all()
            quality = db.query(QualityIncident).filter(QualityIncident.supplier_id == s.id).all()
            prices = db.query(PriceHistory).filter(PriceHistory.supplier_id == s.id).all()
            risk = db.query(RiskScore).filter(RiskScore.supplier_id == s.id).order_by(RiskScore.calculated_at.desc()).first()
            pred = db.query(Prediction).filter(Prediction.supplier_id == s.id).order_by(Prediction.created_at.desc()).first()

            total_del = len(deliveries)
            delayed = sum(1 for d in deliveries if d.delay_days > 0)
            otd_pct = ((total_del - delayed) / total_del * 100.0) if total_del > 0 else 100.0

            total_qty = sum(q.total_quantity for q in quality if q.total_quantity > 0)
            defect_qty = sum(q.defect_quantity for q in quality)
            defect_rate = (defect_qty / total_qty * 100.0) if total_qty > 0 else 0.0

            price_change = sum(p.change_percentage for p in prices) if prices else 0.0

            writer.writerow([
                s.supplier_code or f"SUP-{s.id:03d}",
                s.name,
                s.category,
                s.country,
                s.status,
                s.contract_value,
                s.lead_time,
                s.capacity,
                risk.score if risk else 0.0,
                risk.risk_level if risk else "LOW",
                round(otd_pct, 1),
                round(defect_rate, 2),
                round(price_change, 1),
                pred.disruption_probability if pred else "N/A",
                datetime.utcnow().strftime("%Y-%m-%d")
            ])

        return output.getvalue()

    async def generate_pdf_report(self, db: Session, supplier_ids: Optional[List[int]] = None) -> bytes:
        """Generate PDF report using ReportLab."""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
            story = []

            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'DocTitle',
                parent=styles['Heading1'],
                fontSize=22,
                leading=26,
                textColor=colors.HexColor('#0F172A'),
                spaceAfter=6
            )
            subtitle_style = ParagraphStyle(
                'DocSubTitle',
                parent=styles['Normal'],
                fontSize=11,
                leading=14,
                textColor=colors.HexColor('#64748B'),
                spaceAfter=15
            )
            heading_style = ParagraphStyle(
                'SectionHeading',
                parent=styles['Heading2'],
                fontSize=14,
                leading=18,
                textColor=colors.HexColor('#1E293B'),
                spaceBefore=12,
                spaceAfter=8
            )
            body_style = ParagraphStyle(
                'BodyTextCustom',
                parent=styles['Normal'],
                fontSize=9,
                leading=12,
                textColor=colors.HexColor('#334155')
            )

            # Title
            story.append(Paragraph("SUPPLIER RISK RADAR — INTELLIGENCE REPORT", title_style))
            story.append(Paragraph(f"Executive Supply Chain Risk Assessment | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=15))

            query = db.query(Supplier)
            if supplier_ids:
                query = query.filter(Supplier.id.in_(supplier_ids))
            suppliers = query.all()

            for s in suppliers[:5]: # top 5 for PDF summary format
                risk = db.query(RiskScore).filter(RiskScore.supplier_id == s.id).order_by(RiskScore.calculated_at.desc()).first()
                pred = db.query(Prediction).filter(Prediction.supplier_id == s.id).order_by(Prediction.created_at.desc()).first()
                
                # Fetch Hindsight memories
                memories = await hindsight_service.recall(supplier_id=s.id, supplier_name=s.name, limit=3)
                
                risk_color = "#16A34A" if not risk or risk.score < 25 else ("#CA8A04" if risk.score < 50 else ("#EA580C" if risk.score < 75 else "#DC2626"))

                story.append(Paragraph(f"<b>Supplier: {s.name}</b> ({s.supplier_code or 'SUP-' + str(s.id)})", heading_style))
                
                details_text = f"Category: {s.category} | Country: {s.country} | Status: {s.status} | Contract: ${s.contract_value:,.2f}"
                story.append(Paragraph(details_text, body_style))
                story.append(Spacer(1, 4))

                # Table of Risk metrics
                data = [
                    ["Risk Score", "Risk Level", "Disruption Prob.", "Lead Time", "Capacity"],
                    [
                        f"{risk.score if risk else 0.0}/100",
                        risk.risk_level if risk else "LOW",
                        f"{pred.disruption_probability}%" if pred else "N/A",
                        f"{s.lead_time} Days",
                        s.capacity or "Medium"
                    ]
                ]

                t = Table(data, colWidths=[100, 100, 110, 100, 100])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ]))
                story.append(t)
                story.append(Spacer(1, 8))

                # Hindsight Memories subsection
                if memories:
                    story.append(Paragraph("<b>Hindsight Persistent AI Memory Context:</b>", body_style))
                    for mem in memories:
                        story.append(Paragraph(f"• [{mem['event_type']}] {mem['text'][:120]}...", body_style))
                    story.append(Spacer(1, 8))

                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=10))

            doc.build(story)
            return buffer.getvalue()
        except Exception as e:
            logger.error(f"Failed to generate PDF report: {e}")
            # Text PDF fallback bytes
            return f"SUPPLIER RISK RADAR REPORT\nGenerated: {datetime.utcnow()}\nError rendering graphical PDF: {e}".encode("utf-8")

report_service = ReportService()
