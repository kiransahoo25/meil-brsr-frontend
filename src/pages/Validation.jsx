import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Validation() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState({ high: 0, medium: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Section list (for the "X of Y sections clean" ratio)
        const { data: secs } = await api.get("/collection/sections");
        if (cancelled) return;
        setSections(secs);

        // Validation issues endpoint
        const { data } = await api.get("/validation/issues");
        if (cancelled) return;
        setIssues(data.issues || []);
        setSummary({
          high: data.high || 0,
          medium: data.medium || 0,
          total: data.totalIssues || 0,
        });
      } catch (err) {
        if (cancelled) return;
        setMessage("Failed to load: " + (err?.message || "unknown error"));
        // Fallback: try to compute issues client-side from fields
        try {
          const { data: secs } = await api.get("/collection/sections");
          if (cancelled) return;
          setSections(secs);

          const collected = [];
          for (const sec of secs) {
            try {
              const { data: fields } = await api.get(
                `/collection/${user.entity}/${sec.code}`,
              );
              fields.forEach((f) => {
                if (!f.required) return;
                const missing = !f.value || String(f.value).trim() === "";
                const flagged = f.status === "flagged";
                if (missing || flagged) {
                  collected.push({
                    id: `${sec.code}-${f.id}`,
                    entity: user.entity,
                    section: sec.name,
                    sectionCode: sec.code,
                    field: f.label,
                    code: f.code,
                    severity: flagged ? "high" : "medium",
                    issueType: flagged ? "Flagged value" : "Missing value",
                    status: f.status,
                  });
                }
              });
            } catch {
              // skip section
            }
          }
          if (cancelled) return;
          setIssues(collected);
          setSummary({
            high: collected.filter((i) => i.severity === "high").length,
            medium: collected.filter((i) => i.severity === "medium").length,
            total: collected.length,
          });
        } catch {
          // give up silently
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user.entity]);

  const cleanSections =
    sections.length - new Set(issues.map((i) => i.sectionCode)).size;
  const readyPct = sections.length
    ? Math.round((cleanSections / sections.length) * 100)
    : issues.length === 0
      ? 100
      : 0;

  return (
    <div>
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Validation Center
          </h1>
          <p className="text-[12.6px] text-slate-500 mt-0.5">
            Pre-assurance checks · {user.entity} · FY 2025-26
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">
            Assurance Ready
          </div>
          <div className="text-[26px] font-extrabold my-1 tracking-tight text-green-600">
            {readyPct}%
          </div>
          <div className="text-[11.3px] text-slate-500">
            {cleanSections} of {sections.length || "—"} sections clean
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">
            High Severity
          </div>
          <div className="text-[26px] font-extrabold my-1 tracking-tight text-red-600">
            {summary.high}
          </div>
          <div className="text-[11.3px] text-slate-500">
            Needs immediate fix
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">
            Missing Values
          </div>
          <div className="text-[26px] font-extrabold my-1 tracking-tight text-amber-600">
            {summary.medium}
          </div>
          <div className="text-[11.3px] text-slate-500">
            Required datapoints empty
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">
            Total Issues
          </div>
          <div className="text-[26px] font-extrabold my-1 tracking-tight text-slate-800">
            {summary.total}
          </div>
          <div className="text-[11.3px] text-slate-500">
            Across all sections
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">Issues Detected</h3>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            Fix these before submitting for external assurance
          </p>
        </div>

        {loading && (
          <div className="text-center py-10 text-slate-500 text-sm">
            Running validation checks…
          </div>
        )}

        {!loading && issues.length === 0 && (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm font-bold text-slate-700">
              All checks passed
            </div>
            <div className="text-[11.5px] text-slate-500 mt-1">
              No issues found across {sections.length || 0} sections
            </div>
          </div>
        )}

        {!loading && issues.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.6px]">
              <thead>
                <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-5">Severity</th>
                  <th className="py-3 px-5">Section</th>
                  <th className="py-3 px-5">Datapoint</th>
                  <th className="py-3 px-5">Issue</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 last:border-b-0"
                  >
                    <td className="py-3 px-5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase ${
                          i.severity === "high"
                            ? "bg-red-100 text-red-800"
                            : i.severity === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {i.severity}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-700">{i.section}</td>
                    <td className="py-3 px-5">
                      <div className="text-slate-800 font-medium">
                        {i.field}
                      </div>
                      <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                        {i.code}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-slate-600">{i.issueType}</td>
                    <td className="py-3 px-5">
                      <span className="text-[11px] text-slate-500 capitalize">
                        {i.status}
                      </span>
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
