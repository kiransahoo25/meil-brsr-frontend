import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

const ACTION_COLORS = {
  'Approved': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Changes Requested': 'bg-amber-100 text-amber-800',
  'Submitted for review': 'bg-blue-100 text-blue-800',
  'Value updated': 'bg-violet-100 text-violet-800',
  'Commented': 'bg-slate-100 text-slate-700',
  'Commented on': 'bg-slate-100 text-slate-700',
}

const ACTION_ICON = {
  'Approved': '✓',
  'Rejected': '✕',
  'Changes Requested': '↩',
  'Submitted for review': '📤',
  'Value updated': '✎',
  'Commented': '💬',
}

const ROLE_SHORT = {
  'data-entry': 'Data Entry',
  approver: 'Approver',
  'unit-admin': 'Unit Admin',
  'esg-officer': 'ESG Officer',
  'group-admin': 'Group Admin',
}

export default function Audit() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [exporting, setExporting] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const isGroupLevel = user.role === 'esg-officer' || user.role === 'group-admin'

  useEffect(() => {
    api
      .get('/audit/list')
      .then(({ data }) => {
        setLogs(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const actions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action))
    return Array.from(set).sort()
  }, [logs])

  const filtered = useMemo(() => {
    let result = logs
    if (actionFilter) result = result.filter((l) => l.action === actionFilter)
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(
        (l) =>
          (l.user_name || '').toLowerCase().includes(s) ||
          (l.user_code || '').toLowerCase().includes(s) ||
          (l.datapoint || '').toLowerCase().includes(s) ||
          (l.action || '').toLowerCase().includes(s) ||
          (l.to_value || '').toLowerCase().includes(s),
      )
    }
    return result
  }, [logs, actionFilter, search])

  async function handleExport() {
    setExporting(true)
    try {
      const token = localStorage.getItem('token')
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const res = await fetch(`${apiBase}/audit/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'MEIL_Audit_Trail.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (err) {
      alert('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  function formatTs(iso) {
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

  function timeAgo(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900">
            Evidence &amp; Audit Trail
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Immutable record of every change, its author, and its evidence
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-[12.8px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {exporting ? '⏳ Exporting…' : '⬇ Export CSV'}
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-5 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-[12.4px] leading-relaxed flex gap-3">
        <span className="flex-shrink-0 text-lg">🛡️</span>
        <div>
          <strong>Assurance note:</strong> Every BRSR Core KPI is traceable to a source
          document and a named owner. This trail is <strong>append-only</strong> — no entry
          can be edited or deleted.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">
            Total Entries
          </div>
          <div className="text-3xl font-extrabold text-slate-800 mt-1">{logs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">In your scope</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-green-700">
            Approvals
          </div>
          <div className="text-3xl font-extrabold text-green-600 mt-1">
            {logs.filter((l) => l.action === 'Approved').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Signed off</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-violet-700">
            Edits
          </div>
          <div className="text-3xl font-extrabold text-violet-600 mt-1">
            {logs.filter((l) => l.action === 'Value updated').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Field changes</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">
            Submissions
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">
            {logs.filter((l) => l.action === 'Submitted for review').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sent for review</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 lg:p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, datapoint, action, value…"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
              Action Type
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none"
            >
              <option value="">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(search || actionFilter) && (
          <div className="flex items-center justify-between mt-3 text-[11.5px] text-slate-500">
            <span>
              Showing <b>{filtered.length}</b> of {logs.length} entries
            </span>
            <button
              onClick={() => {
                setSearch('')
                setActionFilter('')
              }}
              className="font-semibold text-green-700 hover:text-green-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
        <h3 className="text-[14px] font-bold mb-1">Change Log</h3>
        <p className="text-[12px] text-slate-500 mb-5">
          {filtered.length} entries in your scope
        </p>

        {loading && (
          <div className="text-center py-10 text-slate-500">Loading…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">
            {logs.length === 0
              ? 'No audit entries yet — make an edit or submit a section.'
              : 'No entries match your filters.'}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="relative">
            {/* Vertical timeline line — hidden on mobile */}
            <div className="hidden lg:block absolute left-[19px] top-2 bottom-2 w-[2px] bg-slate-200" />

            <div className="space-y-2">
              {filtered.map((l) => {
                const isOpen = expanded === l.id
                const actionCls = ACTION_COLORS[l.action] || 'bg-slate-100 text-slate-700'
                const icon = ACTION_ICON[l.action] || '•'
                return (
                  <div
                    key={l.id}
                    className="relative pl-0 lg:pl-12"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`hidden lg:grid absolute left-0 top-4 w-10 h-10 rounded-full place-items-center text-[14px] font-bold border-2 ${
                        l.action === 'Approved'
                          ? 'bg-green-50 border-green-400 text-green-700'
                          : l.action === 'Rejected'
                          ? 'bg-red-50 border-red-400 text-red-700'
                          : l.action === 'Changes Requested'
                          ? 'bg-amber-50 border-amber-400 text-amber-700'
                          : l.action === 'Submitted for review'
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                      }`}
                    >
                      {icon}
                    </div>

                    <button
                      onClick={() => setExpanded(isOpen ? null : l.id)}
                      className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3.5 transition"
                    >
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.8px] font-bold ${actionCls}`}
                            >
                              {icon} {l.action}
                            </span>
                            <span className="font-mono text-[10.5px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                              {l.user_code}
                            </span>
                            <span className="text-[10.5px] text-slate-400">
                              {ROLE_SHORT[l.role] || l.role}
                            </span>
                            <span className="text-[10.5px] text-slate-400 ml-auto whitespace-nowrap">
                              {timeAgo(l.timestamp)}
                            </span>
                          </div>
                          <div className="text-[13px] font-semibold text-slate-800 truncate">
                            {l.user_name} · {l.datapoint}
                          </div>
                          <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                            {l.entity_slug}
                            {l.from_value && l.to_value && (
                              <>
                                {' · '}
                                <span className="font-mono">
                                  {l.from_value} → {l.to_value}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-slate-400 text-lg leading-none lg:hidden">
                          {isOpen ? '−' : '+'}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                          <div>
                            <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                              Timestamp
                            </div>
                            <div className="font-mono text-slate-700">
                              {formatTs(l.timestamp)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                              Entity
                            </div>
                            <div className="text-slate-700">{l.entity_slug}</div>
                          </div>
                          <div>
                            <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                              Datapoint
                            </div>
                            <div className="font-mono text-slate-700">{l.datapoint}</div>
                          </div>
                          <div>
                            <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                              Performed by
                            </div>
                            <div className="text-slate-700">
                              {l.user_name} ({l.user_code})
                            </div>
                          </div>
                          {l.from_value || l.to_value ? (
                            <>
                              <div>
                                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                                  From
                                </div>
                                <div className="font-mono text-[11.5px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 break-all">
                                  {l.from_value || '—'}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                                  To
                                </div>
                                <div className="font-mono text-[11.5px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 break-all">
                                  {l.to_value || '—'}
                                </div>
                              </div>
                            </>
                          ) : null}
                        </div>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}