import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

import random
import json
from datetime import date, timedelta
import pandas as pd
from sqlalchemy import text
from app.database import engine, SessionLocal
from app import models

random.seed(42)

WARD_NO = 31
ZONE_NO = 3

# Real Nagpur names for authenticity
FIRST_NAMES = [
    "Ramesh", "Suresh", "Mahesh", "Priya", "Sunita", "Kavitha", "Anil",
    "Sunil", "Vijay", "Sanjay", "Ashok", "Santosh", "Rajesh", "Dinesh",
    "Geeta", "Seema", "Rekha", "Anita", "Pooja", "Neha", "Amit", "Rohit",
    "Harish", "Girish", "Prakash", "Devidas", "Shanta", "Mangala", "Lata",
    "Vandana", "Bharat", "Mohan", "Sohan", "Kishor", "Ganesh", "Nilesh"
]

LAST_NAMES = [
    "Patil", "Deshmukh", "Kulkarni", "Sharma", "Nair", "Rao", "Tiwari",
    "Joshi", "Patel", "Gupta", "Singh", "Thakur", "Bai", "Wagh", "Gawande",
    "Bhosale", "Shinde", "Jadhav", "Pawar", "Sawant", "Nagpure", "Meshram",
    "Raut", "Khedkar", "Tekam", "Godbole", "Kanhere", "Deshpande", "Bonde"
]

LOCALITIES_WARD31 = [
    "Hanuman Nagar", "Chandan Nagar", "Reshimbag", "Nandanvan",
    "Vakilpet", "Shivnagar", "Ganesh Nagar", "Tukdoji Nagar",
    "Mahesh Colony", "Gayatri Nagar", "Budhwar Bazar", "Hazarevadi"
]

PROPERTY_TYPES = ["Residential", "Commercial", "Mixed"]


def random_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def random_aadhaar() -> str:
    """Masked Aadhaar — only last 4 digits visible"""
    return f"XXXX-XXXX-{random.randint(1000, 9999)}"


def generate_payment_history(tax_status: str) -> str:
    """
    Generate 6-month payment history consistent with current tax_status.
    Patterns:
      paid      → mostly paid, maybe 1 default long ago
      defaulted → recent defaults
      pending   → mix, ends with pending
    """
    options = ["paid", "paid", "paid", "defaulted", "pending"]

    if tax_status == "paid":
        # Mostly paid — occasional old default
        history = random.choices(["paid", "defaulted"], weights=[0.88, 0.12], k=5)
        history.append("paid")  # most recent = paid

    elif tax_status == "defaulted":
        # Recent streak of defaults
        history = random.choices(["paid", "defaulted"], weights=[0.5, 0.5], k=3)
        # Last 2-3 must be defaulted
        history += random.choices(["defaulted"], k=random.randint(2, 3))
        history = history[:6]

    else:  # pending
        history = random.choices(["paid", "defaulted", "pending"], weights=[0.5, 0.3, 0.2], k=5)
        history.append("pending")

    return json.dumps(history)


def generate_tax_amount(area_sqft: float, prop_type: str) -> float:
    """₹ per sq ft annually — realistic NMC rates"""
    rates = {"Residential": 8, "Commercial": 18, "Mixed": 12}
    rate = rates.get(prop_type, 8)
    return round(area_sqft * rate, 2)


def generate_due_amount(base_tax: float, tax_status: str, history_json: str) -> float:
    history = json.loads(history_json)
    defaults = history.count("defaulted")
    if tax_status == "paid":
        return 0.0
    elif tax_status == "defaulted":
        return round(base_tax * defaults, 2)
    else:
        return round(base_tax * 0.5, 2)


def random_last_payment(tax_status: str) -> date:
    today = date.today()
    if tax_status == "paid":
        days_ago = random.randint(10, 90)
    elif tax_status == "defaulted":
        days_ago = random.randint(180, 720)
    else:
        days_ago = random.randint(90, 360)
    return today - timedelta(days=days_ago)


def load_tax_records():
    # Fetch all building plus_codes for Ward 31
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT full_plus_code, ai_area_sqft 
            FROM buildings 
            WHERE ward_no = :w 
            ORDER BY id
        """), {"w": WARD_NO}).fetchall()

    print(f"📋 Generating tax records for {len(rows):,} buildings...")

    db = SessionLocal()
    loaded  = 0
    skipped = 0

    # ── Deliberate fraud patterns ──────────────────────────────────
    # Pick 50 buildings that will share owner IDs (double-sold fraud)
    fraud_indices = random.sample(range(len(rows)), 100)
    fraud_pairs   = {}
    for i in range(0, 100, 2):
        shared_owner = f"OWN-FRAUD-{i//2:04d}"
        fraud_pairs[fraud_indices[i]]     = shared_owner
        fraud_pairs[fraud_indices[i + 1]] = shared_owner

    # Pick 20% buildings for illegal extensions
    # (registered_area will be set 30-60% less than ai_area_sqft)
    illegal_indices = set(random.sample(range(len(rows)), int(len(rows) * 0.20)))

    # Pick 25% for tax defaulters
    defaulter_indices = set(random.sample(range(len(rows)), int(len(rows) * 0.25)))

    # Pick 15% for green reward eligibility
    green_indices = set(random.sample(range(len(rows)), int(len(rows) * 0.15)))

    for idx, (plus_code, ai_area_sqft) in enumerate(rows):
        try:
            # ── Property type ──
            prop_type = random.choices(
                PROPERTY_TYPES, weights=[0.70, 0.20, 0.10]
            )[0]

            # ── Registered area ──
            if idx in illegal_indices:
                # Registered less than actual — illegal extension
                shrink = random.uniform(0.35, 0.75)
                registered_area = round(ai_area_sqft * shrink, 2)
            else:
                # Small natural variance ±5%
                variance = random.uniform(0.95, 1.05)
                registered_area = round(ai_area_sqft * variance, 2)

            # ── Tax status ──
            if idx in defaulter_indices:
                tax_status = random.choices(
                    ["defaulted", "pending"], weights=[0.75, 0.25]
                )[0]
            elif idx in green_indices:
                tax_status = "paid"
            else:
                tax_status = random.choices(
                    ["paid", "defaulted", "pending"],
                    weights=[0.65, 0.20, 0.15]
                )[0]

            # ── Owner ──
            if idx in fraud_pairs:
                owner_id   = fraud_pairs[idx]
                owner_name = f"Fraud Owner {fraud_pairs[idx][-4:]}"
            else:
                owner_id   = f"OWN-HN31-{idx:05d}"
                owner_name = random_name()

            # ── NDVI score ──
            if idx in green_indices:
                ndvi_score = round(random.uniform(0.31, 0.75), 3)
            else:
                ndvi_score = round(random.uniform(0.05, 0.45), 3)

            # ── Financial ──
            payment_history = generate_payment_history(tax_status)
            base_tax        = generate_tax_amount(registered_area, prop_type)
            due_amount      = generate_due_amount(base_tax, tax_status, payment_history)
            last_payment    = random_last_payment(tax_status)

            # ── Mismatch % ──
            mismatch_pct = round(
                ((ai_area_sqft - registered_area) / registered_area) * 100, 2
            ) if registered_area > 0 else 0.0

            # ── Risk score (simple rule-based for now, ML replaces later) ──
            history     = json.loads(payment_history)
            default_rate = history.count("defaulted") / len(history)
            risk_score  = round(min(default_rate * 1.4, 1.0), 3)

            # ── Discount ──
            discount_pct = 0.0
            if tax_status == "paid" and ndvi_score >= 0.30:
                if ndvi_score >= 0.70:
                    discount_pct = 20.0
                elif ndvi_score >= 0.50:
                    discount_pct = 15.0
                else:
                    discount_pct = 10.0

            upin = f"NMC-HN-{idx+1:05d}"

            record = models.TaxRecord(
                upin             = upin,
                plus_code        = plus_code,
                ward_no          = WARD_NO,
                zone_no          = ZONE_NO,
                locality         = random.choice(LOCALITIES_WARD31),
                owner_name       = owner_name,
                owner_aadhaar    = random_aadhaar(),
                property_type    = prop_type,
                registered_area  = registered_area,
                floor_count      = random.choices([1, 2, 3], weights=[0.6, 0.3, 0.1])[0],
                tax_status       = tax_status,
                base_tax_amount  = base_tax,
                due_amount       = due_amount,
                last_payment_date= last_payment,
                payment_history  = payment_history,
                mismatch_pct     = mismatch_pct,
                risk_score       = risk_score,
                ndvi_score       = ndvi_score,
                is_flagged       = mismatch_pct > 20.0,
                is_fraud         = idx in fraud_pairs,
                discount_pct     = discount_pct,
            )
            db.add(record)
            loaded += 1

            if loaded % 500 == 0:
                db.commit()
                print(f"   ✅ Inserted {loaded:,} records...")

        except Exception as e:
            db.rollback()
            skipped += 1
            if skipped <= 3:
                print(f"   ⚠️  Skipped row {idx}: {e}")
            continue

    db.commit()
    db.close()

    print(f"\n✅ Tax records loaded.")
    print(f"   Total inserted  : {loaded:,}")
    print(f"   Skipped         : {skipped:,}")
    print(f"   Illegal (>20%)  : {int(len(rows) * 0.20):,} approx")
    print(f"   Defaulters      : {int(len(rows) * 0.25):,} approx")
    print(f"   Fraud pairs     : 50 double-sold plots")
    print(f"   Green eligible  : {int(len(rows) * 0.15):,} approx")


if __name__ == "__main__":
    with engine.connect() as conn:
        count = conn.execute(
            text("SELECT COUNT(*) FROM tax_records WHERE ward_no = :w"),
            {"w": WARD_NO}
        ).scalar()

    if count > 0:
        print(f"⚠️  Tax records already exist for Ward {WARD_NO} ({count:,} rows).")
        print("   To reload:")
        print(f"   psql -U nmc_admin -h localhost -d smartcity -c \"DELETE FROM tax_records WHERE ward_no = {WARD_NO};\"")
        sys.exit(0)

    load_tax_records()