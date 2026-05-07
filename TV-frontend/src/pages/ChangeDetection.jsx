import { useState, useEffect } from "react";
import { auditApi } from "../api/auditApi";
import StatCard from "../components/StatCard";

const STATUS_STYLE = {
  Flagged:        "bg-red-100 text-red-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Resolved:       "bg-green-100 text-green-700",
  Clear:          "bg-gray-100 text-gray-600",
};

export default function ChangeDetection() {
  const [data,      setData]      = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [tab,       setTab]       = useState("All");
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sortField, setSortField] = useState("mismatch_pct");
  const [sortDir,   setSortDir]   = useState("desc");

  useEffect(() => {
    auditApi.getFlagged(31).then(r => {
      const rows = r.data.features.map((f, i) => ({
        ...f.properties,
        status: i % 8 === 0 ? "Resolved"
              : i % 5 === 0 ? "Under Review"
              : i % 12 === 0 ? "Clear"
              : "Flagged",
        detected_on: `2026-04-${String((i % 28) + 1).padStart(2, "0")}`,
      }));
      setData(rows);
      setFiltered(rows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let rows = [...data];
    if (tab !== "All") rows = rows.filter(r => r.status === tab);
    if (search) rows = rows.filter(r =>
      r.upin?.toLowerCase().includes(search.toLowerCase()) ||
      r.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.locality?.toLowerCase().includes(search.toLowerCase())
    );
    rows.sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
    setFiltered(rows);
  }, [tab, search, data, sortField, sortDir]);

  const counts = {
    All:           data.length,
    Flagged:       data.filter(r => r.status === "Flagged").length,
    "Under Review":data.filter(r => r.status === "Under Review").length,
    Resolved:      data.filter(r => r.status === "Resolved").length,
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };

  if (loading) return <Loader />;

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">

      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-5">
        <h1 className="text-lg md:text-xl font-bold text-gray-800">
          Structural Change Detection
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
          Satellite imagery analysis — unregistered construction · Ward 31
        </p>
      </div>

      <div className="p-4 md:p-8">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatCard label="Total Scanned"  value={counts.All}
                    icon="🔍" color="text-gray-800" />
          <StatCard label="Flagged"        value={counts.Flagged}
                    icon="⚠️" color="text-red-600" sub="+18 today" />
          <StatCard label="Under Review"   value={counts["Under Review"]}
                    icon="⏳" color="text-yellow-600" />
          <StatCard label="Resolved"       value={counts.Resolved}
                    icon="✅" color="text-green-600" />
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm
                        border border-gray-100">

          {/* Tabs + Search */}
          <div className="flex flex-col md:flex-row md:items-center
                          justify-between px-4 md:px-6 py-3 md:py-4
                          border-b border-gray-100 gap-3">
            <div className="flex flex-wrap gap-1">
              {["All", "Flagged", "Under Review", "Resolved"].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium
                              transition-all ${
                    tab === t ? "bg-blue-600 text-white"
                              : "text-gray-500 hover:bg-gray-100"}`}>
                  {t}
                  {counts[t] !== undefined && (
                    <span className="ml-1 opacity-70">{counts[t]}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Search plot ID, owner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3
                           py-2 flex-1 md:w-52 focus:outline-none
                           focus:border-blue-400" />
              <button
                onClick={() => exportCSV(filtered, "change_detection")}
                className="text-xs bg-gray-800 text-white px-3 py-2
                           rounded-lg hover:bg-gray-700 whitespace-nowrap">
                ↓ Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500
                               uppercase tracking-wider">
                  <th className="px-4 md:px-6 py-3 text-left">Property</th>
                  <th className="px-4 md:px-6 py-3 text-left">Ward</th>
                  <th
                    className="px-4 md:px-6 py-3 text-left cursor-pointer
                               hover:text-gray-700"
                    onClick={() => handleSort("registered_area")}>
                    Registered Area{" "}
                    {sortField === "registered_area"
                      ? sortDir === "desc" ? "↓" : "↑" : ""}
                  </th>
                  <th
                    className="px-4 md:px-6 py-3 text-left cursor-pointer
                               hover:text-gray-700"
                    onClick={() => handleSort("ai_area_sqft")}>
                    Detected Area{" "}
                    {sortField === "ai_area_sqft"
                      ? sortDir === "desc" ? "↓" : "↑" : ""}
                  </th>
                  <th
                    className="px-4 md:px-6 py-3 text-left cursor-pointer
                               hover:text-gray-700"
                    onClick={() => handleSort("mismatch_pct")}>
                    Deviation{" "}
                    {sortField === "mismatch_pct"
                      ? sortDir === "desc" ? "↓" : "↑" : ""}
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left">Detected On</th>
                  <th className="px-4 md:px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.slice(0, 100).map((row, i) => (
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
                      {row.registered_area?.toLocaleString()} sqft
                    </td>
                    <td className="px-4 md:px-6 py-3 text-xs
                                   text-blue-600 font-medium">
                      {row.ai_area_sqft?.toLocaleString()} sqft
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(row.mismatch_pct, 100)}%`
                            }} />
                        </div>
                        <span className="text-red-600 font-bold text-xs">
                          +{row.mismatch_pct?.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-xs text-gray-500">
                      {row.detected_on}
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full
                                       font-medium ${STATUS_STYLE[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
  const headers = ["UPIN", "Owner", "Locality", "Registered sqft",
                   "AI sqft", "Mismatch %", "Tax Status", "Status"];
  const rows = data.map(r => [
    r.upin, r.owner_name, r.locality,
    r.registered_area, r.ai_area_sqft,
    r.mismatch_pct, r.tax_status, r.status
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
}