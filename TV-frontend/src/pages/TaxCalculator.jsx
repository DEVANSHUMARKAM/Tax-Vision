import { useState } from "react";
import { auditApi } from "../api/auditApi";

export default function TaxCalculator() {
  const [upin,    setUpin]    = useState("");
  const [params,  setParams]  = useState({
    structure: "RCC",
    age_band:  "10-20",
    occupancy: "self",
  });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const calculate = async () => {
    if (!upin.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.getTaxBreakdown(
        upin.trim().toUpperCase(), params
      );
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Property not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-xl font-bold text-gray-800">
          NMC Tax Calculator
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Unit Area System — Annual Letting Value method · Official NMC formula
        </p>
      </div>

      <div className="p-8 max-w-4xl mx-auto space-y-6">

        {/* Formula explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="font-semibold text-blue-800 mb-2">
            NMC Formula — Unit Area System
          </div>
          <div className="font-mono text-sm text-blue-700 bg-blue-100
                          rounded-xl px-4 py-3">
            ALV = Area (sqm) × UAV × Usage Factor × Structure Factor
                  × Age Factor × Occupancy Factor
          </div>
          <div className="mt-2 text-xs text-blue-600">
            Tax = 7% of ALV (if ALV ≤ ₹50,000) &nbsp;|&nbsp;
            Tax = 10% of ALV (if ALV &gt; ₹50,000)
          </div>
        </div>

        {/* Input form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            Property Parameters
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">
                UPIN / Index Number
              </label>
              <input
                value={upin}
                onChange={e => setUpin(e.target.value)}
                onKeyDown={e => e.key === "Enter" && calculate()}
                placeholder="e.g. NMC-HN-01216"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                           text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Structure Type
              </label>
              <select
                value={params.structure}
                onChange={e => setParams(p => ({...p, structure: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                           text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="RCC">RCC (Factor: 1.0)</option>
                <option value="Semi-RCC">Semi-RCC (Factor: 0.8)</option>
                <option value="Temporary">Temporary (Factor: 0.5)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Building Age
              </label>
              <select
                value={params.age_band}
                onChange={e => setParams(p => ({...p, age_band: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                           text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="0-5">0–5 years (Factor: 1.0)</option>
                <option value="5-10">5–10 years (Factor: 0.95)</option>
                <option value="10-20">10–20 years (Factor: 0.9)</option>
                <option value="20-30">20–30 years (Factor: 0.8)</option>
                <option value="30+">30+ years (Factor: 0.7)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Occupancy Type
              </label>
              <select
                value={params.occupancy}
                onChange={e => setParams(p => ({...p, occupancy: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                           text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="self">Self Occupied (Factor: 1.0)</option>
                <option value="rented">Rented (Factor: 1.5)</option>
                <option value="vacant">Vacant (Factor: 0.5)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={calculate}
                disabled={loading || !upin.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                           text-white rounded-xl py-2.5 text-sm font-medium
                           transition-colors"
              >
                {loading ? "Calculating..." : "Calculate Tax"}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">

            {/* Owner info */}
            <div className="bg-white rounded-2xl shadow-sm border
                            border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-bold text-gray-800 text-lg">
                    {result.owner_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.upin} · {result.locality} · {result.property_type}
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  result.tax_status === "paid"
                    ? "bg-green-100 text-green-700"
                    : result.tax_status === "defaulted"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {result.tax_status}
                </span>
              </div>

              {/* Formula used */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs
                              text-gray-500 font-mono">
                {result.registered_breakdown?.formula}
              </div>
            </div>

            {/* Side by side comparison */}
            <div className="grid grid-cols-2 gap-4">

              {/* Registered */}
              <div className="bg-white rounded-2xl shadow-sm border
                              border-gray-100 p-6">
                <div className="font-semibold text-gray-700 mb-4 flex
                                items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-400 inline-block"/>
                  Registered Area (NMC Records)
                </div>
                <BreakdownTable data={result.registered_breakdown} />
              </div>

              {/* Actual */}
              <div className="bg-white rounded-2xl shadow-sm border
                              border-blue-200 p-6">
                <div className="font-semibold text-gray-700 mb-4 flex
                                items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"/>
                  Actual Area (Satellite Truth)
                </div>
                <BreakdownTable data={result.actual_breakdown} highlight />
              </div>
            </div>

            {/* Revenue loss card */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="font-bold text-red-700 text-lg mb-4">
                💸 Revenue Loss Summary
              </div>
              <div className="grid grid-cols-3 gap-6">
                <LossCard
                  label="Tax Owner Pays"
                  value={`₹${result.registered_breakdown?.base_tax?.toLocaleString()}`}
                  color="text-gray-700" />
                <LossCard
                  label="Tax Owner Should Pay"
                  value={`₹${result.actual_breakdown?.base_tax?.toLocaleString()}`}
                  color="text-blue-700" />
                <LossCard
                  label="Annual Revenue Gap"
                  value={`₹${result.revenue_loss?.annual_revenue_gap?.toLocaleString()}`}
                  color="text-red-700" />
              </div>
              <div className="mt-4 text-sm text-red-600">
                NMC is losing{" "}
                <strong>
                  ₹{result.revenue_loss?.annual_revenue_gap?.toLocaleString()}
                </strong>{" "}
                per year from this property alone due to{" "}
                <strong>{result.revenue_loss?.mismatch_pct}% under-registration</strong>.
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function BreakdownTable({ data, highlight }) {
  if (!data) return null;
  const rows = [
    ["Area",              `${data.area_sqft?.toFixed(1)} sqft (${data.area_sqm} sqm)`],
    ["Unit Area Value",   `₹${data.unit_area_value}/sqm/year`],
    ["Usage Factor",      data.usage_factor],
    ["Structure Factor",  data.structure_factor],
    ["Age Factor",        data.age_factor],
    ["Occupancy Factor",  data.occupancy_factor],
    ["ALV",               `₹${data.alv?.toLocaleString()}`],
    ["Tax Rate",          `${data.tax_rate_pct}%`],
    ["Base Tax",          `₹${data.base_tax?.toLocaleString()}`],
  ];

  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-gray-100">
        {rows.map(([label, value], i) => (
          <tr key={i}
            className={i === rows.length - 1 && highlight
              ? "bg-blue-50" : ""}>
            <td className="py-1.5 text-gray-500 text-xs">{label}</td>
            <td className={`py-1.5 text-right font-medium text-xs ${
              i === rows.length - 1
                ? highlight ? "text-blue-700 font-bold" : "text-gray-800 font-bold"
                : "text-gray-700"
            }`}>
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LossCard({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}