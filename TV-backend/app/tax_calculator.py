"""
NMC Nagpur — Real Property Tax Calculator
Based on Unit Area System (Annual Letting Value method)
Source: NMC official tax formula + Maharashtra Municipal Corporation Act
"""

# ── Unit Area Values (₹ per sq meter per year) ──────────────
# Based on NMC zone classification
UNIT_AREA_VALUE = {
    # Zone 3 — Hanuman Nagar localities
    "Hanuman Nagar":  320,
    "Chandan Nagar":  300,
    "Reshimbag":      340,
    "Nandanvan":      290,
    "Vakilpet":       310,
    "Shivnagar":      285,
    "Ganesh Nagar":   295,
    "Tukdoji Nagar":  280,
    "Mahesh Colony":  275,
    "Gayatri Nagar":  270,
    "Budhwar Bazar":  350,
    "Hazarevadi":     265,
    # Default fallback
    "default":        300,
}

# ── Usage / Occupancy Factors ────────────────────────────────
USAGE_FACTOR = {
    "Residential": 1.00,
    "Commercial":  2.00,
    "Mixed":       1.50,
    "Industrial":  1.50,
}

# ── Structure Factors ────────────────────────────────────────
STRUCTURE_FACTOR = {
    "RCC":       1.00,   # Reinforced Cement Concrete
    "Semi-RCC":  0.80,
    "Temporary": 0.50,
}

# ── Age Factors ──────────────────────────────────────────────
AGE_FACTOR = {
    "0-5":   1.00,   # New construction
    "5-10":  0.95,
    "10-20": 0.90,
    "20-30": 0.80,
    "30+":   0.70,
}

# ── Occupancy Factors ────────────────────────────────────────
OCCUPANCY_FACTOR = {
    "self":   1.00,   # Owner occupied
    "rented": 1.50,   # Tenanted
    "vacant": 0.50,
}

# ── Tax Rates (NMC official) ─────────────────────────────────
TAX_RATE_LOW  = 0.07   # 7%  if ALV ≤ ₹50,000
TAX_RATE_HIGH = 0.10   # 10% if ALV > ₹50,000

# ── Penalty ──────────────────────────────────────────────────
LATE_PENALTY_PER_MONTH = 0.02   # 2% per month


def get_unit_area_value(locality: str) -> float:
    return UNIT_AREA_VALUE.get(locality, UNIT_AREA_VALUE["default"])


def calculate_alv(
    area_sqft:     float,
    locality:      str,
    usage:         str  = "Residential",
    structure:     str  = "RCC",
    age_band:      str  = "10-20",
    occupancy:     str  = "self",
) -> float:
    """
    Annual Letting Value = Area × UAV × Usage × Structure × Age × Occupancy

    area_sqft  : built-up area in square feet
    locality   : NMC locality name for UAV lookup
    usage      : Residential / Commercial / Mixed / Industrial
    structure  : RCC / Semi-RCC / Temporary
    age_band   : age of construction in years
    occupancy  : self / rented / vacant
    """
    # Convert sqft to sqm (UAV is per sqm)
    area_sqm = area_sqft / 10.7639

    uav        = get_unit_area_value(locality)
    usage_f    = USAGE_FACTOR.get(usage,     USAGE_FACTOR["Residential"])
    struct_f   = STRUCTURE_FACTOR.get(structure, STRUCTURE_FACTOR["RCC"])
    age_f      = AGE_FACTOR.get(age_band,    AGE_FACTOR["10-20"])
    occ_f      = OCCUPANCY_FACTOR.get(occupancy, OCCUPANCY_FACTOR["self"])

    alv = area_sqm * uav * usage_f * struct_f * age_f * occ_f
    return round(alv, 2)


def calculate_tax(alv: float) -> float:
    """
    NMC tax rate:
    7%  if ALV ≤ ₹50,000
    10% if ALV > ₹50,000
    """
    if alv <= 50000:
        return round(alv * TAX_RATE_LOW, 2)
    else:
        return round(alv * TAX_RATE_HIGH, 2)


def calculate_penalty(base_tax: float, months_late: int) -> float:
    """2% per month on outstanding tax."""
    return round(base_tax * LATE_PENALTY_PER_MONTH * months_late, 2)


def calculate_revenue_loss(
    registered_sqft: float,
    actual_sqft:     float,
    locality:        str,
    usage:           str = "Residential",
    structure:       str = "RCC",
    age_band:        str = "10-20",
) -> dict:
    """
    Calculate exact revenue NMC is losing due to under-registration.
    Returns breakdown of registered vs actual tax.
    """
    # Tax on registered (what owner pays)
    alv_registered = calculate_alv(registered_sqft, locality, usage, structure, age_band)
    tax_registered = calculate_tax(alv_registered)

    # Tax on actual satellite area (what owner should pay)
    alv_actual  = calculate_alv(actual_sqft, locality, usage, structure, age_band)
    tax_actual  = calculate_tax(alv_actual)

    revenue_gap = round(tax_actual - tax_registered, 2)

    return {
        "registered_sqft":  registered_sqft,
        "actual_sqft":      actual_sqft,
        "alv_registered":   alv_registered,
        "alv_actual":       alv_actual,
        "tax_registered":   tax_registered,
        "tax_actual":       tax_actual,
        "annual_revenue_gap": revenue_gap,
        "mismatch_pct":     round((actual_sqft - registered_sqft)
                                  / registered_sqft * 100, 2),
    }


def get_tax_breakdown(
    area_sqft:  float,
    locality:   str,
    usage:      str = "Residential",
    structure:  str = "RCC",
    age_band:   str = "10-20",
    occupancy:  str = "self",
) -> dict:
    """Full tax breakdown for a single property."""
    area_sqm   = round(area_sqft / 10.7639, 2)
    uav        = get_unit_area_value(locality)
    usage_f    = USAGE_FACTOR.get(usage,     1.0)
    struct_f   = STRUCTURE_FACTOR.get(structure, 1.0)
    age_f      = AGE_FACTOR.get(age_band,    0.9)
    occ_f      = OCCUPANCY_FACTOR.get(occupancy, 1.0)

    alv        = calculate_alv(area_sqft, locality, usage,
                               structure, age_band, occupancy)
    base_tax   = calculate_tax(alv)
    tax_rate   = TAX_RATE_LOW if alv <= 50000 else TAX_RATE_HIGH

    return {
        "area_sqft":        area_sqft,
        "area_sqm":         area_sqm,
        "unit_area_value":  uav,
        "usage_factor":     usage_f,
        "structure_factor": struct_f,
        "age_factor":       age_f,
        "occupancy_factor": occ_f,
        "alv":              alv,
        "tax_rate_pct":     tax_rate * 100,
        "base_tax":         base_tax,
        "formula": (
            f"{area_sqm} sqm × ₹{uav} UAV × {usage_f} usage "
            f"× {struct_f} structure × {age_f} age × {occ_f} occupancy"
            f" = ALV ₹{alv:,.2f}"
        )
    }