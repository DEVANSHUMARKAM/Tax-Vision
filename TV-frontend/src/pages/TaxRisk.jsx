import { useState, useEffect } from "react";
import { auditApi } from "../api/auditApi";
import StatCard from "../components/StatCard";

export default function TaxRisk() {
  const [data,     setData]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [tab,      setTab]      = useState("All");
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    auditApi.getTaxRisk(31).then(r => {
      const rows = r.data.features.map(f => f.properties);
      setData(rows);
      setFiltered(rows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let rows = [...data];
    if (tab === "High")   rows = rows.filter(r => r.risk_score >= 0.75);
    if (tab === "Medium") rows = rows.filter(
      r => r.risk_score >= 0.50 && r.risk_score < 0.75);
    if (tab === "Low")    rows = rows.filter(r => r.risk_score < 0.50);
    if (search) rows = rows.filter(r =>
      r.upin?.toLowerCase().includes(search.toLowerCase()) ||
      r.owner_name?.toLowerCase().includes(search.toLowerCase())
    );
    rows.sort((a, b) => b.risk_score - a.risk_score);
    setFiltered(rows);
  }, [tab, search, data]);

  const high    = data.filter(r => r.risk_score >= 0.75).length;
  const medium  = data.filter(
    r => r.risk_score >= 0.50 && r.risk_score < 0.75).length;
  const totalDue = data.reduce((s, r) => s + (r.due_amount || 0), 0);

  if (loading) return <Loader />;

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">

      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-5">
        <h1 className="text-lg md:text-xl font-bold text-gray-800">
          Tax Default Risk Prediction
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
          Random Forest classifier — 6-month default probability · Ward 31
        </p>
      </div>

      <div className="p-4 md:p-8">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatCard label="Predictions Made" value={data.length}
                    icon="📊" color="text-gray-800" />
          <StatCard label="High Risk"  value={high}
                    icon="🔴" color="text-red-600" sub="Score > 75%" />
          <StatCard label="Medium Risk" value={medium}
                    icon="🟡" color="text-yellow-600" sub="Score 50–75%" />
          <StatCard
            label="Revenue at Risk"
            value={`₹${(totalDue / 100000).toFixed(1)}L`}
            icon="₹" color="text-red-600" />
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm
                        border border-gray-100">

          <div className="flex flex-col md:flex-row md:items-center
                          justify-between px-4 md:px-6 py-3 md:py-4
                          border-b border-gray-100 gap-3">
            <div className="flex flex-wrap gap-1">
              {["All", "High", "Medium", "Low"].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium
                              transition-all ${
                    tab === t ? "bg-blue-600 text-white"
                              : "text-gray-500 hover:bg-gray-100"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Search owner, plot ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3
                           py-2 flex-1 md:w-52 focus:outline-none
                           focus:border-blue-400" />
              <button
                onClick={() => exportCSV(filtered, "tax_risk")}
                className="text-xs bg-gray-800 text-white px-3 py-2
                           rounded-lg hover:bg-gray-700 whitespace-nowrap">
                ↓ Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500
                               uppercase tracking-wider">
                  <th className="px-4 md:px-6 py-3 text-left">Owner / Plot</th>
                  <th className="px-4 md:px-6 py-3 text-left">Ward</th>
                  <th className="px-4 md:px-6 py-3 text-left">Type</th>
                  <th className="px-4 md:px-6 py-3 text-left">Risk Score</th>
                  <th className="px-4 md:px-6 py-3 text-left">Due Amount</th>
                  <th className="px-4 md:px-6 py-3 text-left">Last Payment</th>
                  <th className="px-4 md:px-6 py-3 text-left">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.slice(0, 100).map((row, i) => {
                  const level = row.risk_score >= 0.75 ? "High"
                              : row.risk_score >= 0.50 ? "Medium" : "Low";
                  const levelStyle = {
                    High:   "bg-red-100 text-red-700",
                    Medium: "bg-yellow-100 text-yellow-700",
                    Low:    "bg-green-100 text-green-700",
                  }[level];

                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 md:px-6 py-3">
                        <div className="font-medium text-gray-800 text-xs">
                          {row.owner_name}
                        </div>
                        <div className="text-gray-400 text-xs">{row.upin}</div>
                        <div className="text-gray-400 text-xs">{row.locality}</div>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-xs text-gray-600">
                        Ward 31
                      </td>
                      <td className="px-4 md:px-6 py-3 text-xs text-gray-600">
                        {row.property_type}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                level === "High"   ? "bg-red-500"    :
                                level === "Medium" ? "bg-yellow-500" :
                                                    "bg-green-500"
                              }`}
                              style={{ width: `${row.risk_pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-700">
                            {row.risk_pct?.toFixed(0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-xs
                                     font-medium text-red-600">
                        ₹{row.due_amount?.toLocaleString()}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-xs text-gray-500">
                        {row.last_payment_date}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full
                                         font-medium ${levelStyle}`}>
                          {level} Risk
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 md:px-6 py-3 border-t border-gray-100
                          text-xs text-gray-400">
            Showing {Math.min(filtered.length, 100)} of{" "}
            {filtered.length} records
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-3xl animate-spin mb-3">⚙️</div>
        <p className="text-gray-500 text-sm">Loading data...</p>
      </div>
    </div>
  );
}

function exportCSV(data, filename) {
  const headers = ["UPIN", "Owner", "Locality", "Risk Score",
                   "Due Amount", "Last Payment"];
  const rows = data.map(r => [
    r.upin, r.owner_name, r.locality,
    r.risk_score, r.due_amount, r.last_payment_date
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
}