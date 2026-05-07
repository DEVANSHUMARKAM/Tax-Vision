from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import audit, tax_risk, fraud, green_reward

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart City Urban Audit API",
    description="NMC Nagpur — GIS + AI Property Governance System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit.router,        prefix="/api/audit",   tags=["Spatial Audit"])
app.include_router(tax_risk.router,     prefix="/api/risk",    tags=["Tax Risk"])
app.include_router(fraud.router,        prefix="/api/fraud",   tags=["Fraud Detection"])
app.include_router(green_reward.router, prefix="/api/green",   tags=["Green Reward"])


@app.get("/")
def root():
    return {
        "system":  "Smart City Urban Audit",
        "city":    "Nagpur Municipal Corporation",
        "status":  "online",
        "version": "1.0.0"
    }


@app.get("/api/health")
def health():
    from sqlalchemy import text
    from app.database import engine
    with engine.connect() as conn:
        building_count = conn.execute(
            text("SELECT COUNT(*) FROM buildings")).scalar()
        tax_count = conn.execute(
            text("SELECT COUNT(*) FROM tax_records")).scalar()
    return {
        "status":           "healthy",
        "buildings_loaded": building_count,
        "tax_records":      tax_count,
        "postgis":          "active"
    }