from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class ZoneOut(BaseModel):
    zone_no:   int
    zone_name: str
    zone_name_marathi: Optional[str]

    class Config:
        from_attributes = True


class WardOut(BaseModel):
    ward_no:   int
    zone_no:   int
    ward_name: str

    class Config:
        from_attributes = True


class LocalityOut(BaseModel):
    id:            int
    ward_no:       int
    locality_name: str

    class Config:
        from_attributes = True


class AuditSummary(BaseModel):
    total_properties:      int
    illegal_count:         int
    high_risk_count:       int
    fraud_count:           int
    green_reward_count:    int
    avg_mismatch_pct:      float
    estimated_revenue_loss: float
    tax_collection_rate:   float


class PropertyDetail(BaseModel):
    upin:             str
    owner_name:       str
    locality:         str
    property_type:    str
    registered_area:  float
    ai_area_sqft:     float
    mismatch_pct:     float
    tax_status:       str
    risk_score:       float
    ndvi_score:       float
    discount_pct:     float
    is_flagged:       bool
    is_fraud:         bool
    base_tax_amount:  float
    due_amount:       float