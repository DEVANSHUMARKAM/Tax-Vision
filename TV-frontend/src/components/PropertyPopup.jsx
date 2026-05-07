import { Popup } from "react-leaflet";

const FLAG_CONFIG = {
  illegal_extension: { label: "Illegal Extension",  bg: "bg-red-50",    border: "border-red-200",    badge: "bg-red-100 text-red-800"    },
  tax_risk:          { label: "Tax Default Risk",   bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-800"},
  fraud_double_sold: { label: "Fraud — Double Sold",bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-800"},
  green_reward:      { label: "Green Reward",       bg: "bg-green-50",  border: "border-green-200",  badge: "bg-green-100 text-green-800"  },
  clean:             { label: "Clean Property",     bg: "bg-blue-50",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-800"    },
};

export default function PropertyPopup({ feature, position, onClose }) {
  const p   = feature.properties;
  const cfg = FLAG_CONFIG[p.flag_type] || FLAG_CONFIG.clean;

  return (
    <Popup position={position} onClose={onClose} maxWidth={340} minWidth={300}>
      <div className="font-sans text-sm">

        {/* Header */}
        <div className={`${cfg.bg} ${cfg.border} border rounded-lg p-3 mb-3`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-gray-400">{p.upin}</span>
          </div>
          <div className="mt-1 font-semibold text-gray-800 text-base">{p.owner_name}</div>
          <div className="text-xs text-gray-500">{p.locality} · {p.property_type}</div>
        </div>

        {/* Area comparison */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded p-2 text-center">
            <div className="text-xs text-gray-500">Registered Area</div>
            <div className="font-bold text-gray-800">
              {p.registered_area?.toLocaleString()} sqft
            </div>
          </div>
          <div className="bg-gray-50 rounded p-2 text-center">
            <div className="text-xs text-gray-500">AI Detected</div>
            <div className="font-bold text-blue-700">
              {p.ai_area_sqft?.toLocaleString()} sqft
            </div>
          </div>
        </div>

        {/* Mismatch bar */}
        {p.mismatch_pct > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Area Mismatch</span>
              <span className={`font-bold ${p.mismatch_pct > 20 ? "text-red-600" : "text-gray-600"}`}>
                +{p.mismatch_pct?.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${p.mismatch_pct > 20 ? "bg-red-500" : "bg-blue-400"}`}
                style={{ width: `${Math.min(p.mismatch_pct, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Details table */}
        <table className="w-full text-xs">
          <tbody>
            <Row label="Tax Status"  value={p.tax_status}  highlight={p.tax_status === "defaulted"} />
            <Row label="Risk Score"  value={`${((p.risk_score || 0) * 100).toFixed(1)}%`} highlight={p.risk_score > 0.6} />
            <Row label="NDVI Score"  value={`${((p.ndvi_score || 0) * 100).toFixed(1)}%`} />
            <Row label="Base Tax"    value={`₹${p.base_tax_amount?.toLocaleString()}`} />
            {p.due_amount > 0 && (
              <Row label="Due Amount" value={`₹${p.due_amount?.toLocaleString()}`} highlight />
            )}
            {p.discount_pct > 0 && (
              <Row label="Discount"   value={`${p.discount_pct}% off`} green />
            )}
            {p.is_fraud && (
              <Row label="Fraud"      value="Double-sold plot" highlight />
            )}
          </tbody>
        </table>
      </div>
    </Popup>
  );
}

function Row({ label, value, highlight, green }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-1 text-gray-500 pr-2">{label}</td>
      <td className={`py-1 font-medium text-right ${
        highlight ? "text-red-600" : green ? "text-green-600" : "text-gray-800"
      }`}>
        {value ?? "—"}
      </td>
    </tr>
  );
}