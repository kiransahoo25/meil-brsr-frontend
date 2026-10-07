import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

const STATE_STYLES = {
  Submitted: 'bg-blue-100 text-blue-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  'Changes Requested': 'bg-amber-100 text-amber-800',
  Draft: 'bg-slate-100 text-slate-700',
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fileIcon(name) {
  if (name?.endsWith('.pdf')) return '📄'
  if (name?.match(/\.(jpg|jpeg|png|gif)$/i)) return '🖼️'
  if (name?.match(/\.(xlsx?|csv)$/i)) return '📊'
  if (name?.match(/\.(docx?)$/i)) return '📝'
  return '📎'
}

export default function Archive() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')

  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const isGroupLevel = user.role === 'esg-officer' || user.role === 'group-admin'

  // Load entities once
  useEffect(() => {
    if (isGroupLevel) {
      api.get('/entities').then(({ data }) => {
        const list = data.filter(
          (e) => e.type === 'Business Unit' || e.type === 'Subsidiary',
        )
        setEntities(list)
      })
    }
  }, [isGroupLevel])

  // Load results on any filter change (debounced for typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch()
    }, 300)
    return () => clearTimeout(timer)
  }, [q, entityFilter, stateFilter])

  async function runSearch() {
    setSearching(true)
    setError('')
    try {
      const params = {}
      if (q) params.q = q
      if (entityFilter) params.entity_slug = entityFilter
      if (stateFilter) params.state = stateFilter
      const { data } = await api.get('/archive/search', { params })
      setResults(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setSearching(false)
      setLoading(false)
    }
  }

  async function openDetail(submissionId) {
    setDetailLoading(true)
    setDetail({ loading: true })
    try {
      const { data } = await api.get(`/archive/submission/${submissionId}`)
      setDetail(data)
    } catch (err) {
      alert('Failed to load details: ' + err.message)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  async function downloadEvidence(id, filename) {
    try {
      const token = sessionStorage.getItem('token')
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const res = await fetch(`${apiBase}/evidence/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (err) {
      alert('Download failed: ' + err.message)
    }
  }

  function clearFilters() {
    setQ('')
    setEntityFilter('')
    setStateFilter('')
  }

  const hasFilters = q || entityFilter || stateFilter

  const totalFiles = results.reduce((sum, r) => sum + r.evidence_count, 0)
  const totalFieldsFilled = results.reduce((sum, r) => sum + r.filled_count, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900">
            Data & File Archive
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {isGroupLevel
              ? 'Search across all units, submissions and evidence files'
              : `Search submissions and files for ${user.entity}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-[12.5px]">
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">
            Submissions
          </div>
          <div className="text-3xl font-extrabold text-slate-800 mt-1">
            {results.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {hasFilters ? 'matching filters' : 'in your scope'}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-blue-700">
            Fields Filled
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">
            {totalFieldsFilled}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">datapoints entered</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-violet-700">
            Evidence Files
          </div>
          <div className="text-3xl font-extrabold text-violet-600 mt-1">
            {totalFiles}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">attachments uploaded</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">
            Approved
          </div>
          <div className="text-3xl font-extrabold text-green-600 mt-1">
            {results.filter((r) => r.state === 'Approved').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">signed off</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
              🔍 Search
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filename, user, section, entity…"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none"
            />
          </div>

          {isGroupLevel && (
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
                🏢 Entity
              </label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-medium focus:border-green-500 outline-none"
              >
                <option value="">All entities</option>
                {entities.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
              📌 Status
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-medium focus:border-green-500 outline-none"
            >
              <option value="">All statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Changes Requested">Changes Requested</option>
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between mt-3 text-[11.5px] text-slate-500">
            <span>
              {searching ? 'Searching…' : `${results.length} result(s)`}
            </span>
            <button
              onClick={clearFilters}
              className="font-semibold text-green-700 hover:text-green-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        {loading && (
          <div className="text-center py-10 text-slate-500">Loading archive…</div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            {hasFilters
              ? 'No submissions match your filters. Try a different search.'
              : 'No submissions in the archive yet.'}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-[12.6px] min-w-[860px]">
              <thead>
                <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200">
                  <th className="py-2.5 pr-3">Submission</th>
                  <th className="py-2.5 pr-3">Entity</th>
                  <th className="py-2.5 pr-3">Section</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3 text-center">Fields</th>
                  <th className="py-2.5 pr-3 text-center">Files</th>
                  <th className="py-2.5 pr-3">Submitted by</th>
                  <th className="py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.submission_id}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="py-2.5 pr-3">
                      <span className="font-mono text-[10.5px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        {r.submission_id}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-slate-800 truncate max-w-[160px]">
                      {r.entity_name}
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold text-slate-700 truncate">
                        {r.section_name}
                      </div>
                      <div className="text-[10.5px] text-slate-500 truncate">
                        {r.section_sub}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold ${
                          STATE_STYLES[r.state] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.state}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <span className="font-mono text-[11.5px] font-bold text-slate-700">
                        {r.filled_count}/{r.field_count}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      {r.evidence_count > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-[10.8px] font-bold">
                          📎 {r.evidence_count}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11.5px]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-[11.5px] text-slate-600 truncate">
                      {r.submitted_by}
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => openDetail(r.submission_id)}
                        className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-white border border-slate-200 hover:bg-slate-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ DETAIL MODAL ============ */}
      {detail && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[92vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {detail.loading ? (
              <div className="p-10 text-center text-slate-500">Loading details…</div>
            ) : (
              <>
                {/* Header */}
                <div className="px-5 lg:px-6 py-4 border-b border-slate-200 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-[10.5px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {detail.submission_id}
                      </span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold ${
                          STATE_STYLES[detail.state] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {detail.state}
                      </span>
                    </div>
                    <h2 className="text-base lg:text-lg font-bold text-slate-800 truncate">
                      {detail.section_name} — {detail.section_sub}
                    </h2>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      {detail.entity_name} · By <b>{detail.submitted_by}</b>
                      {detail.approver && <> · Approved by <b>{detail.approver}</b></>}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"
                  >
                    ×
                  </button>
                </div>

                {/* Remarks */}
                {detail.remarks && (
                  <div className="mx-5 lg:mx-6 mt-3 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-lg text-[12.2px]">
                    <strong>Remarks:</strong> {detail.remarks}
                  </div>
                )}

                {/* Body — fields + evidence */}
                <div className="flex-1 overflow-y-auto px-5 lg:px-6 py-4">
                  {detail.fields.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No fields found for this section.
                    </div>
                  )}

                  {detail.fields.map((f) => (
                    <div
                      key={f.id}
                      className={`border rounded-xl p-3.5 mb-2.5 ${
                        f.evidence?.length > 0
                          ? 'border-blue-200 bg-blue-50/30'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10.3px] text-slate-400 font-bold tracking-wide mb-0.5">
                            {f.code}
                            {f.required && (
                              <span className="text-red-500 ml-1">· Required</span>
                            )}
                          </div>
                          <div className="text-[12.8px] font-semibold leading-snug text-slate-800">
                            {f.label}
                          </div>
                        </div>
                        {f.evidence?.length > 0 && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10.5px] font-bold">
                            📎 {f.evidence.length}
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 font-mono break-all">
                        {f.value || (
                          <span className="text-slate-400 italic">No value</span>
                        )}
                        {f.unit && (
                          <span className="text-[11px] text-slate-400 font-sans ml-2">
                            {f.unit}
                          </span>
                        )}
                      </div>

                      {/* Evidence list for this field */}
                      {f.evidence?.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {f.evidence.map((ev) => (
                            <div
                              key={ev.id}
                              className="flex items-center gap-2.5 p-2 bg-white border border-blue-200 rounded-lg"
                            >
                              <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 grid place-items-center text-base flex-shrink-0">
                                {fileIcon(ev.original_filename)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[12px] font-semibold text-slate-800 truncate">
                                    {ev.original_filename}
                                  </span>
                                  {ev.version > 1 && (
                                    <span className="text-[9.5px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                      v{ev.version}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10.5px] text-slate-500 truncate">
                                  {formatBytes(ev.size_bytes)} · By{' '}
                                  <b className="text-slate-600">
                                    {ev.uploaded_by_name}
                                  </b>{' '}
                                  ({ev.uploaded_by_code}) on{' '}
                                  {formatDate(ev.uploaded_at)}
                                </div>
                                {ev.note && (
                                  <div className="text-[10.5px] text-slate-500 italic truncate">
                                    "{ev.note}"
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  downloadEvidence(ev.id, ev.stored_filename)
                                }
                                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 flex-shrink-0"
                              >
                                ⬇
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 lg:px-6 py-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setDetail(null)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-[12.8px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}