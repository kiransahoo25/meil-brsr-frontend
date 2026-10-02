import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

function colorFor(p) {
  if (p >= 85) return "#10B981";
  if (p >= 65) return "#3B82F6";
  if (p >= 45) return "#F59E0B";
  return "#EF4444";
}

function priorityColor(p) {
  if (p === "high") return "border-red-300 bg-red-50";
  if (p === "medium") return "border-amber-300 bg-amber-50";
  return "border-slate-200 bg-slate-50";
}

export default function ConsolidatedReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedUnit, setExpandedUnit] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/group/overview")
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500">
        Loading consolidated report…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-500">
        Could not load consolidated data.
      </div>
    );
  }

  const { totals, units } = data;

  return (
    <div>
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Consolidated BRSR View
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            MEIL Group · All {totals.units} units · FY 2025-26
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-5">
        <div className="bg-gradient-to-br from-slate-900 to-[#0b1f33] text-white rounded-2xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400">
            Group Completion
          </div>
          <div className="text-3xl font-extrabold mt-1">
            {totals.avgProgress}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Average across units
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-blue-700">
            Awaiting Review
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">
            {totals.submitted}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-green-700">
            Approved
          </div>
          <div className="text-3xl font-extrabold text-green-600 mt-1">
            {totals.approved}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-red-700">
            Rejected
          </div>
          <div className="text-3xl font-extrabold text-red-600 mt-1">
            {totals.rejected}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-amber-700">
            Action Points
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">
            {totals.improvements}
          </div>
        </div>
      </div>

      {/* Units table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <h3 className="text-[14px] font-bold mb-4">
          All Units — Completion, Equity &amp; Actions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.6px]">
            <thead>
              <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200">
                <th className="py-2.5 pr-3">Code</th>
                <th className="py-2.5 pr-3">Unit</th>
                <th className="py-2.5 pr-3">Type</th>
                <th className="py-2.5 pr-3 w-[180px]">Completion</th>
                <th className="py-2.5 pr-3 text-right">Equity</th>
                <th className="py-2.5 pr-3 text-center">Submitted</th>
                <th className="py-2.5 pr-3 text-center">Approved</th>
                <th className="py-2.5 pr-3 text-center">Rejected</th>
                <th className="py-2.5 pr-3 text-center">Actions</th>
                <th className="py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr
                  key={u.slug}
                  className="border-b border-slate-100 hover:bg-slate-50/60"
                >
                  <td className="py-2.5 pr-3">
                    <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded font-bold">
                      {u.code}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-slate-800">
                    {u.name}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500 text-[11.5px]">
                    {u.type === "Business Unit" ? "BU" : "Subsidiary"}
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${u.overall}%`,
                            background: colorFor(u.overall),
                          }}
                        />
                      </div>
                      <span className="text-[11.5px] font-bold tabular-nums w-[38px] text-right">
                        {u.overall}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-right">
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
                  <td className="py-2.5 pr-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px]">
                      {u.submitted}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold text-[11px]">
                      {u.approved}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[11px]">
                      {u.rejected}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-center">
                    {u.improvements.length > 0 ? (
                      <button
                        onClick={() =>
                          setExpandedUnit(
                            expandedUnit === u.slug ? null : u.slug,
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] hover:bg-amber-200"
                      >
                        {u.improvements.length} →
                      </button>
                    ) : (
                      <span className="text-green-600 font-bold text-[11px]">
                        ✓
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => navigate(`/esg-report?unit=${u.slug}`)}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action points per unit */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-[14px] font-bold mb-1">
          Action Points — What to Improve
        </h3>
        <p className="text-[12px] text-slate-500 mb-4">
          Auto-generated recommendations to grow each unit's BRSR score
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {units
            .filter((u) => u.improvements.length > 0)
            .map((u) => (
              <div
                key={u.slug}
                className={`border-2 rounded-2xl p-4 ${priorityColor(
                  u.improvements[0]?.priority,
                )}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10.5px] bg-white text-slate-700 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                    {u.code}
                  </span>
                  <span className="text-[13px] font-bold text-slate-800">
                    {u.name}
                  </span>
                  <span
                    className="ml-auto text-[12px] font-extrabold"
                    style={{ color: colorFor(u.overall) }}
                  >
                    {u.overall}%
                  </span>
                </div>

                <div className="space-y-2">
                  {u.improvements.map((imp, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 text-[12.3px] text-slate-700 bg-white/70 border border-white rounded-lg p-2.5"
                    >
                      <span className="flex-shrink-0 text-base">
                        {imp.icon}
                      </span>
                      <span className="leading-relaxed">{imp.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {units.every((u) => u.improvements.length === 0) && (
            <div className="col-span-full text-center py-10 text-slate-400 text-[13px]">
              ✓ No action points — all units are on track
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
