import { useEffect, useRef, useState } from "react";
import api from "../lib/api";

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

function iconFor(type) {
  if (!type) return "📎";
  if (type.startsWith("image/")) return "🖼️";
  if (type.includes("pdf")) return "📄";
  if (type.includes("sheet") || type.includes("excel")) return "📊";
  if (type.includes("word") || type.includes("document")) return "📝";
  return "📎";
}

export default function FileUpload({ fieldId, readOnly = false }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  async function loadFiles() {
    try {
      const { data } = await api.get(`/attachments/field/${fieldId}`);
      setFiles(data);
    } catch {
      // silent — field may have no attachments yet
      setFiles([]);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .get(`/attachments/field/${fieldId}`)
      .then(({ data }) => {
        if (!cancelled) setFiles(data);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, fieldId]);

  async function handleUpload(e) {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setError("");
    setUploading(true);
    try {
      for (const file of picked) {
        const form = new FormData();
        form.append("file", file);
        await api.post(`/attachments/upload/${fieldId}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await loadFiles();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(attId) {
    if (!confirm("Delete this attachment?")) return;
    try {
      await api.delete(`/attachments/${attId}`);
      setFiles((prev) => prev.filter((f) => f.id !== attId));
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    }
  }

  const count = files.length;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <span>📎</span>
        <span>
          {open ? "Hide attachments" : "Attachments"}
          {count > 0 && ` (${count})`}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          {!readOnly && (
            <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 hover:border-green-500 rounded-lg py-2.5 cursor-pointer bg-white transition text-[11.5px] font-semibold text-slate-600 hover:text-green-700">
              <input
                ref={inputRef}
                type="file"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt"
              />
              {uploading ? "⏳ Uploading…" : "⬆ Choose files or drop here"}
            </label>
          )}

          {error && (
            <div className="mt-2 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1.5">
              {error}
            </div>
          )}

          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11.5px]"
                >
                  <span className="text-base">{iconFor(f.contentType)}</span>
                  <a
                    href={`http://localhost:8000/api/attachments/download/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate text-slate-700 hover:text-green-700 hover:underline"
                  >
                    {f.filename}
                  </a>
                  <span className="text-slate-400 text-[10.5px]">
                    {fmtSize(f.size)}
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      className="text-slate-400 hover:text-red-600 transition text-sm leading-none"
                      title="Delete"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {files.length === 0 && !uploading && (
            <div className="mt-2 text-[11px] text-slate-400 italic">
              No attachments yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
