import SearchBar from "./SearchBar";

export default function Sidebar({
  zones, wards, selectedZone, selectedWard,
  onZoneChange, onWardChange,
  summary, riskSummary, greenSummary,
  activeFilters, onFilterToggle,
  onSearchFound,
  loading
}) {
  return (
    <aside className="w-80 bg-white text-gray-800 flex flex-col h-screen
                      overflow-y-auto flex-shrink-0 border-r border-gray-100
                      shadow-sm">

      {/* ── Header ── */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center
                       text-sm font-bold text-white flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #f54900, #7a2400)"
            }}
          >
            T
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">TaxVision</div>
            <div className="text-xs text-gray-400">AI Property Intelligence</div>
          </div>
        </div>
      </div>

      {/* ── Zone + Ward Selectors ── */}
      <div className="p-4 border-b border-gray-100 space-y-3">

        <div>
          <label className="text-xs text-gray-400 mb-1 block
                            uppercase tracking-wider">
            Select Zone
          </label>
          <select
            className="w-full bg-gray-50 text-gray-800 text-sm rounded-xl
                       px-3 py-2.5 border border-gray-200
                       focus:outline-none focus:border-orange-400
                       transition-all"
            value={selectedZone || ""}
            onChange={e => onZoneChange(Number(e.target.value))}
          >
            <option value="">-- Select Zone --</option>
            {zones.map(z => (
              <option key={z.zone_no} value={z.zone_no}>
                Zone {z.zone_no}: {z.zone_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block
                            uppercase tracking-wider">
            Select Ward
          </label>
          <select
            className="w-full bg-gray-50 text-gray-800 text-sm rounded-xl
                       px-3 py-2.5 border border-gray-200
                       focus:outline-none focus:border-orange-400
                       disabled:opacity-40 transition-all"
            value={selectedWard || ""}
            onChange={e => onWardChange(Number(e.target.value))}
            disabled={!selectedZone}
          >
            <option value="">-- Select Ward --</option>
            {wards.map(w => (
              <option key={w.ward_no} value={w.ward_no}>
                Ward {w.ward_no}: {w.ward_name}
              </option>
            ))}
          </select>
        </div>

        {selectedWard && selectedWard !== 31 && (
          <div
            className="text-xs rounded-xl px-3 py-2 border"
            style={{
              background: "rgba(245,73,0,0.06)",
              borderColor: "rgba(245,73,0,0.2)",
              color: "#f54900"
            }}
          >
            ⚠️ Data only for Ward 31 (Phase 1)
          </div>
        )}

        {loading && (
          <div className="text-xs flex items-center gap-2"
            style={{ color: "#f54900" }}>
            <span className="animate-spin">⚙️</span>
            Loading ward data...
          </div>
        )}
      </div>

      {/* ── Search ── */}
      <SearchBar onFound={onSearchFound} />

      {/* ── Dashboard Stats ── */}
      {summary && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            Dashboard
          </p>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Total Properties"
              value={summary.total_properties?.toLocaleString()}
              color="text-gray-800" />
            <StatCard label="Flagged"
              value={summary.flagged_deviations?.toLocaleString()}
              color="text-red-500" />
            <StatCard label="High Risk"
              value={riskSummary?.high_risk?.toLocaleString()}
              color="text-yellow-600" />
            <StatCard label="Fraud Cases"
              value={summary.fraud_count?.toLocaleString()}
              color="text-orange-600" />
            <StatCard label="Green Rewarded"
              value={summary.green_reward_count?.toLocaleString()}
              color="text-green-600" />
            <StatCard label="Tax Collection"
              value={`${summary.tax_collection_rate}%`}
              color="text-blue-600" />
          </div>

          {/* Revenue at Risk */}
          <div
            className="mt-3 rounded-xl p-3 border"
            style={{
              background: "rgba(245,73,0,0.05)",
              borderColor: "rgba(245,73,0,0.15)"
            }}
          >
            <div className="text-xs text-gray-400">Revenue at Risk</div>
            <div
              className="font-black text-xl mt-0.5"
              style={{ color: "#f54900" }}
            >
              ₹{(summary.revenue_at_risk / 10000000).toFixed(2)} Cr
            </div>
          </div>

          {/* NDVI */}
          <div className="mt-2 bg-gray-50 rounded-xl p-3 border
                          border-gray-100">
            <div className="text-xs text-gray-400">Avg NDVI Score</div>
            <div className="text-green-600 font-black text-xl mt-0.5">
              {greenSummary?.avg_ndvi?.toFixed(3)}
            </div>
            <div className="flex gap-3 mt-1 text-xs">
              <span className="text-green-500">
                Dense: {greenSummary?.dense_count}
              </span>
              <span className="text-yellow-500">
                Moderate: {greenSummary?.moderate_count}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Layer Toggles ── */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          Map Layers
        </p>
        <div className="space-y-2">
          <Toggle label="🔴 Illegal Extensions"
            active={activeFilters.illegal}
            onClick={() => onFilterToggle("illegal")} />
          <Toggle label="🟡 Tax Default Risk"
            active={activeFilters.taxRisk}
            onClick={() => onFilterToggle("taxRisk")} />
          <Toggle label="🟠 Fraud / Double-Sold"
            active={activeFilters.fraud}
            onClick={() => onFilterToggle("fraud")} />
          <Toggle label="🟢 Green Rewards"
            active={activeFilters.green}
            onClick={() => onFilterToggle("green")} />
          <Toggle label="🔵 Clean Buildings"
            active={activeFilters.clean}
            onClick={() => onFilterToggle("clean")} />
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="p-4 mt-auto">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          Legend
        </p>
        {[
          { color: "bg-red-500",    label: "Illegal Extension (>20%)" },
          { color: "bg-yellow-400", label: "Tax Default Risk (>60%)"  },
          { color: "bg-orange-500", label: "Fraud — Double Sold"      },
          { color: "bg-green-500",  label: "Green Reward (NDVI >30%)" },
          { color: "bg-blue-400",   label: "Clean / Normal"           },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${color}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
      <div className="text-xs text-gray-400 leading-tight">{label}</div>
      <div className={`font-bold text-sm mt-0.5 ${color}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function Toggle({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5
                  rounded-xl text-sm transition-all border ${
        active
          ? "border-orange-200 text-gray-800"
          : "bg-gray-50 text-gray-400 border-gray-100"
      }`}
      style={active ? {
        background: "rgba(245,73,0,0.06)",
        borderColor: "rgba(245,73,0,0.2)"
      } : {}}
    >
      <span className="text-xs font-medium">{label}</span>
      <div
        className="w-9 h-5 rounded-full relative flex-shrink-0
                   transition-colors"
        style={{ background: active ? "#f54900" : "#e5e7eb" }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white
                     shadow-sm transition-all"
          style={{ left: active ? "18px" : "2px" }}
        />
      </div>
    </button>
  );
}