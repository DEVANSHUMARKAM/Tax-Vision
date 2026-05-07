import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
from shapely import wkt
from shapely.geometry import MultiPolygon, Polygon
from app.database import engine, SessionLocal
from app import models
from sqlalchemy import text

CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/ward31_buildings.csv")
WARD_NO  = 31
ZONE_NO  = 3


def sq_meters_to_sqft(area_m2: float) -> float:
    return area_m2 * 10.7639


def generate_plus_code(lat: float, lon: float, idx: int) -> str:
    lat_part = str(round(lat, 4)).replace(".", "")[:6]
    lon_part = str(round(lon, 4)).replace(".", "")[:6]
    return f"HN-31-{lat_part}{lon_part}-{idx:05d}"


def to_polygon(geom):
    """
    Convert any geometry to a single Polygon.
    MultiPolygon → take the largest polygon by area.
    """
    if isinstance(geom, Polygon):
        return geom
    elif isinstance(geom, MultiPolygon):
        # Pick the largest sub-polygon
        return max(geom.geoms, key=lambda g: g.area)
    else:
        return None


def load_buildings():
    print(f"📂 Reading CSV: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)
    df = df.dropna(subset=["geometry", "latitude", "longitude"])
    df = df.reset_index(drop=True)
    print(f"   Total rows: {len(df):,}")

    loaded  = 0
    skipped = 0

    print("⚙️  Processing and inserting buildings...")

    for idx, row in df.iterrows():
        db = SessionLocal()
        try:
            geom = wkt.loads(row["geometry"])
            geom = to_polygon(geom)

            if geom is None or geom.is_empty or not geom.is_valid:
                skipped += 1
                db.close()
                continue

            plus_code    = generate_plus_code(row["latitude"], row["longitude"], idx)
            ai_area_sqft = sq_meters_to_sqft(float(row["area_in_meters"]))

            building = models.Building(
                full_plus_code = plus_code,
                geometry       = f"SRID=4326;{geom.wkt}",
                ai_area_sqft   = round(ai_area_sqft, 2),
                centroid_lat   = round(float(row["latitude"]), 6),
                centroid_lon   = round(float(row["longitude"]), 6),
                ward_no        = WARD_NO,
                zone_no        = ZONE_NO,
            )
            db.add(building)
            db.commit()
            loaded += 1

            if loaded % 500 == 0:
                print(f"   ✅ Inserted {loaded:,} buildings...")

        except Exception as e:
            db.rollback()
            skipped += 1
            if skipped <= 3:
                print(f"   ⚠️  Skipped row {idx}: {e}")
        finally:
            db.close()

    print(f"\n✅ Load complete.")
    print(f"   Inserted : {loaded:,} buildings")
    print(f"   Skipped  : {skipped:,} rows")


if __name__ == "__main__":
    with engine.connect() as conn:
        count = conn.execute(
            text("SELECT COUNT(*) FROM buildings WHERE ward_no = :w"),
            {"w": WARD_NO}
        ).scalar()

    if count > 0:
        print(f"⚠️  Ward {WARD_NO} already has {count:,} buildings.")
        print(f"   Run this to reload:")
        print(f"   psql -U nmc_admin -h localhost -d smartcity -c \"DELETE FROM buildings WHERE ward_no = {WARD_NO};\"")
        sys.exit(0)

    load_buildings()