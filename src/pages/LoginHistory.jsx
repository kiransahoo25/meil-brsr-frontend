import { useEffect, useState } from 'react'
import api from '../lib/api'

const ROLE_LABELS = {
  'data-entry': 'Data Entry',
  approver: 'Approver',
  'unit-admin': 'Unit Admin',
  'esg-officer': 'ESG Officer',
  'group-admin': 'Group Admin',
}

const ROLE_COLORS = {
  'data-entry': 'bg-blue-100 text-blue-800',
  approver: 'bg-amber-100 text-amber-800',
  'unit-admin': 'bg-violet-100 text-violet-800',
  'esg-officer': 'bg-green-100 text-green-800',
  'group-admin': 'bg-red-100 text-red-800',
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
    second: '2-digit',
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

export default function LoginHistory() {
  const [history, setHistory] = useState([])
  const [active, setActive] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('active')
  const [userFilter, setUserFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/admin/login-history?limit=200'),
      api.get('/admin/active-users'),
    ])
      .then(([h, a]) => {
        setHistory(h.data)
        setActive(a.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filteredHistory = history.filter((l) => {
    if (userFilter && l.user_code !== userFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        l.user_name?.toLowerCase().includes(s) ||
        l.user_code?.toLowerCase().includes(s) ||
        l.entity_slug?.toLowerCase().includes(s)
      )
    }
    return true
  })

  const uniqueUsers = [...new Set(history.map((l) => l.user_code))].sort()

  const loginCount = history.filter((l) => l.action === 'Logged in').length
  const logoutCount = history.filter((l) => l.action === 'Logged out').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900">
            Login History
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Track who signed in and out of the portal, with full timestamps
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
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-green-100">
            Currently Active
          </div>
          <div className="text-3xl font-extrabold mt-1">{active.length}</div>
          <div className="text-[11px] text-green-100 mt-0.5">
            users logged in now
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-blue-700">
            Login Events
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">{loginCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">total sign-ins</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">
            Logout Events
          </div>
          <div className="text-3xl font-extrabold text-slate-700 mt-1">{logoutCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">total sign-outs</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">
            Unique Users
          </div>
          <div className="text-3xl font-extrabold text-violet-600 mt-1">
            {uniqueUsers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">accounts seen</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-4">
        <button
          onClick={() => setTab('active')}
          className={`px-3.5 py-2.5 text-[12.8px] font-semibold border-b-2 -mb-px transition ${
            tab === 'active'
              ? 'text-green-700 border-green-500'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          🟢 Currently Active ({active.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-3.5 py-2.5 text-[12.8px] font-semibold border-b-2 -mb-px transition ${
            tab === 'history'
              ? 'text-green-700 border-green-500'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          📜 Full History ({history.length})
        </button>
      </div>

      {/* ============ ACTIVE USERS TAB ============ */}
      {tab === 'active' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
          <h3 className="text-[14px] font-bold mb-1">Currently Logged In</h3>
          <p className="text-[12px] text-slate-500 mb-4">
            Users whose last event was a login (no logout recorded yet)
          </p>

          {loading && (
            <div className="text-center py-10 text-slate-500">Loading…</div>
          )}

          {!loading && active.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              No users currently active.
            </div>
          )}

          {!loading && active.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {active.map((u) => (
                <div
                  key={u.user_code}
                  className="border border-green-200 bg-green-50/50 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white grid place-items-center text-sm font-extrabold flex-shrink-0">
                      {u.user_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-bold text-slate-800 truncate">
                          {u.user_name}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono text-[10.5px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {u.user_code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1.5 truncate">
                        {u.entity_slug}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-green-200">
                    <span className="font-bold">Logged in:</span>{' '}
                    {formatDate(u.logged_in_at)}
                    <span className="text-slate-400 ml-1">
                      ({timeAgo(u.logged_in_at)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ FULL HISTORY TAB ============ */}
      {tab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
          <h3 className="text-[14px] font-bold mb-1">Login / Logout History</h3>
          <p className="text-[12px] text-slate-500 mb-4">
            Every sign-in and sign-out event across the portal
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, or entity…"
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
                Filter by User
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none"
              >
                <option value="">All users</option>
                {uniqueUsers.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <div className="text-center py-10 text-slate-500">Loading…</div>
          )}

          {!loading && filteredHistory.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              No login history entries match your filters.
            </div>
          )}

          {!loading && filteredHistory.length > 0 && (
            <div className="overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
              <table className="w-full text-[12.6px] min-w-[760px]">
                <thead>
                  <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200">
                    <th className="py-2.5 pr-3">Event</th>
                    <th className="py-2.5 pr-3">Timestamp</th>
                    <th className="py-2.5 pr-3">User</th>
                    <th className="py-2.5 pr-3">Code</th>
                    <th className="py-2.5 pr-3">Role</th>
                    <th className="py-2.5 pr-3">Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.8px] font-bold ${
                            l.action === 'Logged in'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span>
                            {l.action === 'Logged in' ? '🟢' : '⚪'}
                          </span>
                          {l.action}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono whitespace-nowrap text-[11.5px] text-slate-700">
                        {formatDate(l.timestamp)}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-slate-800">
                        {l.user_name}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="font-mono text-[10.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {l.user_code}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                            ROLE_COLORS[l.role] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ROLE_LABELS[l.role] || l.role}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600 text-[11.5px]">
                        {l.entity_slug}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}