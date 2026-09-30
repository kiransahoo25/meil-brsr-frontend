import { useEffect, useState } from "react";
import api from "../lib/api";
import SubmissionModal from "../components/SubmissionModal";

const TABS = [
  { id: "pending", label: "Awaiting Review", state: "Submitted" },
  { id: "changes", label: "Changes Requested", state: "Changes Requested" },
  { id: "approved", label: "Approved", state: "Approved" },
  { id: "rejected", label: "Rejected", state: "Rejected" },
];

export default function Approvals() {
  const [subs, setSubs] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [viewing, setViewing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/approvals/list");
      setSubs(data);
    } catch (err) {
      setMessage("Failed to load: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function action(id, endpoint) {
    try {
      await api.post(`/approvals/${id}/${endpoint}`);
      setMessage(`✓ ${endpoint} applied to ${id}`);
      await load();
    } catch (err) {
      setMessage("Action failed: " + err.message);
    }
  }

  const counts = Object.fromEntries(
    TABS.map((t) => [t.id, subs.filter((s) => s.state === t.state).length]),
  );
  const activeState = TABS.find((t) => t.id === tab).state;
  const visible = subs.filter((s) => s.state === activeState);

  return (
    <div>
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Approvals Workflow
          </h1>
          <p className="text-[12.6px] text-slate-500 mt-0.5">
            Review submissions from your scope — click <b>View</b> to see the
            full data
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        {TABS.map((t) => {
          const colors = {
            pending: "#F59E0B",
            approved: "#10B981",
            rejected: "#EF4444",
            changes: "#8B5CF6",
          };
          return (
            <div
              key={t.id}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">
                {t.label}
              </div>
              <div
                className="text-[26px] font-extrabold my-1 tracking-tight"
                style={{ color: colors[t.id] }}
              >
                {counts[t.id] || 0}
              </div>
              <div className="text-[11.3px] text-slate-500">in your scope</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-[12.8px] font-semibold border-b-2 -mb-px transition ${
              tab === t.id
                ? "text-green-700 border-green-500"
                : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            {t.label}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                tab === t.id
                  ? "bg-green-100 text-green-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts[t.id] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {loading && (
          <div className="text-center py-10 text-slate-500">Loading…</div>
        )}

        {!loading && visible.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">
            No items in this queue.
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.6px] border-collapse">
              <thead>
                <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200">
                  <th className="py-2.5 pr-3">ID</th>
                  <th className="py-2.5 pr-3">Entity</th>
                  <th className="py-2.5 pr-3">Section</th>
                  <th className="py-2.5 pr-3">Submitted By</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3">Actioned By</th>
                  <th className="py-2.5 pr-3">Remarks</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="py-2.5 pr-3 font-mono">{s.id}</td>
                    <td className="py-2.5 pr-3 font-semibold">
                      {s.entity_slug}
                    </td>
                    <td className="py-2.5 pr-3">{s.section_name}</td>
                    <td className="py-2.5 pr-3">{s.submitted_by}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold ${
                          s.state === "Approved"
                            ? "bg-green-100 text-green-800"
                            : s.state === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : s.state === "Changes Requested"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {s.state}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">{s.approver}</td>
                    <td className="py-2.5 pr-3 text-slate-500 text-[11.5px] max-w-[200px]">
                      {s.remarks || "—"}
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setViewing(s)}
                          className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-white border border-slate-200 hover:bg-slate-50"
                        >
                          View
                        </button>
                        {s.state === "Submitted" && (
                          <>
                            <button
                              onClick={() => action(s.id, "approve")}
                              className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-green-600 text-white hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => action(s.id, "request-changes")}
                              className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-white border border-slate-200 hover:bg-slate-50"
                            >
                              Changes
                            </button>
                            <button
                              onClick={() => action(s.id, "reject")}
                              className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && (
        <SubmissionModal
          submission={viewing}
          onClose={() => setViewing(null)}
          onAction={load}
        />
      )}
    </div>
  );
}
