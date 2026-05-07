from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
import json

router = APIRouter()

NDVI_THRESHOLD = 0.30

def ndvi_tier(ndvi: float):
    if ndvi >= 0.70:
        return {"label": "Dense",    "discount": 20.0}
    elif ndvi >= 0.50:
        return {"label": "Moderate", "discount": 15.0}
    elif ndvi >= 0.30:
        return {"label": "Sparse",   "discount": 10.0}
    return {"label": "None", "discount": 0.0}


@router.get("/{ward_no}")
def get_green_rewards(ward_no: int, db: Session = Depends(get_db)):
    """
    Module 4 — Green Reward System.
    Properties where NDVI > 0.30 AND tax_status = paid
    get a water bill / tax discount.
    """
    rows = db.execute(text("""
        SELECT
            t.upin,
            t.owner_name,
            t.locality,
            t.property_type,
            t.tax_status,
            t.ndvi_score,
            t.base_tax_amount,
            t.discount_pct,
            t.registered_area,
            b.ai_area_sqft,
            ST_AsGeoJSON(b.geometry) AS geom_json
        FROM tax_records t
        JOIN buildings b ON t.plus_code = b.full_plus_code
        WHERE t.ward_no    = :w
          AND t.tax_status = 'paid'
          AND t.ndvi_score > :threshold
        ORDER BY t.ndvi_score DESC
    """), {"w": ward_no, "threshold": NDVI_THRESHOLD}).fetchall()

    features = []
    for r in rows:
        tier        = ndvi_tier(float(r.ndvi_score))
        base_bill   = round(r.base_tax_amount, 2)
        discount_amt= round(base_bill * tier["discount"] / 100, 2)
        final_bill  = round(base_bill - discount_amt, 2)

        features.append({
            "type": "Feature",
            "geometry": json.loads(r.geom_json),
            "properties": {
                "upin":          r.upin,
                "owner_name":    r.owner_name,
                "locality":      r.locality,
                "property_type": r.property_type,
                "tax_status":    r.tax_status,
                "ndvi_score":    round(r.ndvi_score, 3),
                "ndvi_pct":      round(r.ndvi_score * 100, 1),
                "ndvi_label":    tier["label"],
                "base_bill":     base_bill,
                "discount_pct":  tier["discount"],
                "discount_amt":  discount_amt,
                "final_bill":    final_bill,
                "flag_type":     "green_reward",
                "audit_color":   "green",
                "eligible":      True
            }
        })

    return JSONResponse({
        "type":     "FeatureCollection",
        "ward_no":  ward_no,
        "count":    len(features),
        "features": features
    })


@router.get("/summary/{ward_no}")
def get_green_summary(ward_no: int, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT
            COUNT(*) FILTER (
                WHERE tax_status='paid' AND ndvi_score >= 0.70
            ) AS dense,
            COUNT(*) FILTER (
                WHERE tax_status='paid' AND ndvi_score BETWEEN 0.50 AND 0.70
            ) AS moderate,
            COUNT(*) FILTER (
                WHERE tax_status='paid' AND ndvi_score BETWEEN 0.30 AND 0.50
            ) AS sparse,
            ROUND(AVG(ndvi_score)::numeric, 3) AS avg_ndvi,
            COALESCE(SUM(base_tax_amount * discount_pct / 100)
                FILTER (WHERE tax_status='paid' AND ndvi_score > 0.30), 0
            ) AS total_savings
        FROM tax_records
        WHERE ward_no = :w
    """), {"w": ward_no}).fetchone()

    return {
        "dense_count":    row.dense,
        "moderate_count": row.moderate,
        "sparse_count":   row.sparse,
        "avg_ndvi":       float(row.avg_ndvi or 0),
        "total_savings":  float(row.total_savings or 0)
    }