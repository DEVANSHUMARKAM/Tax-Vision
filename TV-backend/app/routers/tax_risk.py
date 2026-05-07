from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
import json

router = APIRouter()

@router.get("/{ward_no}")
def get_tax_risk(ward_no: int, db: Session = Depends(get_db)):
    """
    Module 2 — Tax Default Risk.
    Returns properties with risk_score > 0.60 as GeoJSON.
    """
    rows = db.execute(text("""
        SELECT
            t.upin,
            t.owner_name,
            t.locality,
            t.property_type,
            t.tax_status,
            t.risk_score,
            t.base_tax_amount,
            t.due_amount,
            t.payment_history,
            t.last_payment_date,
            b.ai_area_sqft,
            ST_AsGeoJSON(b.geometry) AS geom_json
        FROM tax_records t
        JOIN buildings b ON t.plus_code = b.full_plus_code
        WHERE t.ward_no    = :w
          AND t.risk_score > 0.60
        ORDER BY t.risk_score DESC
    """), {"w": ward_no}).fetchall()

    features = []
    for r in rows:
        history = json.loads(r.payment_history or "[]")
        features.append({
            "type": "Feature",
            "geometry": json.loads(r.geom_json),
            "properties": {
                "upin":              r.upin,
                "owner_name":        r.owner_name,
                "locality":          r.locality,
                "property_type":     r.property_type,
                "tax_status":        r.tax_status,
                "risk_score":        round(r.risk_score, 3),
                "risk_pct":          round(r.risk_score * 100, 1),
                "base_tax_amount":   round(r.base_tax_amount, 2),
                "due_amount":        round(r.due_amount, 2),
                "last_payment_date": str(r.last_payment_date),
                "default_count":     history.count("defaulted"),
                "history":           history,
                "flag_type":         "tax_risk",
                "audit_color":       "yellow",
                "predicted_default": str(r.last_payment_date),
            }
        })

    return JSONResponse({
        "type":     "FeatureCollection",
        "ward_no":  ward_no,
        "count":    len(features),
        "features": features
    })


@router.get("/summary/{ward_no}")
def get_risk_summary(ward_no: int, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE risk_score > 0.75)  AS high_risk,
            COUNT(*) FILTER (WHERE risk_score BETWEEN 0.50 AND 0.75) AS medium_risk,
            COUNT(*) FILTER (WHERE risk_score < 0.50)  AS low_risk,
            COALESCE(SUM(due_amount) FILTER (WHERE risk_score > 0.75), 0) AS high_risk_revenue
        FROM tax_records
        WHERE ward_no = :w
    """), {"w": ward_no}).fetchone()

    return {
        "high_risk":          row.high_risk,
        "medium_risk":        row.medium_risk,
        "low_risk":           row.low_risk,
        "high_risk_revenue":  float(row.high_risk_revenue)
    }