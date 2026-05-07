import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.database import engine, Base
from app import models  # noqa: F401 — needed so Base sees all models


# ─────────────────────────────────────────
# REAL NMC ZONE → WARD → LOCALITY DATA
# Sourced directly from the official NMC
# Zone Ward and Area Details PDF (2024)
# ─────────────────────────────────────────

NMC_ZONES = [
    {"zone_no": 1,  "zone_name": "Laxmi Nagar",    "zone_name_marathi": "लक्ष्मी नगर"},
    {"zone_no": 2,  "zone_name": "Dharmpeth",       "zone_name_marathi": "धरमपेठ"},
    {"zone_no": 3,  "zone_name": "Hanuman Nagar",   "zone_name_marathi": "हनुमान नगर"},
    {"zone_no": 4,  "zone_name": "Dhantoli",        "zone_name_marathi": "धांतोली"},
    {"zone_no": 5,  "zone_name": "Nehru Nagar",     "zone_name_marathi": "नेहरू नगर"},
    {"zone_no": 6,  "zone_name": "Gandhibag",       "zone_name_marathi": "गांधीबाग"},
    {"zone_no": 7,  "zone_name": "Satranjipura",    "zone_name_marathi": "सतरांजीपुरा"},
    {"zone_no": 8,  "zone_name": "Lakadganj",       "zone_name_marathi": "लकडगांज"},
    {"zone_no": 9,  "zone_name": "Ashi Nagar",      "zone_name_marathi": "आशीनगर"},
    {"zone_no": 10, "zone_name": "Mangalwari",      "zone_name_marathi": "मांगळवारी"},
]


NMC_WARDS = [
    # Zone 1 — Laxmi Nagar
    {"ward_no": 16, "zone_no": 1, "ward_name": "Laxmi Nagar Ward 16"},
    {"ward_no": 36, "zone_no": 1, "ward_name": "Laxmi Nagar Ward 36"},
    {"ward_no": 37, "zone_no": 1, "ward_name": "Laxmi Nagar Ward 37"},
    {"ward_no": 38, "zone_no": 1, "ward_name": "Laxmi Nagar Ward 38"},

    # Zone 2 — Dharmpeth
    {"ward_no": 12, "zone_no": 2, "ward_name": "Dharmpeth Ward 12"},
    {"ward_no": 13, "zone_no": 2, "ward_name": "Dharmpeth Ward 13"},
    {"ward_no": 14, "zone_no": 2, "ward_name": "Dharmpeth Ward 14"},
    {"ward_no": 15, "zone_no": 2, "ward_name": "Dharmpeth Ward 15"},

    # Zone 3 — Hanuman Nagar  ← YOUR PHASE 1 FOCUS WARD
    {"ward_no": 29, "zone_no": 3, "ward_name": "Hanuman Nagar Ward 29"},
    {"ward_no": 31, "zone_no": 3, "ward_name": "Hanuman Nagar Ward 31"},
    {"ward_no": 32, "zone_no": 3, "ward_name": "Hanuman Nagar Ward 32"},
    {"ward_no": 34, "zone_no": 3, "ward_name": "Hanuman Nagar Ward 34"},

    # Zone 4 — Dhantoli
    {"ward_no": 17, "zone_no": 4, "ward_name": "Dhantoli Ward 17"},
    {"ward_no": 33, "zone_no": 4, "ward_name": "Dhantoli Ward 33"},
    {"ward_no": 35, "zone_no": 4, "ward_name": "Dhantoli Ward 35"},

    # Zone 5 — Nehru Nagar
    {"ward_no": 26, "zone_no": 5, "ward_name": "Nehru Nagar Ward 26"},
    {"ward_no": 27, "zone_no": 5, "ward_name": "Nehru Nagar Ward 27"},
    {"ward_no": 28, "zone_no": 5, "ward_name": "Nehru Nagar Ward 28"},
    {"ward_no": 30, "zone_no": 5, "ward_name": "Nehru Nagar Ward 30"},

    # Zone 6 — Gandhibag
    {"ward_no": 8,  "zone_no": 6, "ward_name": "Gandhibag Ward 8"},
    {"ward_no": 18, "zone_no": 6, "ward_name": "Gandhibag Ward 18"},
    {"ward_no": 19, "zone_no": 6, "ward_name": "Gandhibag Ward 19"},
    {"ward_no": 22, "zone_no": 6, "ward_name": "Gandhibag Ward 22"},

    # Zone 7 — Satranjipura
    {"ward_no": 5,  "zone_no": 7, "ward_name": "Satranjipura Ward 5"},
    {"ward_no": 20, "zone_no": 7, "ward_name": "Satranjipura Ward 20"},
    {"ward_no": 21, "zone_no": 7, "ward_name": "Satranjipura Ward 21"},

    # Zone 8 — Lakadganj
    {"ward_no": 4,  "zone_no": 8, "ward_name": "Lakadganj Ward 4"},
    {"ward_no": 23, "zone_no": 8, "ward_name": "Lakadganj Ward 23"},
    {"ward_no": 24, "zone_no": 8, "ward_name": "Lakadganj Ward 24"},
    {"ward_no": 25, "zone_no": 8, "ward_name": "Lakadganj Ward 25"},

    # Zone 9 — Ashi Nagar
    {"ward_no": 2,  "zone_no": 9, "ward_name": "Ashi Nagar Ward 2"},
    {"ward_no": 3,  "zone_no": 9, "ward_name": "Ashi Nagar Ward 3"},
    {"ward_no": 6,  "zone_no": 9, "ward_name": "Ashi Nagar Ward 6"},
    {"ward_no": 7,  "zone_no": 9, "ward_name": "Ashi Nagar Ward 7"},

    # Zone 10 — Mangalwari
    {"ward_no": 1,  "zone_no": 10, "ward_name": "Mangalwari Ward 1"},
    {"ward_no": 9,  "zone_no": 10, "ward_name": "Mangalwari Ward 9"},
    {"ward_no": 10, "zone_no": 10, "ward_name": "Mangalwari Ward 10"},
    {"ward_no": 11, "zone_no": 10, "ward_name": "Mangalwari Ward 11"},
]


# Localities from NMC PDF — full list for all wards
# We'll only load buildings for Ward 31 in Phase 1
# but having all localities seeded is useful for dropdowns

NMC_LOCALITIES = [
    # ── Zone 3, Ward 29 ──
    {"ward_no": 29, "locality_name": "Mahalgi Nagar"},
    {"ward_no": 29, "locality_name": "Mahatma Gandhi Nagar"},
    {"ward_no": 29, "locality_name": "Besa Power Station"},
    {"ward_no": 29, "locality_name": "Sanmarg Nagar"},
    {"ward_no": 29, "locality_name": "Santoshi Mata Nagar"},
    {"ward_no": 29, "locality_name": "NMC Colony"},
    {"ward_no": 29, "locality_name": "Suryodaya Nagar"},
    {"ward_no": 29, "locality_name": "Sudarshan Nagar"},
    {"ward_no": 29, "locality_name": "Hudkeshwar"},
    {"ward_no": 29, "locality_name": "Narsala"},
    {"ward_no": 29, "locality_name": "New Nehru Nagar"},
    {"ward_no": 29, "locality_name": "Brahma Nagar"},
    {"ward_no": 29, "locality_name": "Swagat Nagar"},

    # ── Zone 3, Ward 31 ← PHASE 1 WARD ──
    {"ward_no": 31, "locality_name": "Hanuman Nagar"},
    {"ward_no": 31, "locality_name": "Chandan Nagar"},
    {"ward_no": 31, "locality_name": "Vakilpet"},
    {"ward_no": 31, "locality_name": "Hazarevadi"},
    {"ward_no": 31, "locality_name": "Bajrang Complex"},
    {"ward_no": 31, "locality_name": "Reshimbag"},
    {"ward_no": 31, "locality_name": "Nagomalai Layout"},
    {"ward_no": 31, "locality_name": "Reshimbag Ground"},
    {"ward_no": 31, "locality_name": "Hedgewar Bhavan"},
    {"ward_no": 31, "locality_name": "Budhwar Bazar"},
    {"ward_no": 31, "locality_name": "Mohota Science College"},
    {"ward_no": 31, "locality_name": "Nandanvan"},
    {"ward_no": 31, "locality_name": "Shivnagar"},
    {"ward_no": 31, "locality_name": "Sangam Cinema"},
    {"ward_no": 31, "locality_name": "Ganesh Nagar"},
    {"ward_no": 31, "locality_name": "Tukdoji Nagar"},
    {"ward_no": 31, "locality_name": "Somwari Quarters"},
    {"ward_no": 31, "locality_name": "Mahesh Colony"},
    {"ward_no": 31, "locality_name": "Gayatri Nagar"},
    {"ward_no": 31, "locality_name": "Keshav Nagar"},

    # ── Zone 3, Ward 32 ──
    {"ward_no": 32, "locality_name": "Bajrang Nagar"},
    {"ward_no": 32, "locality_name": "Savitribai Fule Nagar"},
    {"ward_no": 32, "locality_name": "Tajnagar"},
    {"ward_no": 32, "locality_name": "Jawahar Nagar"},
    {"ward_no": 32, "locality_name": "Kailash Nagar"},
    {"ward_no": 32, "locality_name": "Chakradhar Nagar"},
    {"ward_no": 32, "locality_name": "RMS Colony"},
    {"ward_no": 32, "locality_name": "New Subhedar Layout"},
    {"ward_no": 32, "locality_name": "Rukhmini Nagar"},
    {"ward_no": 32, "locality_name": "Gurudev Nagar"},
    {"ward_no": 32, "locality_name": "Ayodhya Nagar"},
    {"ward_no": 32, "locality_name": "Durga Nagar"},
    {"ward_no": 32, "locality_name": "Mahalaxmi Nagar"},

    # ── Zone 3, Ward 34 ──
    {"ward_no": 34, "locality_name": "Manewada"},
    {"ward_no": 34, "locality_name": "Vinkar Colony"},
    {"ward_no": 34, "locality_name": "Omkar Nagar"},
    {"ward_no": 34, "locality_name": "Shahu Nagar"},
    {"ward_no": 34, "locality_name": "Janki Nagar"},
    {"ward_no": 34, "locality_name": "Shivshakti Nagar"},
    {"ward_no": 34, "locality_name": "Akash Nagar"},
    {"ward_no": 34, "locality_name": "Ramteke Nagar"},
    {"ward_no": 34, "locality_name": "Vidnyan Nagar"},

    # ── Zone 1, Ward 16 — abbreviated, add full list later ──
    {"ward_no": 16, "locality_name": "Bajaj Nagar"},
    {"ward_no": 16, "locality_name": "Laxmi Nagar East"},
    {"ward_no": 16, "locality_name": "Vasant Nagar"},
    {"ward_no": 16, "locality_name": "Rahaate Colony"},
    {"ward_no": 16, "locality_name": "Dikshabhumi Complex"},
    {"ward_no": 16, "locality_name": "Ramadasapeth"},
    {"ward_no": 16, "locality_name": "Congress Nagar"},
    {"ward_no": 16, "locality_name": "Somalwada"},
    {"ward_no": 16, "locality_name": "Vivekananda Nagar"},
]


# ─────────────────────────────────────────
# MAIN INIT FUNCTION
# ─────────────────────────────────────────

def init_db():
    from app.database import SessionLocal

    print("🔧 Step 1: Enabling PostGIS extension...")
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.commit()
    print("   ✅ PostGIS enabled")

    print("🔧 Step 2: Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("   ✅ Tables created")

    print("🔧 Step 3: Creating spatial index on buildings.geometry...")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_buildings_geom
            ON buildings USING GIST(geometry);
        """))
        # Index for fast ward-level filtering
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_buildings_ward
            ON buildings(ward_no);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_tax_records_upin
            ON tax_records(upin);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_tax_records_ward
            ON tax_records(ward_no);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_audit_logs_upin
            ON audit_logs(upin);
        """))
        conn.commit()
    print("   ✅ All indexes created")

    print("🔧 Step 4: Seeding NMC Zone data...")
    db = SessionLocal()
    try:
        # Only seed if empty — safe to re-run
        if db.query(models.Zone).count() == 0:
            for z in NMC_ZONES:
                db.add(models.Zone(**z))
            db.commit()
            print(f"   ✅ Seeded {len(NMC_ZONES)} zones")
        else:
            print("   ⏭️  Zones already seeded — skipping")

        if db.query(models.Ward).count() == 0:
            for w in NMC_WARDS:
                db.add(models.Ward(**w))
            db.commit()
            print(f"   ✅ Seeded {len(NMC_WARDS)} wards")
        else:
            print("   ⏭️  Wards already seeded — skipping")

        if db.query(models.Locality).count() == 0:
            for loc in NMC_LOCALITIES:
                db.add(models.Locality(**loc))
            db.commit()
            print(f"   ✅ Seeded {len(NMC_LOCALITIES)} localities")
        else:
            print("   ⏭️  Localities already seeded — skipping")

    finally:
        db.close()

    print("\n✅ Database fully initialized and ready.")
    print("   Next step: run load_buildings.py to ingest your GeoJSON")


if __name__ == "__main__":
    init_db()