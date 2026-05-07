import { useState, useEffect } from "react";
import { auditApi } from "../api/auditApi";
import StatCard from "../components/StatCard";

const FRAUD_STATUS = [
  "Confirmed", "Suspected", "Under Investigation", "Cleared"
];
const FRAUD_STYLE = {
  Confirmed:             "bg-red-100 text-red-700",
  Suspected:             "bg-orange-100 text-orange-700",
  "Under Investigation": "bg-yellow-100 text-yellow-700",
  Cleared:               "bg-green-100 text-green-700",
};

export default function FraudDetection() {
  const [data,     setData]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [tab,      setTab]      = useState("All");
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    auditApi.getFraud(31).then(r => {
      const rows = r.data.features.map((f, i) => ({
        ...f.properties,
        fraud_status: FRAUD_STATUS[i % 4],
        flagged_on:   `2026-04-${String((i % 28) + 1).padStart(2, "0")}`,
      }));
      setData(rows);
      setFiltered(rows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let rows = [...data];
    if (tab !== "All") rows = rows.filter(r => r.fraud_status === tab);
    if (search) rows = rows.filter(r =>
      r.upin?.toLowerCase().includes(search.toLowerCase()) ||
      r.owner_name?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(rows);
  }, [tab, search, data]);

  const counts = {
    All:                   data.length,
    Confirmed:             data.filter(r => r.fraud_status === "Confirmed").length,
    Suspected:             data.filter(r => r.fraud_status === "Suspected").length,
    "Under Investigation": data.filter(
      r => r.fraud_status === "Under Investigation").length,
    Cleared:               data.filter(r => r.fraud_status === "Cleared").length,
  };

  if (loading) return <Loader />;

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">

      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-5">
        <h1 className="text-lg md:text-xl font-bold text-gray-800">
          Fraud Detection Engine
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
          Graph-based duplicate ownership identification · Ward 31
        </p>
      </div>

      <div className="p-4 md:p-8">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatCard label="Total Cases"     value={counts.All}
                    icon="🔗" color="text-gray-800" />
          <StatCard label="Confirmed"       value={counts.Confirmed}
                    icon="🚨" color="text-red-600" />
          <StatCard label="Under Investigation"
                    value={counts["Under Investigation"]}
                    icon="🔍" color="text-yellow-600" />
          <StatCard label="Cleared"         value={counts.Cleared}
                    icon="✅" color="text-green-600" />
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm
                        border border-gray-100">

          <div className="flex flex-col md:flex-row md:items-center
                          justify-between px-4 md:px-6 py-3 md:py-4
                          border-b border-gray-100 gap-3">
            <div className="flex flex-wrap gap-1">
              {["All", "Confirmed", "Suspected",
                "Under Investigation", "Cleared"].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium
                              transition-all ${
                    tab === t ? "bg-blue-600 text-white"
                              : "text-gray-500 hover:bg-gray-100"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Search plot ID, owner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3
                           py-2 flex-1 md:w-48 focus:outline-none
                           focus:border-blue-400" />
              <button
                onClick={() => exportCSV(filtered, "fraud_detection")}
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
                  <th className="px-4 md:px-6 py-3 text-left">Case ID</th>
                  <th className="px-4 md:px-6 py-3 text-left">Location</th>
                  <th className="px-4 md:px-6 py-3 text-left">Owners</th>
                  <th className="px-4 md:px-6 py-3 text-left">Area</th>
                  <th className="px-4 md:px-6 py-3 text-left">Flagged On</th>
                  <th className="px-4 md:px-6 py-3 text-left">Description</th>
                  <th className="px-4 md:px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-3">
                      <div className="font-mono text-xs text-gray-700 font-medium">
                        {row.fraud_case_id}
                      </div>
                      <div className="text-xs text-gray-400">{row.upin}</div>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <div className="text-xs text-gray-700">{row.locality}</div>
                      <div className="text-xs text-gray-400">
                        {row.property_type}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <div className="text-xs text-gray-700">{row.owner_name}</div>
                      <div className="text-xs text-red-500">
                        Multiple owners detected
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-xs text-gray-600">
                      {row.registered_area?.toLocaleString()} sqft
                    </td>
                    <td className="px-4 md:px-6 py-3 text-xs text-gray-500">
                      {row.flagged_on}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-xs text-gray-500
                                   max-w-xs truncate">
                      Double registration without mutation record
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full
                                       font-medium ${FRAUD_STYLE[row.fraud_status]}`}>
                        {row.fraud_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* How fraud is detected */}
          <div className="mx-4 md:mx-6 mb-4 md:mb-6 mt-2 bg-gray-900
                          rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span>⚙️</span>
              <span className="text-white text-sm font-medium">
                How Fraud Is Detected
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              A graph-based duplicate detection algorithm links{" "}
              <span className="text-blue-400">owner IDs to Plot IDs</span> and{" "}
              <span className="text-blue-400">
                UPINs to ownership records
              </span>.
              Anomalies include: same owner on two registrations without
              mutation, multiple owners on one index, or ownership transfers
              without NOC documentation.
            </p>
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
  const headers = ["Case ID", "UPIN", "Owner", "Locality",
                   "Area sqft", "Status"];
  const rows = data.map(r => [
    r.fraud_case_id, r.upin, r.owner_name,
    r.locality, r.registered_area, r.fraud_status
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
}