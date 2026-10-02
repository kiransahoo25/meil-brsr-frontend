import { Outlet, NavLink, useNavigate } from "react-router-dom";
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

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const allowedPaths = ROLE_NAV[user?.role] || [];
  const visibleGroups = ALL_NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => allowedPaths.includes(it.to)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-[#0b1f33] text-slate-300 flex flex-col fixed top-0 left-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-white/10 flex gap-3 items-center">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-sky-500 grid place-items-center font-extrabold text-[#04231a]">
            M
          </div>
          <div>
            <h1 className="text-xs font-bold text-white leading-tight">
              MEIL BRSR Portal
            </h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
              ESG · SDG Suite
            </span>
          </div>
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
                    `flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] mb-1 transition ${
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

        <div className="px-4 py-3 border-t border-white/10 text-[10.5px] text-slate-600 leading-relaxed">
          <div className="font-bold text-slate-400">
            FY 2025-26 · Comprehensive
          </div>
          <div className="mt-0.5">SEBI BRSR · 9 NGRBC Principles</div>
        </div>
      </aside>

      <div className="flex-1 ml-64 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 flex-wrap sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">
              Entity
            </span>
            <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold">
              {user?.role === "group-admin" || user?.role === "esg-officer"
                ? "MEIL Group"
                : user?.entity}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-green-100 text-green-800 border border-green-200">
              🌐 Group scope
            </span>
          </div>
          <div className="flex-1" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            ⏳ BRSR due in 27 days
          </span>
        </header>

        <main className="p-6 max-w-[1520px] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
