import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

const SEVERITY_STYLES = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
}

const SEVERITY_BAR = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#3B82F6',
}

export default function Validation() {
  const { user } = useAuth()
  const [issues, setIssues] = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState('open')

  async function load() {
    setLoading(true)
    try {
      const [issuesRes, catalogRes] = await Promise.all([
        api.get('/validation/issues'),
        api.get('/validation/catalog'),
      ])
      setIssues(issuesRes.data)
      setCatalog(catalogRes.data)
    } catch (err) {
      setMessage('Failed to load: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRun() {
    setRunning(true)
    setMessage('')
    try {
      const { data } = await api.post('/validation/run')
      setMessage(`✓ Validation completed — ${data.issues_found} issue(s) found`)
      await load()
    } catch (err) {
      setMessage('Run failed: ' + err.message)
    } finally {
      setRunning(false)
    }
  }

  async function handleResolve(issueId) {
    try {
      await api.post(`/validation/resolve/${issueId}`)
      setMessage('✓ Issue marked as resolved')
      await load()
    } catch (err) {
      setMessage('Resolve failed: ' + err.message)
    }
  }

  const open = issues.filter((i) => i.status === 'Open')
  const resolved = issues.filter((i) => i.status === 'Resolved')

  const counts = {
    high: open.filter((i) => i.severity === 'High').length,
    medium: open.filter((i) => i.severity === 'Medium').length,
    low: open.filter((i) => i.severity === 'Low').length,
  }

  const canRun = ['approver', 'unit-admin', 'esg-officer', 'group-admin'].includes(
    user.role,
  )

  const visible = tab === 'open' ? open : resolved

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900">
            Validation Center
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Automated checks across every submitted datapoint
          </p>
        </div>
        {canRun ? (
          <button
            onClick={handleRun}
            disabled={running}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-[12.8px] hover:shadow-lg transition disabled:opacity-60"
          >
            {running ? '⏳ Running…' : '⚡ Run Validation'}
          </button>
        ) : (
          <span className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Read-only
          </span>
        )}
      </div>

      {message && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2.5 rounded-xl text-[12.4px]">
          {message}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">
            Open Exceptions
          </div>
          <div className="text-3xl font-extrabold text-slate-800 mt-1">{open.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">In your scope</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-red-700">
            High Severity
          </div>
          <div className="text-3xl font-extrabold text-red-600 mt-1">{counts.high}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Block report generation</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-amber-700">
            Medium
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">
            {counts.medium}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Require explanation</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-blue-700">
            Low
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">{counts.low}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Advisory / documentation</div>
        </div>
      </div>

      {/* Rules catalog */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 mb-5">
        <h3 className="text-[14px] font-bold mb-1">Validation Rules Engine</h3>
        <p className="text-[12px] text-slate-500 mb-4">
          {catalog.length} rules configured for the MEIL reporting boundary
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {catalog.map((r) => (
            <div
              key={r.name}
              className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${SEVERITY_STYLES[r.severity]}`}
                >
                  {r.severity.toUpperCase()}
                </span>
                <span className="text-[12.3px] font-bold text-slate-800">
                  {r.name}
                </span>
              </div>
              <div className="text-[11.5px] text-slate-500 leading-relaxed">
                {r.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exception register */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-[14px] font-bold">Exception Register</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {open.length} open · {resolved.length} resolved
            </p>
          </div>
          <div className="flex gap-1 border-b border-slate-200">
            <button
              onClick={() => setTab('open')}
              className={`px-3.5 py-2 text-[12.8px] font-semibold border-b-2 -mb-px transition ${
                tab === 'open'
                  ? 'text-red-700 border-red-500'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Open ({open.length})
            </button>
            <button
              onClick={() => setTab('resolved')}
              className={`px-3.5 py-2 text-[12.8px] font-semibold border-b-2 -mb-px transition ${
                tab === 'resolved'
                  ? 'text-green-700 border-green-500'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Resolved ({resolved.length})
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-10 text-slate-500">Loading…</div>
        )}

        {!loading && visible.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">
            {tab === 'open'
              ? 'No open exceptions. Run validation to check for issues.'
              : 'No resolved exceptions yet.'}
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div className="overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
            <table className="w-full text-[12.6px] min-w-[720px]">
              <thead>
                <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200">
                  <th className="py-2.5 pr-3">Sev</th>
                  <th className="py-2.5 pr-3">Entity</th>
                  <th className="py-2.5 pr-3">Datapoint</th>
                  <th className="py-2.5 pr-3">Issue</th>
                  <th className="py-2.5 pr-3">Rule</th>
                  {tab === 'open' && canRun && <th className="py-2.5">Action</th>}
                  {tab === 'resolved' && <th className="py-2.5">Resolved by</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${SEVERITY_STYLES[i.severity]}`}
                      >
                        {i.severity}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-slate-800">
                      {i.entity_slug}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[11.5px]">
                      {i.datapoint}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-700">{i.message}</td>
                    <td className="py-2.5 pr-3 text-[11.5px] text-slate-500">
                      {i.rule_name}
                    </td>
                    {tab === 'open' && canRun && (
                      <td className="py-2.5">
                        <button
                          onClick={() => handleResolve(i.id)}
                          className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-green-50 border border-green-200 text-green-800 hover:bg-green-100"
                        >
                          Resolve
                        </button>
                      </td>
                    )}
                    {tab === 'resolved' && (
                      <td className="py-2.5 text-[11.5px] text-slate-500">
                        {i.resolved_by || '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}