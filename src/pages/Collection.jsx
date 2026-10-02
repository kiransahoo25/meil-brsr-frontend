import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

// Fields that require evidence attachment
const EVIDENCE_REQUIRED = new Set([
  "P6-E1", // Renewable energy consumed
  "P6-E3a", // Scope 1
  "P6-E3b", // Scope 2
  "P6-E3c", // Scope 3
  "P6-E2", // Water withdrawal
  "P3-E5", // Fatalities
  "P8-E2", // CSR expenditure
  "Core-1", // GHG intensity
]);

// Client-side anomaly detection
function detectAnomaly(field, value) {
  if (!value || value === "") return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;

  // Percentage must be 0–100
  if (field.unit === "%" && (num < 0 || num > 100)) {
    return "Percentage must be between 0 and 100";
  }

  // Cannot be negative for these units
  if (["tCO2e", "GJ", "KL"].includes(field.unit) && num < 0) {
    return `${field.unit} value cannot be negative`;
  }

  // Sanity checks
  if (field.code === "P3-E5" && num > 20) {
    return "Fatalities count seems unusually high — please verify";
  }
  if (field.code === "P6-E1" && num > 10000000) {
    return "Value seems unusually large — verify units (GJ vs kWh?)";
  }
  if (field.code === "P6-E2" && num > 1000000) {
    return "Water withdrawal seems unusually large — verify units";
  }
  if (field.code === "P8-E2" && num > 1000) {
    return "CSR expenditure seems unusually large — verify units (Rs crore)";
  }

  // Generic threshold for very large numbers
  if (num > 500000000) {
    return "Value seems unusually large — please verify";
  }

  return null;
}

export default function Collection() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [evidenceOpen, setEvidenceOpen] = useState(null);

  useEffect(() => {
    api
      .get("/collection/sections")
      .then(({ data }) => {
        setSections(data);
        if (data[0]) setActiveSection(data[0].code);
      })
      .catch((err) => {
        setMessage("Failed to load sections: " + err.message);
        setMsgType("error");
      });
  }, []);

  useEffect(() => {
    if (!activeSection) return;
    setLoading(true);
    api
      .get(`/collection/${user.entity}/${activeSection}`)
      .then(({ data }) => {
        setFields(data);
        setLoading(false);
      })
      .catch((err) => {
        setMessage("Failed to load fields: " + err.message);
        setMsgType("error");
        setLoading(false);
      });
  }, [activeSection, user.entity]);

  async function updateField(fieldId, value) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, value, status: "complete" } : f,
      ),
    );
    try {
      await api.patch(`/collection/field/${fieldId}`, null, {
        params: { value },
      });
    } catch (err) {
      setMessage("Save failed: " + err.message);
      setMsgType("error");
    }
  }

  async function handleSubmitAll() {
    if (!window.confirm("Submit all complete sections for review?")) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/collection/submit-all/${user.entity}`);
      let msg = `✓ Submitted ${data.submitted_count} section(s): ${data.submitted_sections.join(", ")}`;
      if (data.skipped_count > 0) {
        msg += `  ·  Skipped ${data.skipped_count}: ${data.skipped_sections
          .map((s) => `${s.section}`)
          .join(", ")}`;
      }
      setMessage(msg);
      setMsgType(data.skipped_count > 0 ? "warn" : "success");
    } catch (err) {
      setMessage("Submit All failed: " + err.message);
      setMsgType("error");
    } finally {
      setBusy(false);
    }
  }

  // Compute per-section completeness from currently loaded fields
  function sectionCompletion(code) {
    if (code === activeSection && fields.length > 0) {
      const done = fields.filter((f) => f.value).length;
      return {
        done,
        total: fields.length,
        pct: Math.round((done / fields.length) * 100),
      };
    }
    return null;
  }

  const current = sections.find((s) => s.code === activeSection);
  const loadedComplete = fields.filter((f) => f.value).length;

  const msgClasses =
    msgType === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : msgType === "error"
        ? "bg-red-50 border-red-200 text-red-800"
        : msgType === "warn"
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-blue-50 border-blue-200 text-blue-800";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            BRSR Data Collection
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {user.entity} · FY 2025-26 · Fill in the required values below
          </p>
        </div>
        <button
          onClick={handleSubmitAll}
          disabled={busy}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-[13.5px] hover:shadow-lg transition disabled:opacity-60"
        >
          {busy ? "Submitting…" : "✓ Submit All Sections"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-5 border px-4 py-3 rounded-xl text-[12.6px] leading-relaxed ${msgClasses}`}
        >
          {message}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
        {/* Sidebar: Sections */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 h-fit lg:sticky lg:top-20">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold px-3 pt-2 pb-3">
            Sections ({sections.length})
          </div>
          {sections.map((s, idx) => {
            const active = activeSection === s.code;
            const stat = sectionCompletion(s.code);
            const complete = stat && stat.pct === 100;
            return (
              <button
                key={s.code}
                onClick={() => setActiveSection(s.code)}
                className={`w-full text-left px-3 py-3 rounded-xl mb-1.5 transition border ${
                  active
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-sm"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex-shrink-0 grid place-items-center text-[11px] font-extrabold ${
                      complete
                        ? "bg-green-500 text-white"
                        : active
                          ? "bg-green-600 text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {complete ? "✓" : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13px] font-bold truncate ${
                        active ? "text-green-800" : "text-slate-800"
                      }`}
                    >
                      {s.name}
                    </div>
                    <div className="text-[10.8px] text-slate-500 truncate mt-0.5">
                      {s.sub}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main: Fields */}
        <div>
          {/* Section header */}
          {current && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <h3 className="text-[17px] font-extrabold text-slate-900">
                    {current.name}
                  </h3>
                  <p className="text-[12px] text-slate-500 mt-1">
                    {current.sub} · Owner: <b>{current.owner}</b>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-slate-900">
                      {loadedComplete}
                      <span className="text-slate-400 text-base">
                        /{fields.length}
                      </span>
                    </div>
                    <div className="text-[10.5px] uppercase tracking-wider font-bold text-slate-500">
                      filled
                    </div>
                  </div>
                </div>
              </div>
              {fields.length > 0 && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                    style={{
                      width: `${(loadedComplete / fields.length) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-2xl">
              Loading fields…
            </div>
          )}

          {!loading && fields.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm">
              No fields found for this section.
            </div>
          )}

          {/* Field cards */}
          {!loading &&
            fields.map((f) => {
              const filled = !!f.value;
              const missingRequired = f.required && !f.value;
              const anomaly = detectAnomaly(f, f.value);
              const needsEvidence = EVIDENCE_REQUIRED.has(f.code);

              return (
                <div
                  key={f.id}
                  className={`bg-white border-2 rounded-2xl p-5 mb-3 transition ${
                    anomaly
                      ? "border-red-300 bg-red-50/40"
                      : missingRequired
                        ? "border-amber-200 bg-amber-50/20"
                        : filled
                          ? "border-slate-200"
                          : "border-slate-200"
                  }`}
                >
                  {/* Top row: code + label + status */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-[10.5px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                          {f.code}
                        </span>
                        {f.required && (
                          <span className="text-[10px] font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            REQUIRED
                          </span>
                        )}
                        {needsEvidence && (
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            📎 EVIDENCE NEEDED
                          </span>
                        )}
                      </div>
                      <div className="text-[14.5px] font-bold leading-snug text-slate-900">
                        {f.label}
                      </div>
                    </div>
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full grid place-items-center text-[14px] font-bold ${
                        anomaly
                          ? "bg-red-100 text-red-700"
                          : filled
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {anomaly ? "!" : filled ? "✓" : "·"}
                    </div>
                  </div>

                  {/* Input */}
                  {f.field_type === "textarea" ? (
                    <textarea
                      value={f.value}
                      onChange={(e) => updateField(f.id, e.target.value)}
                      placeholder="Type your answer here…"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-[14px] min-h-[80px] font-medium placeholder:text-slate-400"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type={f.field_type === "number" ? "number" : "text"}
                        value={f.value}
                        onChange={(e) => updateField(f.id, e.target.value)}
                        placeholder={
                          f.field_type === "number" ? "0" : "Enter value…"
                        }
                        className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-[14px] font-medium placeholder:text-slate-400"
                      />
                      {f.unit && (
                        <span className="px-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 whitespace-nowrap">
                          {f.unit}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Anomaly warning */}
                  {anomaly && (
                    <div className="mt-3 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-r-lg text-[12.5px] font-semibold">
                      ⚠️ <strong>Unusual value:</strong> {anomaly}
                    </div>
                  )}

                  {/* Original backend warning */}
                  {f.warn && !anomaly && (
                    <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 text-amber-900 px-4 py-3 rounded-r-lg text-[12.5px]">
                      ⚠️ {f.warn}
                    </div>
                  )}

                  {/* Evidence button (only for selected fields) */}
                  {needsEvidence && (
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setEvidenceOpen(f.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border-2 border-blue-200 text-blue-700 font-bold text-[12.5px] hover:bg-blue-100 transition"
                      >
                        📎 Attach Evidence
                      </button>
                      <span className="text-[11.5px] text-slate-500">
                        Required for assurance — attach invoice, meter reading,
                        or signed declaration
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Bottom submit */}
          {!loading && fields.length > 0 && (
            <div className="mt-5 bg-white border-2 border-dashed border-green-300 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold text-slate-800 text-[14px]">
                  Ready to submit all sections?
                </div>
                <div className="text-[12px] text-slate-500 mt-1">
                  All filled sections will be sent to your Entity Approver for
                  review.
                </div>
              </div>
              <button
                onClick={handleSubmitAll}
                disabled={busy}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-[13.5px] hover:shadow-lg transition disabled:opacity-60"
              >
                {busy ? "Submitting…" : "✓ Submit All Sections"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Evidence modal placeholder */}
      {evidenceOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => setEvidenceOpen(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Attach Evidence
            </h3>
            <p className="text-[12.5px] text-slate-500 mb-4">
              Upload a PDF, image, or spreadsheet to support this datapoint.
              Evidence is required for assurance purposes.
            </p>
            <label className="block border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition">
              <div className="text-3xl mb-2">📎</div>
              <div className="text-[13px] font-semibold text-slate-700">
                Click to select a file
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                PDF, JPG, PNG, XLSX — up to 10 MB
              </div>
              <input
                type="file"
                className="hidden"
                onChange={() => {
                  alert(
                    "Evidence upload feature coming soon — this is a demo placeholder.",
                  );
                  setEvidenceOpen(null);
                }}
              />
            </label>
            <button
              onClick={() => setEvidenceOpen(null)}
              className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[12.8px] hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
