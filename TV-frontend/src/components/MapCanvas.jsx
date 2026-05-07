import { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PropertyPopup from "./PropertyPopup";

// ── Fly-to component — triggers map.flyTo when coords change ──
function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords?.lat && coords?.lon) {
      map.flyTo([coords.lat, coords.lon], 19, { duration: 1.8 });
    }
  }, [coords, map]);  // coords.ts changes every click → always fires
  return null;
}

// ── Color styles per audit status ──
const STYLE_MAP = {
  red:    { fillColor: "#ef4444", color: "#b91c1c", fillOpacity: 0.75, weight: 1.2 },
  yellow: { fillColor: "#f59e0b", color: "#b45309", fillOpacity: 0.65, weight: 1   },
  orange: { fillColor: "#f97316", color: "#c2410c", fillOpacity: 0.75, weight: 1.2 },
  green:  { fillColor: "#22c55e", color: "#15803d", fillOpacity: 0.65, weight: 1   },
  blue:   { fillColor: "#3b82f6", color: "#1d4ed8", fillOpacity: 0.35, weight: 0.5 },
};

function styleFeature(feature) {
  const color = feature.properties?.audit_color || "blue";
  return STYLE_MAP[color] || STYLE_MAP.blue;
}

// ── Building count display ──
function MapStats({ total, visible }) {
  return (
    <div className="absolute bottom-8 left-4 z-50 bg-gray-900 bg-opacity-90
                    text-white text-xs rounded-xl px-3 py-2 shadow-lg
                    border border-gray-700">
      <div className="font-semibold text-gray-200">Ward 31 — Hanuman Nagar</div>
      <div className="text-gray-400 mt-0.5">
        Showing <span className="text-white font-bold">{visible?.toLocaleString()}</span>
        {" "}/ {total?.toLocaleString()} buildings
      </div>
    </div>
  );
}

export default function MapCanvas({ geoJsonData, activeFilters, flyToCoords }) {
  const [selected, setSelected] = useState(null);
  const [popupPos, setPopupPos] = useState(null);
  const geoJsonRef = useRef();

  // ── Filter features based on active layer toggles ──
  const filtered = geoJsonData ? {
    ...geoJsonData,
    features: (geoJsonData.features || []).filter(f => {
      const ft = f.properties?.flag_type;
      if (ft === "illegal_extension" && !activeFilters.illegal)  return false;
      if (ft === "tax_risk"          && !activeFilters.taxRisk)  return false;
      if (ft === "fraud_double_sold" && !activeFilters.fraud)    return false;
      if (ft === "green_reward"      && !activeFilters.green)    return false;
      if (ft === "clean"             && !activeFilters.clean)    return false;
      return true;
    })
  } : null;

  const totalCount   = geoJsonData?.features?.length || 0;
  const visibleCount = filtered?.features?.length    || 0;

  // ── Per-feature hover + click handlers ──
  const onEachFeature = (feature, layer) => {
    const originalStyle = styleFeature(feature);

    layer.on({
      mouseover: (e) => {
        e.target.setStyle({
          ...originalStyle,
          fillOpacity: 0.95,
          weight: 3,
        });
        e.target.bringToFront();
      },
      mouseout: (e) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
      },
      click: (e) => {
        setSelected(feature);
        setPopupPos([e.latlng.lat, e.latlng.lng]);
      },
    });
  };

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>

      <MapContainer
        center={[21.130, 79.090]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        {/* Base tile layer — OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          maxZoom={21}
        />

        {/* Fly to searched property */}
        {flyToCoords && <FlyTo coords={flyToCoords} />}

        {/* Building polygons */}
        {filtered?.features?.length > 0 && (
          <GeoJSON
            key={JSON.stringify(activeFilters)}
            ref={geoJsonRef}
            data={filtered}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Property detail popup on click */}
        {selected && popupPos && (
          <PropertyPopup
            feature={selected}
            position={popupPos}
            onClose={() => {
              setSelected(null);
              setPopupPos(null);
            }}
          />
        )}
      </MapContainer>

      {/* Building count overlay */}
      {totalCount > 0 && (
        <MapStats total={totalCount} visible={visibleCount} />
      )}

    </div>
  );
}