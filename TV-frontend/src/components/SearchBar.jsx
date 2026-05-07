import { useState } from "react";
import { auditApi } from "../api/auditApi";

const STATUS_COLORS = {
  paid:      "bg-green-100 text-green-800",
  defaulted: "bg-red-100 text-red-800",
  pending:   "bg-yellow-100 text-yellow-800",
};

const FLAG_CONFIG = {
  illegal_extension: { label: "🔴 Illegal Extension",   color: "bg-red-900 text-red-300"      },
  tax_risk:          { label: "🟡 Tax Default Risk",    color: "bg-yellow-900 text-yellow-300" },
  fraud_double_sold: { label: "🟠 Fraud — Double Sold", color: "bg-orange-900 text-orange-300" },
  green_reward:      { label: "🟢 Green Reward",        color: "bg-green-900 text-green-300"   },
  clean:             { label: "🔵 Clean Property",      color: "bg-blue-900 text-blue-300"     },
};

export default function SearchBar({ onFound }) {
  const [query,   setQuery]   = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await auditApi.searchByUpin(query.trim().toUpperCase());
      setResult(res.data);
      if (onFound) onFound(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Property not found");
    } finally {
      setLoading(false);
    }
  };

  const flagCfg = FLAG_CONFIG[result?.flag_type] || FLAG_CONFIG.clean;

  return (
   <div className="p-4 border-b border-gray-100">


      {/* Label */}
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
        Search by Index Number
      </div>

      {/* Input row */}
      <div className="flex-1 bg-gray-50 text-gray-800 text-xs rounded-lg px-3 py-2
           border border-gray-200 focus:outline-none focus:border-orange-400
           placeholder-gray-400">
        <input
          type="text"
          placeholder="e.g. NMC-HN-01216"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          className="flex-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2
                     border border-gray-600 focus:outline-none focus:border-blue-500
                     placeholder-gray-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50
           text-white text-xs px-3 py-2 rounded-lg transition-colors"
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-xs text-red-400 bg-red-900 bg-opacity-40
                        rounded-lg px-3 py-2">
          ❌ {error}
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-3 text-xs
           border border-gray-100">

          {/* Owner header */}
          <div className="font-bold text-gray-900 text-sm leading-tight">
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">
                {result.owner_name}
              </div>
              <div className="text-gray-400 mt-0.5">{result.upin}</div>
              <div className="text-gray-400">
                {result.locality} · {result.property_type}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0
                             ${STATUS_COLORS[result.tax_status]}`}>
              {result.tax_status}
            </span>
          </div>

          {/* Flag badge */}
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                          ${flagCfg.color}`}>
            {flagCfg.label}
          </div>

          {/* Area comparison */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-700 rounded-lg p-2 text-center">
              <div className="text-gray-400 text-xs">Registered</div>
              <div className="text-white font-bold">
                {result.registered_area?.toLocaleString()} sqft
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-2 text-center">
              <div className="text-gray-400 text-xs">AI Detected</div>
              <div className="text-blue-400 font-bold">
                {result.ai_area_sqft?.toLocaleString()} sqft
              </div>
            </div>
          </div>

          {/* Mismatch progress bar */}
          {result.mismatch_pct > 0 && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">Area Mismatch</span>
                <span className={result.mismatch_pct > 20
                  ? "text-red-400 font-bold" : "text-gray-300"}>
                  +{result.mismatch_pct?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    result.mismatch_pct > 20 ? "bg-red-500" : "bg-blue-400"
                  }`}
                  style={{ width: `${Math.min(result.mismatch_pct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Key details */}
          <div className="space-y-1.5">
            <Row label="Risk Score"
                 value={`${(result.risk_score * 100).toFixed(1)}%`}
                 warn={result.risk_score > 0.6} />
            <Row label="NDVI Score"
                 value={`${(result.ndvi_score * 100).toFixed(1)}%`} />
            <Row label="Base Tax"
                 value={`₹${result.base_tax_amount?.toLocaleString()}`} />
            <Row label="Due Amount"
                 value={`₹${result.due_amount?.toLocaleString()}`}
                 warn={result.due_amount > 0} />
            {result.discount_pct > 0 && (
              <Row label="Green Discount"
                   value={`${result.discount_pct}% off`}
                   green />
            )}
            <Row label="Last Payment" value={result.last_payment_date} />
            <Row label="Floors"       value={result.floor_count} />
            <Row label="Ward"         value={`Ward ${result.ward_no}`} />
          </div>

          {/* Payment history pills */}
          <div>
            <div className="text-gray-400 mb-1.5">Payment History (last 6 months)</div>
            <div className="flex gap-1 flex-wrap">
              {result.payment_history?.map((h, i) => (
                <span key={i} className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  h === "paid"      ? "bg-green-900 text-green-300" :
                  h === "defaulted" ? "bg-red-900 text-red-300"     :
                                     "bg-yellow-900 text-yellow-300"
                }`}>
                  {h === "paid" ? "✓ Paid" : h === "defaulted" ? "✗ Default" : "? Pending"}
                </span>
              ))}
            </div>
          </div>

          {/* Fraud warning */}
          {result.is_fraud && (
            <div className="bg-orange-900 bg-opacity-50 border border-orange-700
                            rounded-lg px-3 py-2 text-orange-300 text-xs">
              ⚠️ This property is flagged as a double-sold plot.
              Multiple ownership records detected without mutation.
            </div>
          )}

          {/* Locate button */}
          <button
            onClick={() => onFound && onFound(result)}
            style={{ background: "linear-gradient(135deg, #f54900, #7a2400)" }}
className="w-full text-white rounded-lg py-2 text-xs font-medium
           transition-all"
          >
            📍 Locate on Map
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, warn, green }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className={`font-medium ${
        warn  ? "text-red-400"   :
        green ? "text-green-400" :
                "text-gray-200"
      }`}>
        {value ?? "—"}
      </span>
    </div>
  );
}