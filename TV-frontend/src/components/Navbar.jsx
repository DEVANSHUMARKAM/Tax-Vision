import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

const LINKS = [
  { to: "/dashboard",  label: "Dashboard",        icon: "📊" },
  { to: "/map",        label: "Map View",          icon: "🗺️" },
  { to: "/detection",  label: "Change Detection",  icon: "🔴", count: 2308 },
  { to: "/tax-risk",   label: "Tax Risk",          icon: "🟡", count: 3201 },
  { to: "/fraud",      label: "Fraud Detection",   icon: "🟠", count: 100  },
  { to: "/green",      label: "Green Bonus",       icon: "🟢"              },
  { to: "/tax-calc",   label: "Tax Calculator",    icon: "🧮"              },
];

export default function Navbar({ wardLabel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-56 bg-white flex-col h-screen
                        flex-shrink-0 border-r border-gray-100 shadow-sm">

        {/* Logo */}
        <div
          className="p-4 border-b border-gray-100 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center
                         font-bold text-sm text-white flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #f54900, #1a0a00)"
              }}
            >
              T
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm tracking-tight">
                TaxVision
              </div>
              <div className="text-xs text-gray-400">AI Property Intelligence</div>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="p-2 flex-1 overflow-y-auto">
          {LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl
                 mb-0.5 text-xs font-medium transition-all ${
                  isActive
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: "linear-gradient(135deg, #f54900, #1a0a00)" }
                  : {}
              }
            >
              <div className="flex items-center gap-2">
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.count && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "#f5490020", color: "#f54900" }}
                >
                  {link.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Ward info */}
        <div className="p-3 border-t border-gray-100">
          <div className="text-xs text-gray-400">Active Dataset</div>
          <div className="text-xs font-semibold text-gray-700 mt-0.5">
            {wardLabel || "Zone 3 — Ward 31"}
          </div>
          <div className="text-xs text-gray-400">
            Hanuman Nagar · 11,542 buildings
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50
                      bg-white border-b border-gray-100 shadow-sm
                      flex items-center justify-between px-4 py-3">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => { navigate("/"); setMenuOpen(false); }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       font-bold text-xs text-white"
            style={{ background: "linear-gradient(135deg, #f54900, #1a0a00)" }}
          >
            T
          </div>
          <div>
            <div className="text-gray-900 text-sm font-bold">TaxVision</div>
            <div className="text-gray-400 text-xs">Ward 31 · Hanuman Nagar</div>
          </div>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-gray-500 text-xl p-1"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* ── Mobile Dropdown ── */}
      {menuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-50
                        bg-white border-b border-gray-100 shadow-lg
                        px-3 py-2">
          {LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-3 rounded-xl
                 mb-0.5 text-sm font-medium transition-all ${
                  isActive ? "text-white" : "text-gray-500"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: "linear-gradient(135deg, #f54900, #1a0a00)" }
                  : {}
              }
            >
              <div className="flex items-center gap-2">
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.count && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#f5490020", color: "#f54900" }}
                >
                  {link.count}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
}