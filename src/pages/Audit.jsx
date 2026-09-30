import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const ACTION_COLORS = {
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  "Changes Requested": "bg-amber-100 text-amber-800",
  "Value updated": "bg-blue-100 text-blue-800",
  "Submitted for review": "bg-purple-100 text-purple-800",
};

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/audit/list")
      .then(({ data }) => {
        if (!cancelled) setLogs(data || []);
      })
      .catch((err) => {
        if (!cancelled) setError("Failed to load audit trail: " + err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const actions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return ["all", ...Array.from(set)];
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return logs.filter((l) => {
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (!q) return true;
      return (
        l.user_name?.toLowerCase().includes(q) ||
        l.user_code?.toLowerCase().includes(q) ||
        l.entity_slug?.toLowerCase().includes(q) ||
        l.datapoint?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q)
      );
    });
  }, [logs, search, actionFilter]);

  const stats = useMemo(() => {
    const byAction = {};
    logs.forEach((l) => {
      byAction[l.action] = (byAction[l.action] || 0) + 1;
    });
    return {
      total: logs.length,
      approvals: byAction["Approved"] || 0,
      rejections: byAction["Rejected"] || 0,
      edits: byAction["Value updated"] || 0,
    };
  }, [logs]);

  return (
    <div>
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-[12.6px] text-slate-500 mt-0.5">
            Immutable record of every action taken in this portal
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        {[
          ["Total Events", stats.total, "text-slate-800"],
          ["Approvals", stats.approvals, "text-green-600"],
          ["Rejections", stats.rejections, "text-red-600"],
          ["Field Edits", stats.edits, "text-blue-600"],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="bg-white border border-slate-200 rounded-xl p-5"
          >
            <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">
              {label}
            </div>
            <div
              className={`text-[26px] font-extrabold my-1 tracking-tight ${color}`}
            >
              {value}
            </div>
            <div className="text-[11.3px] text-slate-500">All time</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap gap-3 items-center">
          <h3 className="text-sm font-bold text-slate-800 flex-1">Event Log</h3>
          <input
            type="text"
            placeholder="Search name, entity, datapoint…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none w-64"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] focus:border-green-500 outline-none"
          >
            {actions.map((a) => (
              <option key={a} value={a}>
                {a === "all" ? "All Actions" : a}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-10 text-slate-500 text-sm">
            Loading audit log…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-sm font-bold text-slate-700">
              {logs.length === 0 ? "No activity yet" : "No matching events"}
            </div>
            <div className="text-[11.5px] text-slate-500 mt-1">
              {logs.length === 0
                ? "Actions on collection, approvals and submissions will appear here."
                : "Try clearing the search or changing the filter."}
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.4px]">
              <thead>
                <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-5">Time</th>
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Entity</th>
                  <th className="py-3 px-5">Datapoint</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5">Change</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 last:border-b-0"
                  >
                    <td className="py-3 px-5 text-slate-500 text-[11.5px] whitespace-nowrap font-mono">
                      {fmtTime(l.timestamp)}
                    </td>
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-800">
                        {l.user_name}
                      </div>
                      <div className="text-[10.5px] text-slate-400">
                        {l.user_code} · {l.role}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-slate-700 font-mono text-[11.5px]">
                      {l.entity_slug}
                    </td>
                    <td className="py-3 px-5 text-slate-700">
                      <span className="font-mono text-[11.5px]">
                        {l.datapoint}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold ${
                          ACTION_COLORS[l.action] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-[11.5px] text-slate-500 max-w-[240px]">
                      {l.from_value || l.to_value ? (
                        <span className="font-mono">
                          <span className="text-red-500">
                            {l.from_value || "—"}
                          </span>
                          {" → "}
                          <span className="text-green-600">
                            {l.to_value || "—"}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
