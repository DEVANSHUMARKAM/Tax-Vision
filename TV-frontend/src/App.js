import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import MapCanvas from "./components/MapCanvas";
import Sidebar from "./components/Sidebar";
import ChangeDetection from "./pages/ChangeDetection";
import TaxRisk from "./pages/TaxRisk";
import FraudDetection from "./pages/FraudDetection";
import GreenBonus from "./pages/GreenBonus";
import Dashboard from "./pages/Dashboard";
import TaxCalculator from "./pages/TaxCalculator";
import LandingPage from "./pages/LandingPage";
import { useAuditData } from "./hooks/useAuditData";
import { auditApi } from "./api/auditApi";

// Pages that show the sidebar navbar
const APP_ROUTES = [
  "/dashboard", "/map", "/detection",
  "/tax-risk", "/fraud", "/green", "/tax-calc"
];

export default function App() {
  const location = useLocation();
  const isAppPage = APP_ROUTES.some(r =>
    location.pathname.startsWith(r));

  const [zones,         setZones]         = useState([]);
  const [wards,         setWards]         = useState([]);
  const [selectedZone,  setSelectedZone]  = useState(null);
  const [selectedWard,  setSelectedWard]  = useState(null);
  const [flyToCoords,   setFlyToCoords]   = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    illegal: true, taxRisk: true,
    fraud: true, green: true, clean: true,
  });

  const {
    summary, allBuildings, riskSummary,
    greenSummary, loading, loadWardData
  } = useAuditData();

  // Auto-load Ward 31 data when entering app pages
  useEffect(() => {
    if (isAppPage && !allBuildings) {
      setSelectedZone(3);
      setSelectedWard(31);
      loadWardData(31);
      auditApi.getZones().then(r => setZones(r.data));
      auditApi.getWards(3).then(r => setWards(r.data));
    }
  }, [isAppPage]);

  const handleZoneChange = async (zone_no) => {
    setSelectedZone(zone_no);
    setSelectedWard(null);
    setFlyToCoords(null);
    const r = await auditApi.getWards(zone_no);
    setWards(r.data);
  };

  const handleWardChange = (ward_no) => {
    setSelectedWard(ward_no);
    setFlyToCoords(null);
    loadWardData(ward_no);
  };

  const handleSearchFound = (result) => {
    if (result.centroid_lat && result.centroid_lon) {
      setFlyToCoords({
        lat: result.centroid_lat,
        lon: result.centroid_lon,
        ts:  Date.now()
      });
    }
  };

  const MapPage = () => (
    <div className="flex flex-1 overflow-hidden">
      <div className="hidden md:block">
        <Sidebar
          zones={zones} wards={wards}
          selectedZone={selectedZone} selectedWard={selectedWard}
          onZoneChange={handleZoneChange} onWardChange={handleWardChange}
          summary={summary} riskSummary={riskSummary}
          greenSummary={greenSummary} activeFilters={activeFilters}
          onFilterToggle={(key) =>
            setActiveFilters(p => ({ ...p, [key]: !p[key] }))}
          onSearchFound={handleSearchFound}
          loading={loading}
        />
      </div>

      <main className="flex-1 relative">
        {/* Mobile zone/ward selectors */}
        <div className="md:hidden absolute top-2 left-2 right-2 z-10 flex gap-2">
          <select
            className="flex-1 bg-gray-900 bg-opacity-90 text-white text-xs
                       rounded-xl px-3 py-2 border border-gray-600"
            value={selectedZone || ""}
            onChange={e => handleZoneChange(Number(e.target.value))}
          >
            <option value="">Select Zone</option>
            {zones.map(z => (
              <option key={z.zone_no} value={z.zone_no}>
                Zone {z.zone_no}: {z.zone_name}
              </option>
            ))}
          </select>
          <select
            className="flex-1 bg-gray-900 bg-opacity-90 text-white text-xs
                       rounded-xl px-3 py-2 border border-gray-600
                       disabled:opacity-40"
            value={selectedWard || ""}
            onChange={e => handleWardChange(Number(e.target.value))}
            disabled={!selectedZone}
          >
            <option value="">Select Ward</option>
            {wards.map(w => (
              <option key={w.ward_no} value={w.ward_no}>
                Ward {w.ward_no}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center
                          bg-gray-900 bg-opacity-85 z-20">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-spin">⚙️</div>
              <p className="text-white font-semibold">Loading Ward Data</p>
              <p className="text-gray-400 text-sm mt-1">
                Fetching 11,542 building polygons...
              </p>
            </div>
          </div>
        )}

        <MapCanvas
          geoJsonData={allBuildings}
          activeFilters={activeFilters}
          flyToCoords={flyToCoords}
        />

        {/* Mobile layer toggles */}
        {selectedWard && (
          <div className="md:hidden absolute bottom-4 left-2 right-2 z-10">
            <div className="bg-gray-900 bg-opacity-95 rounded-2xl p-3
                            flex flex-wrap gap-2">
              {[
                { key: "illegal", label: "🔴 Illegal"  },
                { key: "taxRisk", label: "🟡 Risk"     },
                { key: "fraud",   label: "🟠 Fraud"    },
                { key: "green",   label: "🟢 Green"    },
                { key: "clean",   label: "🔵 Clean"    },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilters(p =>
                    ({ ...p, [f.key]: !p[f.key] }))}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    activeFilters[f.key]
                      ? "text-white"
                      : "bg-gray-800 text-gray-500"
                  }`}
                  style={activeFilters[f.key]
                    ? { background: "linear-gradient(135deg, #f54900, #1a0a00)" }
                    : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Landing page — no navbar */}
      {!isAppPage && (
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      )}

      {/* App pages — with navbar */}
      {isAppPage && (
        <>
          <Navbar wardLabel="Zone 3 — Ward 31" />
          <div className="flex flex-1 overflow-hidden pt-14 md:pt-0">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map"       element={<MapPage />} />
              <Route path="/detection" element={<ChangeDetection />} />
              <Route path="/tax-risk"  element={<TaxRisk />} />
              <Route path="/fraud"     element={<FraudDetection />} />
              <Route path="/green"     element={<GreenBonus />} />
              <Route path="/tax-calc"  element={<TaxCalculator />} />
            </Routes>
          </div>
        </>
      )}

    </div>
  );
}