from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.supplier import Supplier
from app.models.news import NewsArticle
from app.models.alert import Alert
from app.schemas.news import NewsArticleCreate, NewsArticleResponse, NewsSyncRequest
from app.services.news_service import news_service
from app.services.hindsight_service import hindsight_service
from app.services.risk_service import risk_service

router = APIRouter(tags=["News Intelligence"])

@router.get("/api/suppliers/{supplier_id}/news", response_model=List[NewsArticleResponse])
def get_supplier_news(supplier_id: int, db: Session = Depends(get_db)):
    return db.query(NewsArticle).filter(NewsArticle.supplier_id == supplier_id).order_by(NewsArticle.published_at.desc()).all()

@router.get("/api/news/all", response_model=List[NewsArticleResponse])
def get_all_news(db: Session = Depends(get_db)):
    return db.query(NewsArticle).order_by(NewsArticle.published_at.desc()).all()

@router.post("/api/suppliers/{supplier_id}/news", response_model=NewsArticleResponse, status_code=status.HTTP_201_CREATED)
async def add_manual_news(supplier_id: int, news_in: NewsArticleCreate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    classification = news_service.classify_news_risk(news_in.title, news_in.summary or "")

    article = NewsArticle(
        supplier_id=supplier_id,
        title=news_in.title,
        source=news_in.source or "Manual Intelligence Entry",
        url=news_in.url,
        published_at=news_in.published_at or datetime.utcnow(),
        category=news_in.category or classification["category"],
        sentiment=news_in.sentiment or classification["sentiment"],
        risk_score=news_in.risk_score or classification["risk_score"],
        summary=news_in.summary
    )
    db.add(article)
    db.commit()
    db.refresh(article)

    # Hindsight Memory Retain
    await hindsight_service.retain(
        supplier_id=supplier.id,
        supplier_name=supplier.name,
        event_type="External News Signal",
        content=f"Title: {article.title} | Category: {article.category} | Sentiment: {article.sentiment} | Risk Index: {article.risk_score}",
        metadata={"category": article.category, "sentiment": article.sentiment, "risk_score": article.risk_score}
    )

    # Recalculate risk score
    await risk_service.calculate_supplier_risk(db, supplier.id)

    return article

@router.post("/api/news/sync")
async def sync_news_signals(req: NewsSyncRequest, db: Session = Depends(get_db)):
    query = db.query(Supplier)
    if req.supplier_id:
        query = query.filter(Supplier.id == req.supplier_id)
    suppliers = query.all()

    synced_count = 0
    for s in suppliers:
        news_items = await news_service.fetch_news_for_supplier(s.name, s.country, s.category)
        for item in news_items:
            existing = db.query(NewsArticle).filter(
                NewsArticle.supplier_id == s.id,
                NewsArticle.title == item["title"]
            ).first()
            if not existing:
                art = NewsArticle(
                    supplier_id=s.id,
                    title=item["title"],
                    source=item["source"],
                    url=item["url"],
                    published_at=datetime.utcnow(),
                    category=item["category"],
                    sentiment=item["sentiment"],
                    risk_score=item["risk_score"],
                    summary=item["summary"]
                )
                db.add(art)
                synced_count += 1
                
                # Retain in Hindsight
                await hindsight_service.retain(
                    supplier_id=s.id,
                    supplier_name=s.name,
                    event_type="News Signal",
                    content=f"{item['title']} - {item['summary']}",
                    metadata={"risk_score": item["risk_score"]}
                )

                if item["sentiment"] in ["Risk", "Critical"]:
                    alert = Alert(
                        supplier_id=s.id,
                        type="News Signal",
                        severity="High" if item["sentiment"] == "Risk" else "Critical",
                        message=f"External Risk News Signal: {item['title']}",
                        status="Active"
                    )
                    db.add(alert)
        db.commit()
        await risk_service.calculate_supplier_risk(db, s.id)

    return {"message": f"Successfully synchronized news signals for {len(suppliers)} supplier(s)", "synced_articles_count": synced_count}
