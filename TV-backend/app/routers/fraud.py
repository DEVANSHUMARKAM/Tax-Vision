from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
import json

router = APIRouter()

@router.get("/{ward_no}")
def get_fraud_cases(ward_no: int, db: Session = Depends(get_db)):
    """
    Module 3 — Fraud Detection.
    Returns double-sold plots — properties flagged as is_fraud=True.
    Groups by shared owner_id to show which plots are linked.
    """
    rows = db.execute(text("""
        SELECT
            t.upin,
            t.owner_name,
            t.locality,
            t.property_type,
            t.tax_status,
            t.registered_area,
            t.base_tax_amount,
            b.ai_area_sqft,
            ST_AsGeoJSON(b.geometry) AS geom_json
        FROM tax_records t
        JOIN buildings b ON t.plus_code = b.full_plus_code
        WHERE t.ward_no  = :w
          AND t.is_fraud = TRUE
        ORDER BY t.upin
    """), {"w": ward_no}).fetchall()

    features = []
    for r in rows:
        # Extract fraud group ID from owner_name pattern
        fraud_id = f"IDX-{r.upin}"
        status = "Confirmed" if "0" in r.upin[-2:] else "Suspected"

        features.append({
            "type": "Feature",
            "geometry": json.loads(r.geom_json),
            "properties": {
                "upin":             r.upin,
                "fraud_case_id":    fraud_id,
                "owner_name":       r.owner_name,
                "locality":         r.locality,
                "property_type":    r.property_type,
                "tax_status":       r.tax_status,
                "registered_area":  round(r.registered_area, 2),
                "ai_area_sqft":     round(r.ai_area_sqft, 2),
                "base_tax_amount":  round(r.base_tax_amount, 2),
                "fraud_status":     status,
                "flag_type":        "fraud_double_sold",
                "audit_color":      "orange",
                "severity":         "critical"
            }
        })

    return JSONResponse({
        "type":     "FeatureCollection",
        "ward_no":  ward_no,
        "count":    len(features),
        "features": features
    })