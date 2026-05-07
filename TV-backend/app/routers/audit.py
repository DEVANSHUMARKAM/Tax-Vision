from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
import json

from app.tax_calculator import (
    get_tax_breakdown, calculate_revenue_loss,
    USAGE_FACTOR, STRUCTURE_FACTOR, AGE_FACTOR, OCCUPANCY_FACTOR
)

router = APIRouter()

MISMATCH_THRESHOLD = 20.0  # % above which a property is flagged illegal


@router.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    """All 10 NMC zones — for the Zone selector dropdown."""
    rows = db.execute(text(
        "SELECT zone_no, zone_name, zone_name_marathi FROM zones ORDER BY zone_no"
    )).fetchall()
    return [
        {
            "zone_no":           r.zone_no,
            "zone_name":         r.zone_name,
            "zone_name_marathi": r.zone_name_marathi
        }
        for r in rows
    ]


@router.get("/zones/{zone_no}/wards")
def get_wards(zone_no: int, db: Session = Depends(get_db)):
    """Wards for a given zone — for the Ward selector dropdown."""
    rows = db.execute(text(
        "SELECT ward_no, ward_name FROM wards WHERE zone_no = :z ORDER BY ward_no"
    ), {"z": zone_no}).fetchall()
    return [{"ward_no": r.ward_no, "ward_name": r.ward_name} for r in rows]


@router.get("/wards/{ward_no}/localities")
def get_localities(ward_no: int, db: Session = Depends(get_db)):
    """Localities for a given ward."""
    rows = db.execute(text(
        "SELECT locality_name FROM localities WHERE ward_no = :w ORDER BY locality_name"
    ), {"w": ward_no}).fetchall()
    return [r.locality_name for r in rows]


@router.get("/summary/{ward_no}")
def get_summary(ward_no: int, db: Session = Depends(get_db)):
    """
    Dashboard summary stats for a ward.
    Matches the cards in your mockup:
    Total Properties, Flagged Deviations, High-Risk, Fraud Cases,
    Green Bonus, Tax Collection Rate, Revenue at Risk.
    """
    row = db.execute(text("""
        SELECT
            COUNT(*)                                            AS total,
            COUNT(*) FILTER (WHERE t.mismatch_pct > 20)        AS illegal_count,
            COUNT(*) FILTER (WHERE t.risk_score > 0.60)        AS high_risk_count,
            COUNT(*) FILTER (WHERE t.is_fraud = TRUE)          AS fraud_count,
            COUNT(*) FILTER (
                WHERE t.ndvi_score > 0.30 AND t.tax_status = 'paid'
            )                                                   AS green_count,
            ROUND(AVG(t.mismatch_pct)::numeric, 2)             AS avg_mismatch,
            COALESCE(SUM(t.due_amount), 0)                     AS revenue_at_risk,
            ROUND(
                (COUNT(*) FILTER (WHERE t.tax_status = 'paid') * 100.0)
                / NULLIF(COUNT(*), 0), 1
            )                                                   AS collection_rate
        FROM tax_records t
        WHERE t.ward_no = :w
    """), {"w": ward_no}).fetchone()

    return {
        "ward_no":               ward_no,
        "total_properties":      row.total,
        "flagged_deviations":    row.illegal_count,
        "high_risk_count":       row.high_risk_count,
        "fraud_count":           row.fraud_count,
        "green_reward_count":    row.green_count,
        "avg_mismatch_pct":      float(row.avg_mismatch or 0),
        "revenue_at_risk":       float(row.revenue_at_risk or 0),
        "tax_collection_rate":   float(row.collection_rate or 0),
        "estimated_revenue_loss": float(row.revenue_at_risk or 0) * 1.3
    }


@router.get("/flagged/{ward_no}")
def get_flagged_geojson(ward_no: int, db: Session = Depends(get_db)):
    """
    Module 1 — Spatial Audit.
    Returns GeoJSON FeatureCollection of all properties where
    satellite area > registered area by more than 20%.
    Each feature is colored red/yellow/green for the map.
    """
    rows = db.execute(text("""
        SELECT
            t.upin,
            t.owner_name,
            t.locality,
            t.property_type,
            t.registered_area,
            t.tax_status,
            t.mismatch_pct,
            t.risk_score,
            t.ndvi_score,
            t.discount_pct,
            t.is_fraud,
            t.base_tax_amount,
            t.due_amount,
            b.ai_area_sqft,
            b.centroid_lat,
            b.centroid_lon,
            ST_AsGeoJSON(b.geometry) AS geom_json
        FROM tax_records t
        JOIN buildings b ON t.plus_code = b.full_plus_code
        WHERE t.ward_no   = :w
          AND t.mismatch_pct > :threshold
        ORDER BY t.mismatch_pct DESC
    """), {"w": ward_no, "threshold": MISMATCH_THRESHOLD}).fetchall()

    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "geometry": json.loads(r.geom_json),
            "properties": {
                "upin":             r.upin,
                "owner_name":       r.owner_name,
                "locality":         r.locality,
                "property_type":    r.property_type,
                "registered_area":  round(r.registered_area, 2),
                "ai_area_sqft":     round(r.ai_area_sqft, 2),
                "mismatch_pct":     round(r.mismatch_pct, 2),
                "tax_status":       r.tax_status,
                "risk_score":       round(r.risk_score, 3),
                "ndvi_score":       round(r.ndvi_score, 3),
                "discount_pct":     r.discount_pct,
                "is_fraud":         r.is_fraud,
                "base_tax_amount":  round(r.base_tax_amount, 2),
                "due_amount":       round(r.due_amount, 2),
                "flag_type":        "illegal_extension",
                "audit_color":      _color(r.mismatch_pct, r.tax_status, r.ndvi_score)
            }
        })

    return JSONResponse({
        "type":     "FeatureCollection",
        "ward_no":  ward_no,
        "count":    len(features),
        "features": features
    })


@router.get("/all/{ward_no}")
def get_all_buildings_geojson(ward_no: int, db: Session = Depends(get_db)):
    """
    Returns ALL buildings for a ward as GeoJSON —
    colored by their audit status for the base map layer.
    """
    rows = db.execute(text("""
        SELECT
            t.upin,
            t.owner_name,
            t.locality,
            t.property_type,
            t.registered_area,
            t.tax_status,
            t.mismatch_pct,
            t.risk_score,
            t.ndvi_score,
            t.discount_pct,
            t.is_fraud,
            t.base_tax_amount,
            t.due_amount,
            b.ai_area_sqft,
            ST_AsGeoJSON(b.geometry) AS geom_json
        FROM tax_records t
        JOIN buildings b ON t.plus_code = b.full_plus_code
        WHERE t.ward_no = :w
    """), {"w": ward_no}).fetchall()

    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "geometry": json.loads(r.geom_json),
            "properties": {
                "upin":            r.upin,
                "owner_name":      r.owner_name,
                "locality":        r.locality,
                "property_type":   r.property_type,
                "registered_area": round(r.registered_area, 2),
                "ai_area_sqft":    round(r.ai_area_sqft, 2),
                "mismatch_pct":    round(r.mismatch_pct, 2),
                "tax_status":      r.tax_status,
                "risk_score":      round(r.risk_score, 3),
                "ndvi_score":      round(r.ndvi_score, 3),
                "is_fraud":        r.is_fraud,
                "due_amount":      round(r.due_amount, 2),
                "flag_type":       _flag_type(r.mismatch_pct, r.risk_score, r.ndvi_score, r.tax_status, r.is_fraud),
                "audit_color":     _color(r.mismatch_pct, r.tax_status, r.ndvi_score)
            }
        })

    return JSONResponse({
        "type":     "FeatureCollection",
        "ward_no":  ward_no,
        "count":    len(features),
        "features": features
    })


def _color(mismatch_pct: float, tax_status: str, ndvi_score: float) -> str:
    """
    Red    → illegal extension (mismatch > 20%)
    Orange → fraud
    Yellow → tax default risk
    Green  → green reward eligible
    Blue   → clean / normal
    """
    if mismatch_pct > 20:
        return "red"
    elif tax_status == "defaulted":
        return "yellow"
    elif ndvi_score > 0.30 and tax_status == "paid":
        return "green"
    else:
        return "blue"


def _flag_type(mismatch_pct, risk_score, ndvi_score, tax_status, is_fraud) -> str:
    if is_fraud:
        return "fraud"
    if mismatch_pct > 20:
        return "illegal_extension"
    if risk_score > 0.60:
        return "tax_risk"
    if ndvi_score > 0.30 and tax_status == "paid":
        return "green_reward"
    return "clean"     

@router.get("/search/{upin}")
def search_by_upin(upin: str, db: Session = Depends(get_db)):
    """
    Search property by UPIN / Index Number.
    Returns full property details + geometry for map centering.
    """
    row = db.execute(text("""
        SELECT
            t.upin,
            t.owner_name,
            t.owner_aadhaar,
            t.locality,
            t.property_type,
            t.registered_area,
            t.floor_count,
            t.tax_status,
            t.base_tax_amount,
            t.due_amount,
            t.last_payment_date,
            t.payment_history,
            t.mismatch_pct,
            t.risk_score,
            t.ndvi_score,
            t.discount_pct,
            t.is_flagged,
            t.is_fraud,
            t.ward_no,
            t.zone_no,
            t.locality,
            b.ai_area_sqft,
            b.centroid_lat,
            b.centroid_lon,
            ST_AsGeoJSON(b.geometry) AS geom_json
        FROM tax_records t
        JOIN buildings b ON t.plus_code = b.full_plus_code
        WHERE UPPER(t.upin) = UPPER(:upin)
    """), {"upin": upin.strip()}).fetchone()

    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Property '{upin}' not found")

    import json
    history = json.loads(row.payment_history or "[]")

    return {
        "found": True,
        "upin":              row.upin,
        "owner_name":        row.owner_name,
        "owner_aadhaar":     row.owner_aadhaar,
        "locality":          row.locality,
        "property_type":     row.property_type,
        "ward_no":           row.ward_no,
        "zone_no":           row.zone_no,
        "registered_area":   round(row.registered_area, 2),
        "ai_area_sqft":      round(row.ai_area_sqft, 2),
        "floor_count":       row.floor_count,
        "tax_status":        row.tax_status,
        "base_tax_amount":   round(row.base_tax_amount, 2),
        "due_amount":        round(row.due_amount, 2),
        "last_payment_date": str(row.last_payment_date),
        "payment_history":   history,
        "mismatch_pct":      round(row.mismatch_pct, 2),
        "risk_score":        round(row.risk_score, 3),
        "ndvi_score":        round(row.ndvi_score, 3),
        "discount_pct":      row.discount_pct,
        "is_flagged":        row.is_flagged,
        "is_fraud":          row.is_fraud,
        "centroid_lat":      row.centroid_lat,
        "centroid_lon":      row.centroid_lon,
        "geometry":          json.loads(row.geom_json),
        "flag_type":         _flag_type(
                                row.mismatch_pct, row.risk_score,
                                row.ndvi_score, row.tax_status, row.is_fraud
                             ),
        "audit_color":       _color(row.mismatch_pct, row.tax_status, row.ndvi_score)
    }

@router.get("/tax-breakdown/{upin}")
def get_tax_breakdown_for_property(
    upin:      str,
    structure: str = "RCC",
    age_band:  str = "10-20",
    occupancy: str = "self",
    db: Session = Depends(get_db)
):
    """
    Returns full ALV-based tax breakdown for a property.
    Uses real NMC Unit Area System formula.
    """
    row = db.execute(text("""
        SELECT
            t.upin, t.owner_name, t.locality,
            t.property_type, t.registered_area,
            t.tax_status, t.due_amount,
            b.ai_area_sqft
        FROM tax_records t
        JOIN buildings b ON t.plus_code = b.full_plus_code
        WHERE UPPER(t.upin) = UPPER(:upin)
    """), {"upin": upin}).fetchone()

    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Property not found")

    # Registered area breakdown
    registered = get_tax_breakdown(
        area_sqft  = row.registered_area,
        locality   = row.locality or "default",
        usage      = row.property_type or "Residential",
        structure  = structure,
        age_band   = age_band,
        occupancy  = occupancy,
    )

    # Actual (satellite) area breakdown
    actual = get_tax_breakdown(
        area_sqft  = row.ai_area_sqft,
        locality   = row.locality or "default",
        usage      = row.property_type or "Residential",
        structure  = structure,
        age_band   = age_band,
        occupancy  = occupancy,
    )

    # Revenue loss
    loss = calculate_revenue_loss(
        registered_sqft = row.registered_area,
        actual_sqft     = row.ai_area_sqft,
        locality        = row.locality or "default",
        usage           = row.property_type or "Residential",
        structure       = structure,
        age_band        = age_band,
    )

    return {
        "upin":             row.upin,
        "owner_name":       row.owner_name,
        "locality":         row.locality,
        "property_type":    row.property_type,
        "tax_status":       row.tax_status,
        "registered_breakdown": registered,
        "actual_breakdown":     actual,
        "revenue_loss":         loss,
        "parameters_used": {
            "structure": structure,
            "age_band":  age_band,
            "occupancy": occupancy,
        }
    }


@router.get("/tax-parameters")
def get_tax_parameters():
    """Returns all valid input parameters for the tax calculator."""
    return {
        "usage_factors":     list(USAGE_FACTOR.keys()),
        "structure_factors": list(STRUCTURE_FACTOR.keys()),
        "age_bands":         list(AGE_FACTOR.keys()),
        "occupancy_types":   list(OCCUPANCY_FACTOR.keys()),
    }