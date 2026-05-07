import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auditApi } from "../api/auditApi";

export default function LandingPage() {
  const [zones,        setZones]        = useState([]);
  const [wards,        setWards]        = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    auditApi.getZones().then(r => setZones(r.data));
  }, []);

  const handleZoneChange = async (zone_no) => {
    setSelectedZone(zone_no);
    setSelectedWard("");
    const r = await auditApi.getWards(zone_no);
    setWards(r.data);
  };

  const handleExplore = () => {
    if (!selectedZone || !selectedWard) return;
    if (Number(selectedWard) !== 31) {
      alert("Data available only for Ward 31 (Hanuman Nagar) in Phase 1.");
      return;
    }
    navigate("/dashboard");
  };

  const canExplore = selectedZone && selectedWard
                     && Number(selectedWard) === 31;

  return (
    <div className="min-h-screen w-full relative overflow-hidden
                    flex items-center justify-center">

      {/* ── City map background with blur ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/city-map.png')" }}
      />

      {/* Dark overlay on top of map */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.82)" }}
      />

      {/* Subtle orange tint at center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, " +
            "rgba(245,73,0,0.08) 0%, transparent 70%)"
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-5
                      flex flex-col items-center text-center">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                     text-xs font-medium mb-8 border"
          style={{
            borderColor: "rgba(245,73,0,0.4)",
            color: "#f57d49",
            background: "rgba(245,73,0,0.08)"
          }}
        >
          Maharashtra Remote Sensing Application Centre
        </div>

        {/* Logo + Name */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center
                       font-black text-xl text-white"
            style={{
              background: "linear-gradient(135deg, #f54900, #7a2400)"
            }}
          >
            T
          </div>
          <div className="text-left">
            <div
              className="text-3xl md:text-4xl font-black tracking-tight"
              style={{ color: "#f54900" }}
            >
              TaxVision
            </div>
            <div className="text-gray-400 text-sm">
              AI Property Intelligence
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm md:text-base mb-2 leading-relaxed
                      max-w-lg">
          Smart City Urban Audit & Governance System for
          Nagpur Municipal Corporation
        </p>
        <p className="text-gray-500 text-xs md:text-sm mb-8 max-w-md
                      leading-relaxed">
          Detect illegal building extensions · Predict tax defaults ·
          Identify fraud · Reward green initiatives
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10">
          {[
            { value: "11,542",    label: "Buildings Mapped"    },
            { value: "2,308",     label: "Illegal Extensions"  },
            { value: "₹13.98 Cr", label: "Revenue at Risk"     },
            { value: "94.3%",     label: "AI Model Accuracy"   },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div
                className="text-xl md:text-2xl font-black"
                style={{ color: "#f54900" }}
              >
                {s.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Selector card */}
        <div
          className="w-full rounded-2xl p-6 md:p-8 mb-6 border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <p
            className="text-sm font-semibold mb-5"
            style={{ color: "#f54900" }}
          >
            Select Your Area to Begin
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

            {/* Zone */}
            <div className="text-left">
              <label className="text-xs text-gray-400 mb-1.5 block
                                uppercase tracking-wider">
                Zone
              </label>
              <select
                value={selectedZone}
                onChange={e => handleZoneChange(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm border
                           focus:outline-none transition-all text-white"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderColor: selectedZone
                    ? "#f54900" : "rgba(255,255,255,0.15)",
                }}
              >
                <option value="" style={{ background: "#111" }}>
                  -- Select Zone --
                </option>
                {zones.map(z => (
                  <option key={z.zone_no} value={z.zone_no}
                    style={{ background: "#111" }}>
                    Zone {z.zone_no}: {z.zone_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ward */}
            <div className="text-left">
              <label className="text-xs text-gray-400 mb-1.5 block
                                uppercase tracking-wider">
                Ward
              </label>
              <select
                value={selectedWard}
                onChange={e => setSelectedWard(e.target.value)}
                disabled={!selectedZone}
                className="w-full rounded-xl px-4 py-3 text-sm border
                           focus:outline-none transition-all text-white
                           disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderColor: selectedWard
                    ? "#f54900" : "rgba(255,255,255,0.15)",
                }}
              >
                <option value="" style={{ background: "#111" }}>
                  -- Select Ward --
                </option>
                {wards.map(w => (
                  <option key={w.ward_no} value={w.ward_no}
                    style={{ background: "#111" }}>
                    Ward {w.ward_no}: {w.ward_name}
                    {w.ward_no !== 31 ? " (Phase 2)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status messages */}
          {selectedWard && Number(selectedWard) !== 31 && (
            <div
              className="text-xs px-4 py-2.5 rounded-xl mb-4 border"
              style={{
                background: "rgba(245,73,0,0.1)",
                borderColor: "rgba(245,73,0,0.3)",
                color: "#f57d49"
              }}
            >
              ⚠️ Phase 1 covers Ward 31 only. Other wards coming in Phase 2.
            </div>
          )}

          {canExplore && (
            <div
              className="text-xs px-4 py-2.5 rounded-xl mb-4 border"
              style={{
                background: "rgba(34,197,94,0.1)",
                borderColor: "rgba(34,197,94,0.3)",
                color: "#4ade80"
              }}
            >
              ✅ Ward 31 — Hanuman Nagar · 11,542 buildings ready
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleExplore}
            disabled={!canExplore}
            className="w-full py-3.5 rounded-xl font-bold text-sm
                       transition-all disabled:opacity-30
                       disabled:cursor-not-allowed text-white"
            style={{
              background: canExplore
                ? "linear-gradient(135deg, #f54900, #7a2400)"
                : "rgba(255,255,255,0.1)",
              boxShadow: canExplore
                ? "0 4px 24px rgba(245,73,0,0.35)" : "none"
            }}
          >
            Explore Ward Dashboard →
          </button>
        </div>

        {/* Module tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "📊 Dashboard",
            "🗺️ Map View",
            "🔴 Change Detection",
            "🟡 Tax Risk",
            "🟠 Fraud Detection",
            "🟢 Green Bonus",
            "🧮 Tax Calculator",
          ].map(m => (
            <span
              key={m}
              className="text-xs px-3 py-1.5 rounded-full border"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#6b7280"
              }}
            >
              {m}
            </span>
          ))}
        </div>

        <div className="mt-8 text-xs text-gray-600">
          Nagpur Municipal Corporation 
        </div>
      </div>
    </div>
  );
}