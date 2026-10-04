import { useEffect, useState } from "react";
import api from "../lib/api";
import CommentThread from "./CommentThread";
import TrustBadge from "./TrustBadge";

function FieldCard({ f }) {
  return (
    <div
      className={`border rounded-xl p-3 lg:p-4 mb-2.5 lg:mb-3 ${
        f.status === "flagged"
          ? "border-red-200 bg-red-50/40"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-2 lg:gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10.3px] text-slate-400 font-bold tracking-wide mb-0.5">
            {f.code}
            {f.required && (
              <span className="text-red-500 ml-1">· Required</span>
            )}
          </div>
          <div className="text-[12.5px] lg:text-[12.8px] font-semibold leading-snug text-slate-800">
            {f.label}
          </div>
        </div>
        <span
          className={`flex-shrink-0 px-2 lg:px-2.5 py-0.5 rounded-full text-[10.8px] font-bold ${
            f.status === "complete"
              ? "bg-green-100 text-green-800"
              : f.status === "flagged"
                ? "bg-red-100 text-red-800"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {f.status}
        </span>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] lg:text-[13px] text-slate-800 font-mono break-all">
        {f.value || (
          <span className="text-slate-400 italic">No value entered</span>
        )}
        {f.unit && (
          <span className="text-[11px] text-slate-400 font-sans ml-2">
            {f.unit}
          </span>
        )}
      </div>
      {f.warn && (
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-[11.3px] mt-2 border-l-[3px] border-red-500">
          ⚠️ {f.warn}
        </div>
      )}
    </div>
  );
}

const SECTION_NAMES = {
  A: "Section A · General Disclosures",
  B: "Section B · Management & Process",
  C1: "Principle 1 · Ethics & Transparency",
  C3: "Principle 3 · Employee Wellbeing",
  C6: "Principle 6 · Environment",
  C8: "Principle 8 · Inclusive Growth",
  CORE: "BRSR Core · 9 Attributes",
};

export default function SubmissionModal({ submission, onClose, onAction }) {
  const [tab, setTab] = useState("section");
  const [sectionFields, setSectionFields] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(
        `/collection/${submission.entity_slug}/${submission.section_code}`,
      ),
      api.get(`/collection/entity/${submission.entity_slug}`),
    ])
      .then(([r1, r2]) => {
        setSectionFields(r1.data);
        setAllFields(r2.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [submission]);

  async function handleAction(endpoint) {
    setBusy(true);
    try {
      await api.post(`/approvals/${submission.id}/${endpoint}`);
      onAction?.();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const canAct = submission.state === "Submitted";
  const visibleFields = tab === "section" ? sectionFields : allFields;

  const grouped =
    tab === "all"
      ? visibleFields.reduce((acc, f) => {
          const key = f.section_code;
          if (!acc[key]) acc[key] = [];
          acc[key].push(f);
          return acc;
        }, {})
      : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[92vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-200 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 lg:gap-2 mb-1 flex-wrap">
              <span className="font-mono text-[10.5px] lg:text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                {submission.id}
              </span>
              <span className="font-mono text-[10.5px] lg:text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                {submission.id}
              </span>
              <TrustBadge submissionId={submission.id} />
              <span
                className={`inline-block px-2 lg:px-2.5 py-0.5 rounded-full text-[10.5px] lg:text-[10.8px] font-bold ${
                  submission.state === "Approved"
                    ? "bg-green-100 text-green-800"
                    : submission.state === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : submission.state === "Changes Requested"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                }`}
              >
                {submission.state}
              </span>
              <button
                onClick={() => setShowComments(!showComments)}
                className={`inline-flex items-center gap-1 px-2 lg:px-3 py-0.5 rounded-full text-[10.5px] lg:text-[10.8px] font-bold border transition ${
                  showComments
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                💬 {showComments ? "Hide" : "Comments"}
              </button>
            </div>
            <h2 className="text-base lg:text-lg font-bold text-slate-800 truncate">
              {submission.section_name}
            </h2>
            <p className="text-[11px] lg:text-[12px] text-slate-500 mt-0.5 truncate">
              {submission.entity_name} · By <b>{submission.submitted_by}</b>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100 flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Left: Data view */}
          <div
            className={`flex-1 flex flex-col min-w-0 ${showComments ? "lg:border-r lg:border-slate-200" : ""}`}
          >
            <div className="flex gap-1 border-b border-slate-200 px-3 lg:px-6 overflow-x-auto">
              <button
                onClick={() => setTab("section")}
                className={`px-3 lg:px-4 py-2.5 text-[12px] lg:text-[12.8px] font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
                  tab === "section"
                    ? "text-green-700 border-green-500"
                    : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
              >
                Section ({sectionFields.length})
              </button>
              <button
                onClick={() => setTab("all")}
                className={`px-3 lg:px-4 py-2.5 text-[12px] lg:text-[12.8px] font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
                  tab === "all"
                    ? "text-green-700 border-green-500"
                    : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
              >
                All Data ({allFields.length})
              </button>
            </div>

            {submission.remarks && (
              <div className="mx-3 lg:mx-6 mt-3 lg:mt-4 bg-amber-50 border border-amber-200 text-amber-900 px-3 lg:px-4 py-2.5 rounded-lg text-[11.5px] lg:text-[12.4px]">
                <strong>Remarks:</strong> {submission.remarks}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 lg:px-6 py-3 lg:py-4">
              {loading && (
                <div className="text-center py-10 text-slate-500">
                  Loading data…
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {!loading && tab === "section" && sectionFields.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No data found for this section.
                </div>
              )}

              {!loading &&
                tab === "section" &&
                sectionFields.map((f) => <FieldCard key={f.id} f={f} />)}

              {!loading &&
                tab === "all" &&
                grouped &&
                Object.entries(grouped).map(([sectionCode, fields]) => (
                  <div key={sectionCode} className="mb-5 lg:mb-6">
                    <h3 className="text-[11.5px] lg:text-[12.5px] uppercase tracking-wide font-extrabold text-slate-500 mb-2 lg:mb-3 pb-1.5 border-b border-slate-200">
                      {SECTION_NAMES[sectionCode] || `Section ${sectionCode}`} ·{" "}
                      {fields.length} fields
                    </h3>
                    {fields.map((f) => (
                      <FieldCard key={f.id} f={f} />
                    ))}
                  </div>
                ))}
            </div>
          </div>

          {/* Right: Comments (slides below on mobile, side panel on desktop) */}
          {showComments && (
            <div className="lg:w-[360px] lg:flex-shrink-0 border-t lg:border-t-0 border-slate-200 overflow-y-auto p-4 lg:p-5 max-h-[40vh] lg:max-h-none">
              <CommentThread submissionId={submission.id} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 lg:px-6 py-3 lg:py-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
          {!canAct && (
            <span className="text-[11px] lg:text-[11.5px] text-slate-400 italic w-full sm:w-auto sm:mr-auto">
              Already actioned.
            </span>
          )}
          <div className="flex gap-2 flex-1 sm:flex-initial sm:ml-auto flex-wrap">
            <button
              onClick={onClose}
              className="px-3 lg:px-4 py-2 rounded-lg border border-slate-200 text-[12px] lg:text-[12.8px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            {canAct && (
              <>
                <button
                  disabled={busy}
                  onClick={() => handleAction("request-changes")}
                  className="px-3 lg:px-4 py-2 rounded-lg border border-slate-200 text-[12px] lg:text-[12.8px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Changes
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleAction("reject")}
                  className="px-3 lg:px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-[12px] lg:text-[12.8px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleAction("approve")}
                  className="px-3 lg:px-4 py-2 rounded-lg bg-green-600 text-white text-[12px] lg:text-[12.8px] font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {busy ? "…" : "✓ Approve"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
