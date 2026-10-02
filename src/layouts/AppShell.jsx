import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_NAV = {
  "data-entry": ["/", "/collection"],
  approver: ["/", "/approvals"],
  "unit-admin": ["/", "/approvals", "/esg-report", "/sdg-report"],
  "esg-officer": [
    "/",
    "/approvals",
    "/esg-report",
    "/sdg-report",
    "/consolidated",
    "/validation",
    "/audit",
  ],
  "group-admin": [
    "/",
    "/approvals",
    "/esg-report",
    "/sdg-report",
    "/consolidated",
    "/validation",
    "/audit",
  ],
};

const ALL_NAV = [
  {
    group: "Reporting",
    items: [
      { to: "/", label: "Dashboard", icon: "📊" },
      { to: "/collection", label: "BRSR Data Collection", icon: "📝" },
      { to: "/approvals", label: "Approvals", icon: "🖊️" },
      { to: "/esg-report", label: "ESG Report", icon: "🌱" },
      { to: "/sdg-report", label: "SDG Report", icon: "🎯" },
      { to: "/consolidated", label: "Consolidated View", icon: "🗂️" },
    ],
  },
  {
    group: "Controls",
    items: [
      { to: "/validation", label: "Validation Center", icon: "✅" },
      { to: "/audit", label: "Audit Trail", icon: "🕘" },
    ],
  },
];

const ROLE_LABELS = {
  "data-entry": "Data Entry Operator",
  approver: "Entity Approver",
  "unit-admin": "Unit Admin",
  "esg-officer": "ESG Officer",
  "group-admin": "Group Admin",
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const allowedPaths = ROLE_NAV[user?.role] || [];
  const visibleGroups = ALL_NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => allowedPaths.includes(it.to)),
  })).filter((g) => g.items.length > 0);

  const isGroupLevel =
    user?.role === "group-admin" || user?.role === "esg-officer";

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-[#0b1f33] text-slate-300 flex flex-col fixed top-0 left-0 h-screen overflow-y-auto z-40 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-4 border-b border-white/10 flex gap-3 items-center">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-sky-500 grid place-items-center font-extrabold text-[#04231a] flex-shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xs font-bold text-white leading-tight">
              MEIL BRSR Portal
            </h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
              ESG · SDG Suite
            </span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white text-2xl leading-none w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b border-white/10 flex gap-3 items-center">
          <div className="w-9 h-9 rounded-full bg-[#1d4066] grid place-items-center text-xs font-extrabold text-white flex-shrink-0">
            {user?.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {user?.name}
            </div>
            <div className="text-[10px] text-sky-300 font-bold truncate">
              {ROLE_LABELS[user?.role] || user?.role}
            </div>
          </div>
        </div>

        <nav className="p-3 flex-1">
          {visibleGroups.map((g) => (
            <div key={g.group}>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 pt-4 pb-1.5">
                {g.group}
              </div>
              {g.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 w-full px-3 py-2.5 lg:py-2 rounded-lg text-[13.5px] lg:text-[13px] mb-1 transition ${
                      isActive
                        ? "bg-gradient-to-r from-green-500 to-sky-500 text-[#04231a] font-semibold"
                        : "text-slate-300 hover:bg-[#14304f] hover:text-white"
                    }`
                  }
                >
                  <span className="w-[18px] text-center text-sm">
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="m-3 p-2.5 rounded-lg bg-red-500/10 text-red-300 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition"
        >
          ⏻ Sign Out
        </button>

        <div className="px-4 py-3 border-t border-white/10 text-[10.5px] text-slate-600 leading-relaxed hidden lg:block">
          <div className="font-bold text-slate-400">
            FY 2025-26 · Comprehensive
          </div>
          <div className="mt-0.5">SEBI BRSR · 9 NGRBC Principles</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-3 lg:px-6 py-2.5 lg:py-3 flex items-center gap-2 lg:gap-3 sticky top-0 z-20">
          {/* Hamburger menu (mobile only) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100 flex-shrink-0"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Entity chip */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold hidden sm:inline">
              Entity
            </span>
            <span className="px-2.5 lg:px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[12.5px] lg:text-sm font-semibold truncate max-w-[140px] lg:max-w-none">
              {isGroupLevel ? "MEIL Group" : user?.entity}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
              🌐 Group scope
            </span>
          </div>

          <div className="flex-1 min-w-0" />

          {/* Deadline chip — compact on mobile */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
            ⏳ BRSR due in 27 days
          </span>
          <span className="sm:hidden inline-flex items-center px-2 py-1.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            ⏳ 27d
          </span>
        </header>

        <main className="p-3 sm:p-4 lg:p-6 max-w-[1520px] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
