import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

function colorFor(p) {
  if (p >= 85) return "#10B981";
  if (p >= 65) return "#3B82F6";
  if (p >= 45) return "#F59E0B";
  return "#EF4444";
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [group, setGroup] = useState(null);

  // Load standard stats for all roles
  useEffect(() => {
    api.get("/dashboard/stats").then(({ data }) => setStats(data));
  }, []);

  // Load group overview ONLY for group-admin
  useEffect(() => {
    if (user.role === "group-admin") {
      api.get("/group/overview").then(({ data }) => setGroup(data));
    }
  }, [user.role]);

  // ============================================================
  // GROUP ADMIN VIEW
  // ============================================================
  if (user.role === "group-admin") {
    if (!group) {
      return (
        <div className="text-center py-20 text-slate-500">
          Loading group overview…
        </div>
      );
    }

    const { totals, units } = group;
    const equityUnits = units.filter((u) => u.ownership_pct < 100);

    return (
      <div>
        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hi, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            MEIL Group overview · 7 Business Units + 4 Subsidiaries · FY 2025-26
          </p>
        </div>

        {/* Group hero card */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0b1f33] text-white rounded-2xl p-5 lg:p-7 mb-5">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                Group-Wide BRSR Completion
              </div>
              <div className="text-5xl font-extrabold mt-2 tracking-tight">
                {totals.avgProgress}
                <span className="text-2xl text-slate-500">%</span>
              </div>
              <div className="text-[12.5px] text-slate-400 mt-2 max-w-md">
                Average across all {totals.units} reporting units.
              </div>
            </div>

            <div className="flex gap-5 flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-extrabold">{totals.units}</div>
                <div className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400 mt-1">
                  Units
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-green-400">
                  {totals.approved}
                </div>
                <div className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400 mt-1">
                  Approved
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-blue-400">
                  {totals.submitted}
                </div>
                <div className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400 mt-1">
                  In Review
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-red-400">
                  {totals.rejected}
                </div>
                <div className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400 mt-1">
                  Rejected
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
          <button
            onClick={() => navigate("/consolidated")}
            className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-green-100 text-green-700 grid place-items-center text-xl mb-3">
              🗂️
            </div>
            <div className="font-bold text-slate-800">Consolidated View</div>
            <div className="text-[12px] text-slate-500 mt-1">
              All units, equity share, and improvement points
            </div>
          </button>
          <button
            onClick={() => navigate("/esg-report")}
            className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center text-xl mb-3">
              🌱
            </div>
            <div className="font-bold text-slate-800">ESG Report</div>
            <div className="text-[12px] text-slate-500 mt-1">
              Group view or per-unit drill-down
            </div>
          </button>
          <button
            onClick={() => navigate("/sdg-report")}
            className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-green-300 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 grid place-items-center text-xl mb-3">
              🎯
            </div>
            <div className="font-bold text-slate-800">SDG Report</div>
            <div className="text-[12px] text-slate-500 mt-1">
              UN Sustainable Development Goals alignment
            </div>
          </button>
        </div>

        {/* Units grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-[14px] font-bold">All Units</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Click any unit to view its ESG report
              </p>
            </div>
            <button
              onClick={() => navigate("/consolidated")}
              className="text-[12.5px] font-semibold text-green-700 hover:text-green-800"
            >
              See all →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map((u) => (
              <button
                key={u.slug}
                onClick={() => navigate(`/esg-report?unit=${u.slug}`)}
                className="text-left border border-slate-200 rounded-xl p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                        {u.code}
                      </span>
                      {u.ownership_pct < 100 && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          {u.ownership_pct}% owned
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] font-bold text-slate-800 leading-tight truncate">
                      {u.name}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5">
                      {u.type}
                    </div>
                  </div>
                  <div
                    className="text-lg font-extrabold tabular-nums flex-shrink-0"
                    style={{ color: colorFor(u.overall) }}
                  >
                    {u.overall}%
                  </div>
                </div>

                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${u.overall}%`,
                      background: colorFor(u.overall),
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    <b className="text-green-700">{u.approved}</b> approved
                  </span>
                  <span className="text-slate-500">
                    <b className="text-amber-700">{u.submitted}</b> pending
                  </span>
                  {u.improvements.length > 0 && (
                    <span className="text-amber-700 font-bold">
                      {u.improvements.length} action
                      {u.improvements.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Two-column: Improvements + Equity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Group improvements */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-[14px] font-bold mb-1">
              Action Points — Group Level
            </h3>
            <p className="text-[12px] text-slate-500 mb-4">
              Auto-generated suggestions to grow the group's BRSR score
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {units
                .filter((u) => u.improvements.length > 0)
                .slice(0, 6)
                .map((u) => (
                  <div
                    key={u.slug}
                    className="border border-slate-200 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                        {u.code}
                      </span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {u.name}
                      </span>
                      <span
                        className="ml-auto text-[11px] font-extrabold"
                        style={{ color: colorFor(u.overall) }}
                      >
                        {u.overall}%
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {u.improvements.slice(0, 2).map((imp, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-[11.8px] text-slate-600"
                        >
                          <span className="flex-shrink-0">{imp.icon}</span>
                          <span>{imp.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {units.every((u) => u.improvements.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-[12.5px]">
                  ✓ No action points — all units on track
                </div>
              )}
            </div>
          </div>

          {/* Equity share */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-[14px] font-bold mb-1">
              Equity Share Position
            </h3>
            <p className="text-[12px] text-slate-500 mb-4">
              MEIL Group's ownership in each reporting unit
            </p>

            <table className="w-full text-[12.4px]">
              <thead>
                <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200">
                  <th className="py-2.5 pr-3">Unit</th>
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 text-right">Ownership</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.slug} className="border-b border-slate-100">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {u.code}
                        </span>
                        <span className="font-semibold text-slate-700 truncate">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500 text-[11.5px]">
                      {u.type === "Business Unit" ? "BU" : "Subsidiary"}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`font-mono font-extrabold ${
                          u.ownership_pct === 100
                            ? "text-green-700"
                            : u.ownership_pct >= 60
                              ? "text-blue-700"
                              : "text-amber-700"
                        }`}
                      >
                        {u.ownership_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // DATA ENTRY OPERATOR VIEW
  // ============================================================
  if (user.role === "data-entry") {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hi, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Let's fill in your BRSR data for <b>{user.entity}</b> · FY 2025-26
          </p>
        </div>

        {stats && (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                    Overall Progress
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {stats.overallProgress}%
                  </div>
                </div>
                <button
                  onClick={() => navigate("/collection")}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm hover:shadow-lg transition"
                >
                  📝 Continue Data Entry →
                </button>
              </div>

              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                  style={{ width: `${stats.overallProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-green-700">
                  Sections Complete
                </div>
                <div className="text-3xl font-extrabold text-green-700 mt-1">
                  {
                    stats.sectionProgress.filter((s) => s.progress === 100)
                      .length
                  }
                  <span className="text-lg text-green-600/60">
                    /{stats.sectionProgress.length}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-blue-700">
                  Pending Approval
                </div>
                <div className="text-3xl font-extrabold text-blue-700 mt-1">
                  {stats.pendingApprovals}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-amber-700">
                  Needs Attention
                </div>
                <div className="text-3xl font-extrabold text-amber-700 mt-1">
                  {stats.sectionProgress.filter((s) => s.progress < 100).length}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-[14px] font-bold mb-4">Section Progress</h3>
              <div className="grid gap-3">
                {stats.sectionProgress.map((s) => {
                  const complete = s.progress === 100;
                  return (
                    <button
                      key={s.code}
                      onClick={() => navigate("/collection")}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition text-left border border-slate-100"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex-shrink-0 grid place-items-center font-bold text-[13px] ${
                          complete
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {complete ? "✓" : s.progress + "%"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[13.5px] text-slate-800">
                          {s.name}
                        </div>
                        <div className="text-[11.5px] text-slate-500 truncate mt-0.5">
                          {s.sub}
                        </div>
                      </div>
                      <div className="text-slate-300">›</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ============================================================
  // ENTITY APPROVER VIEW
  // ============================================================
  if (user.role === "approver") {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hi, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review submissions from <b>{user.entity}</b> · FY 2025-26
          </p>
        </div>

        {stats && (
          <>
            <div
              className={`rounded-2xl p-6 mb-5 border-2 ${
                stats.pendingApprovals > 0
                  ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300"
                  : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300"
              }`}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-5">
                  <div
                    className={`w-16 h-16 rounded-2xl grid place-items-center text-3xl font-extrabold ${
                      stats.pendingApprovals > 0
                        ? "bg-amber-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {stats.pendingApprovals > 0 ? stats.pendingApprovals : "✓"}
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-900">
                      {stats.pendingApprovals > 0
                        ? `${stats.pendingApprovals} submission${
                            stats.pendingApprovals > 1 ? "s" : ""
                          } waiting for you`
                        : "You're all caught up!"}
                    </div>
                    <div className="text-[13px] text-slate-600 mt-1">
                      {stats.pendingApprovals > 0
                        ? "Review the data, then approve, reject, or request changes"
                        : "No pending submissions in your scope right now"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/approvals")}
                  className={`px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition ${
                    stats.pendingApprovals > 0
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {stats.pendingApprovals > 0
                    ? "🖊️ Review Now →"
                    : "Open Approvals"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-amber-700">
                  Awaiting Review
                </div>
                <div className="text-3xl font-extrabold text-amber-600 mt-1">
                  {stats.pendingApprovals}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  in your scope
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">
                  Sections Loaded
                </div>
                <div className="text-3xl font-extrabold text-slate-800 mt-1">
                  {stats.sectionProgress.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  BRSR sections active
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">
                  Overall Progress
                </div>
                <div className="text-3xl font-extrabold text-green-600 mt-1">
                  {stats.overallProgress}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  unit completion
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ============================================================
  // DEFAULT VIEW (unit-admin, esg-officer)
  // ============================================================
  if (!stats) {
    return (
      <div className="text-center py-20 text-slate-500">Loading dashboard…</div>
    );
  }

  const kpis = [
    {
      label: "Overall Completion",
      value: `${stats.overallProgress}%`,
      color: "#10B981",
      bar: stats.overallProgress,
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      color: "#F59E0B",
      bar: Math.min(stats.pendingApprovals * 8, 100),
    },
    {
      label: "Sections Complete",
      value: `${stats.sectionProgress.filter((s) => s.progress === 100).length}/${stats.sectionProgress.length}`,
      color: "#3B82F6",
      bar:
        (stats.sectionProgress.filter((s) => s.progress === 100).length /
          Math.max(stats.sectionProgress.length, 1)) *
        100,
    },
    {
      label: "Avg Section Progress",
      value: `${Math.round(
        stats.sectionProgress.reduce((a, b) => a + b.progress, 0) /
          Math.max(stats.sectionProgress.length, 1),
      )}%`,
      color: "#8B5CF6",
      bar:
        stats.sectionProgress.reduce((a, b) => a + b.progress, 0) /
        Math.max(stats.sectionProgress.length, 1),
    },
  ];

  return (
    <div>
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-[12.6px] text-slate-500 mt-0.5">
            <span className="font-mono font-extrabold text-green-700">
              {user.code}
            </span>{" "}
            · {user.role === "esg-officer" ? "All units" : user.entity}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white border border-slate-200 rounded-xl p-5"
          >
            <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">
              {k.label}
            </div>
            <div
              className="text-[26px] font-extrabold my-1 tracking-tight"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
            <div className="h-[5px] rounded-full bg-slate-100 mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${k.bar}%`, background: k.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-[13.5px] font-bold mb-4">
          Completion by BRSR Section
        </h3>
        {stats.sectionProgress.map((s) => (
          <div key={s.code} className="flex items-center gap-2.5 py-1.5">
            <div className="w-[200px] flex-shrink-0 text-[12.6px] text-slate-700 font-medium truncate">
              {s.name} · {s.sub}
            </div>
            <div className="flex-1 h-[9px] bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${s.progress}%`,
                  background: colorFor(s.progress),
                }}
              />
            </div>
            <div className="w-[42px] text-right font-bold text-[12px] tabular-nums">
              {s.progress}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
