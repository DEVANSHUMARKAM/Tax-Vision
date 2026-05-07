export default function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5
                    shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1 truncate">{label}</div>
          <div className={`text-lg md:text-2xl font-bold truncate
                          ${color || "text-gray-800"}`}>
            {value ?? "—"}
          </div>
          {sub && (
            <div className="text-xs text-gray-400 mt-0.5 truncate">{sub}</div>
          )}
        </div>
        {icon && (
          <div className="text-xl md:text-2xl ml-2 flex-shrink-0">{icon}</div>
        )}
      </div>
    </div>
  );
}