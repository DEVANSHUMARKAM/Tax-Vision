from sqlalchemy import (
    Column, Integer, String, Float, 
    Boolean, Text, Date, ForeignKey
)
from geoalchemy2 import Geometry
from .database import Base


class Zone(Base):
    """
    NMC has 10 official zones.
    e.g. Zone 1: Laxmi Nagar, Zone 3: Hanuman Nagar
    """
    __tablename__ = "zones"

    id        = Column(Integer, primary_key=True)
    zone_no   = Column(Integer, unique=True, nullable=False)   # 1–10
    zone_name = Column(String(100), nullable=False)            # "Hanuman Nagar"
    zone_name_marathi = Column(String(100))                    # "हनुमान नगर"


class Ward(Base):
    """
    Each zone has 3–4 wards (prabhag).
    e.g. Zone 3 → Ward 29, 31, 32, 34
    """
    __tablename__ = "wards"

    id        = Column(Integer, primary_key=True)
    ward_no   = Column(Integer, unique=True, nullable=False)   # 1–38
    zone_no   = Column(Integer, ForeignKey("zones.zone_no"))
    ward_name = Column(String(100))                            # "Hanuman Nagar Ward"


class Locality(Base):
    """
    Each ward covers multiple named localities.
    e.g. Ward 31 → Hanuman Nagar, Chandan Nagar, Reshimbag...
    Sourced directly from the NMC Zone-Ward PDF.
    """
    __tablename__ = "localities"

    id            = Column(Integer, primary_key=True)
    ward_no       = Column(Integer, ForeignKey("wards.ward_no"))
    locality_name = Column(String(150), nullable=False)


class Building(Base):
    """
    One row per building footprint from Google Open Buildings.
    Scoped to your chosen ward for Phase 1.
    """
    __tablename__ = "buildings"

    id             = Column(Integer, primary_key=True, index=True)
    full_plus_code = Column(String(30), unique=True, index=True)
    geometry       = Column(Geometry("POLYGON", srid=4326))   # WGS84
    ai_area_sqft   = Column(Float)                            # Satellite truth area
    centroid_lat   = Column(Float)
    centroid_lon   = Column(Float)
    ward_no        = Column(Integer, ForeignKey("wards.ward_no"))
    zone_no        = Column(Integer, ForeignKey("zones.zone_no"))


class TaxRecord(Base):
    """
    One row per registered property.
    UPIN = NMC's unique property index number (like NMC-HN-4421).
    Links to a building footprint via plus_code.
    """
    __tablename__ = "tax_records"

    id              = Column(Integer, primary_key=True)
    upin            = Column(String(30), unique=True, index=True)  # NMC-HN-4421
    plus_code       = Column(String(30), ForeignKey("buildings.full_plus_code"))
    ward_no         = Column(Integer, ForeignKey("wards.ward_no"))
    zone_no         = Column(Integer, ForeignKey("zones.zone_no"))
    locality        = Column(String(150))       # "Hanuman Nagar"

    # Owner details
    owner_name      = Column(String(150))
    owner_aadhaar   = Column(String(20))        # Masked: XXXX-XXXX-1234 (for fraud detection)

    # Property details
    property_type   = Column(String(30))        # "Residential" | "Commercial" | "Mixed"
    registered_area = Column(Float)             # Sq ft as per NMC records
    floor_count     = Column(Integer, default=1)

    # Tax details
    tax_status      = Column(String(20))        # "paid" | "defaulted" | "pending"
    base_tax_amount = Column(Float)             # Annual tax in ₹
    due_amount      = Column(Float)             # Outstanding dues in ₹
    last_payment_date = Column(Date)
    payment_history = Column(Text)              # JSON: ["paid","paid","defaulted","paid","paid"]

    # Flags (computed by audit modules, stored for caching)
    mismatch_pct    = Column(Float, default=0.0)
    risk_score      = Column(Float, default=0.0)
    ndvi_score      = Column(Float, default=0.0)
    is_flagged      = Column(Boolean, default=False)
    is_fraud        = Column(Boolean, default=False)
    discount_pct    = Column(Float, default=0.0)


class AuditLog(Base):
    """
    Immutable audit trail. Every time a module flags a property,
    a record is written here. Useful for the 'Detected On' column
    you see in your Change Detection mockup.
    """
    __tablename__ = "audit_logs"

    id          = Column(Integer, primary_key=True)
    upin        = Column(String(30), ForeignKey("tax_records.upin"), index=True)
    flag_type   = Column(String(40))    # "illegal_extension" | "tax_risk" | "fraud" | "green_reward"
    flag_status = Column(String(20))    # "flagged" | "under_review" | "resolved" | "cleared"
    detail      = Column(Text)          # JSON with module-specific data
    detected_on = Column(Date)
    resolved_on = Column(Date, nullable=True)