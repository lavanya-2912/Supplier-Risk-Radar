from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.database import engine, Base
from app.routers import (
    auth, suppliers, deliveries, quality, prices, risk,
    prediction, news, hindsight, alternatives, copilot,
    alerts, reports, health, settings
)
from app.scripts.seed import seed_demo_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("supplier_risk_radar")

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Supplier Risk Radar API",
    description="Predict disruption. Protect your supply chain. Enterprise procurement intelligence platform powered by FastAPI, Scikit-learn, and Hindsight Cloud persistent memory.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins in dev mode
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(suppliers.router)
app.include_router(deliveries.router)
app.include_router(quality.router)
app.include_router(prices.router)
app.include_router(risk.router)
app.include_router(prediction.router)
app.include_router(news.router)
app.include_router(hindsight.router)
app.include_router(alternatives.router)
app.include_router(copilot.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(health.router)
app.include_router(settings.router)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Supplier Risk Radar Backend...")
    # Seed default realistic fictional demo data if database is empty
    seed_demo_data()

@app.get("/")
def root():
    return {
        "app": "Supplier Risk Radar",
        "tagline": "Predict disruption. Protect your supply chain.",
        "status": "ONLINE",
        "docs": "/docs"
    }
