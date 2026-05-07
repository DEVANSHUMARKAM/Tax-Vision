import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, Legend
} from "recharts";
import { auditApi } from "../api/auditApi";
import StatCard from "../components/StatCard";

const COLORS = {
  red:    "#ef4444",
  yellow: "#f59e0b",
  orange: "#f97316",
  green:  "#22c55e",
  blue:   "#3b82f6",
};

export default function Dashboard() {
  const [summary,      setSummary]      = useState(null);
  const [riskSummary,  setRiskSummary]  = useState(null);
  const [greenSummary, setGreenSummary] = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      auditApi.getSummary(31),
      auditApi.getRiskSummary(31),
      auditApi.getGreenSummary(31),
    ]).then(([s, r, g]) => {
      setSummary(s.data);
      setRiskSummary(r.data);
      setGreenSummary(g.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl animate-spin mb-3">⚙️</div>
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  const pieData = [
    { name: "Illegal Extension", value: summary.flagged_deviations, color: COLORS.red    },
    { name: "Tax Risk",          value: riskSummary.high_risk,      color: COLORS.yellow },
    { name: "Fraud",             value: summary.fraud_count,        color: COLORS.orange },
    { name: "Green Reward",      value: summary.green_reward_count, color: COLORS.green  },
    { name: "Clean",
      value: summary.total_properties
           - summary.flagged_deviations
           - summary.fraud_count,                                    color: COLORS.blue   },
  ];

  const barData = [
    { name: "Illegal",  count: summary.flagged_deviations, fill: COLORS.red    },
    { name: "Tax Risk", count: riskSummary.high_risk,      fill: COLORS.yellow },
    { name: "Fraud",    count: summary.fraud_count,        fill: COLORS.orange },
    { name: "Green",    count: summary.green_reward_count, fill: COLORS.green  },
  ];

  const riskBarData = [
    { name: "High",   count: riskSummary.high_risk,   fill: COLORS.red    },
    { name: "Medium", count: riskSummary.medium_risk, fill: COLORS.yellow },
    { name: "Low",    count: riskSummary.low_risk,    fill: COLORS.green  },
  ];

  const ndviData = [
    { name: "Dense",    count: greenSummary.dense_count,    fill: "#16a34a" },
    { name: "Moderate", count: greenSummary.moderate_count, fill: "#22c55e" },
    { name: "Sparse",   count: greenSummary.sparse_count,   fill: "#86efac" },
  ];

  const trendData = [
    { month: "Nov", flagged: 1800, resolved: 200 },
    { month: "Dec", flagged: 1950, resolved: 320 },
    { month: "Jan", flagged: 2050, resolved: 410 },
    { month: "Feb", flagged: 2150, resolved: 490 },
    { month: "Mar", flagged: 2240, resolved: 560 },
    { month: "Apr", flagged: 2308, resolved: 612 },
  ];

  const collectionTrend = [
    { month: "Nov", rate: 44.2 },
    { month: "Dec", rate: 46.8 },
    { month: "Jan", rate: 48.1 },
    { month: "Feb", rate: 49.5 },
    { month: "Mar", rate: 51.3 },
    { month: "Apr", rate: 52.7 },
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-5">
        <h1 className="text-lg md:text-xl font-bold text-gray-800">
          Dashboard — Ward 31 Hanuman Nagar
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
          Nagpur Municipal Corporation · AI Property Intelligence · 11,542 buildings
        </p>
      </div>

      <div className="p-4 md:p-8 space-y-4 md:space-y-8">

        {/* Stat Cards Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Total Properties"
            value={summary.total_properties?.toLocaleString()}
            sub="NMC registered · Ward 31"
            icon="🏠" color="text-gray-800" />
          <StatCard
            label="Flagged Deviations"
            value={summary.flagged_deviations?.toLocaleString()}
            sub="+18 this week"
            icon="⚠️" color="text-red-600" />
          <StatCard
            label="High Risk"
            value={riskSummary.high_risk?.toLocaleString()}
            sub="Default risk > 75%"
            icon="📉" color="text-yellow-600" />
          <StatCard
            label="Fraud Cases"
            value={summary.fraud_count?.toLocaleString()}
            sub="2 confirmed"
            icon="🚨" color="text-orange-600" />
        </div>

        {/* Stat Cards Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Green Bonus"
            value={summary.green_reward_count?.toLocaleString()}
            sub="NDVI > 0.3 + tax paid"
            icon="🌿" color="text-green-600" />
          <StatCard
            label="Tax Collection"
            value={`${summary.tax_collection_rate}%`}
            sub="Current FY"
            icon="📊" color="text-blue-600" />
          <StatCard
            label="Revenue at Risk"
            value={`₹${(summary.revenue_at_risk / 10000000).toFixed(2)} Cr`}
            sub="Predicted defaults"
            icon="₹" color="text-red-600" />
          <div className="bg-blue-600 rounded-xl md:rounded-2xl p-4 md:p-5 text-white">
            <div className="text-xs text-blue-200 mb-1">AI Model Accuracy</div>
            <div className="text-2xl md:text-3xl font-bold">94.3%</div>
            <div className="text-xs text-blue-200 mt-1">U-Net confidence avg.</div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {["U-Net", "XGBoost", "NDVI"].map(t => (
                <span key={t}
                  className="bg-blue-500 text-white text-xs
                             px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Pie Chart */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6
                          shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm md:text-base mb-1">
              Property Audit Status
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Distribution across all flag types
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={v => (
                    <span style={{ fontSize: 10, color: "#6b7280" }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6
                          shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm md:text-base mb-1">
              Flagged Properties by Module
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Count per audit category
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toLocaleString()} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Trend Line */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6
                          shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm md:text-base mb-1">
              Flagged vs Resolved — Monthly
            </h3>
            <p className="text-xs text-gray-400 mb-4">Nov 2025 – Apr 2026</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend iconSize={8}
                  formatter={v => (
                    <span style={{ fontSize: 10 }}>{v}</span>
                  )} />
                <Line type="monotone" dataKey="flagged"
                  stroke={COLORS.red} strokeWidth={2}
                  dot={{ r: 3 }} name="Flagged" />
                <Line type="monotone" dataKey="resolved"
                  stroke={COLORS.green} strokeWidth={2}
                  dot={{ r: 3 }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Collection Rate */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6
                          shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm md:text-base mb-1">
              Tax Collection Rate — Monthly
            </h3>
            <p className="text-xs text-gray-400 mb-4">Ward 31 · FY 2025–26</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis
                  domain={[40, 60]}
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Line type="monotone" dataKey="rate"
                  stroke={COLORS.blue} strokeWidth={2.5}
                  dot={{ r: 3 }} name="Collection Rate" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Risk Distribution */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6
                          shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm md:text-base mb-1">
              Tax Default Risk Distribution
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Random Forest classifier output
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={riskBarData} barSize={45}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toLocaleString()} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* NDVI Distribution */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6
                          shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm md:text-base mb-1">
              NDVI Vegetation Distribution
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Green reward eligible properties
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ndviData} barSize={45}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toLocaleString()} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {ndviData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Flags Table */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm
                        border border-gray-100">
          <div className="px-4 md:px-6 py-4 border-b border-gray-100
                          flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">
                Recent Structural Flags
              </h3>
              <p className="text-xs text-gray-400">Last 7 days</p>
            </div>
            <span className="text-xs text-gray-400">Sorted by deviation %</span>
          </div>
          <RecentFlags />
        </div>

      </div>
    </div>
  );
}

function RecentFlags() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    auditApi.getFlagged(31).then(r => {
      setRows(r.data.features.slice(0, 8).map(f => f.properties));
    });
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500
                         uppercase tracking-wider">
            <th className="px-4 md:px-6 py-3 text-left">Property</th>
            <th className="px-4 md:px-6 py-3 text-left">Locality</th>
            <th className="px-4 md:px-6 py-3 text-left">Mismatch</th>
            <th className="px-4 md:px-6 py-3 text-left">Tax Status</th>
            <th className="px-4 md:px-6 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 md:px-6 py-3">
                <div className="font-medium text-gray-800 text-xs">
                  {row.owner_name}
                </div>
                <div className="text-gray-400 text-xs">{row.upin}</div>
              </td>
              <td className="px-4 md:px-6 py-3 text-xs text-gray-600">
                {row.locality}
              </td>
              <td className="px-4 md:px-6 py-3">
                <span className="text-red-600 font-bold text-xs">
                  +{row.mismatch_pct?.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 md:px-6 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  row.tax_status === "paid"
                    ? "bg-green-100 text-green-700"
                    : row.tax_status === "defaulted"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {row.tax_status}
                </span>
              </td>
              <td className="px-4 md:px-6 py-3">
                <span className="bg-red-100 text-red-700 text-xs
                                 px-2 py-0.5 rounded-full">
                  Flagged
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}