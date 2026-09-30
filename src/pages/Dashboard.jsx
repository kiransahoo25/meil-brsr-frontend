import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
        Failed to load dashboard: {error}
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center py-20 text-slate-500">Loading dashboard…</div>
  }

  const kpis = [
    {
      label: 'Overall Completion',
      value: `${stats.overallProgress}%`,
      foot: 'BRSR datapoints across all sections',
      color: '#10B981',
      bar: stats.overallProgress,
    },
    {
      label: 'Open Exceptions',
      value: stats.openIssues,
      foot: `${stats.highSeverity} high severity`,
      color: '#EF4444',
      bar: Math.min(stats.openIssues * 7, 100),
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      foot: 'Submitted sections in your scope',
      color: '#F59E0B',
      bar: Math.min(stats.pendingApprovals * 8, 100),
    },
    {
      label: 'Assurance Ready',
      value: `${stats.assuranceReady}/9`,
      foot: 'BRSR Core attributes with evidence',
      color: '#F59E0B',
      bar: (stats.assuranceReady / 9) * 100,
    },
  ]

  return (
    <div>
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Welcome, {user.name}</h1>
          <p className="text-[12.6px] text-slate-500 mt-0.5">
            <span className="font-mono font-extrabold text-green-700">{user.code}</span> ·{' '}
            {user.entity}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-extrabold">
              {k.label}
            </div>
            <div
              className="text-[26px] font-extrabold my-1 tracking-tight"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
            <div className="text-[11.3px] text-slate-500 leading-snug">{k.foot}</div>
            <div className="h-[5px] rounded-full bg-slate-100 mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${k.bar}%`, background: k.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-[13.5px] font-bold mb-0.5">Completion by BRSR Section</h3>
        <p className="text-[11.6px] text-slate-500 mb-4">
          Progress across Section A, B, NGRBC principles, and BRSR Core
        </p>

        {stats.sectionProgress.length === 0 && (
          <div className="text-slate-400 text-sm py-6 text-center">
            No sections found. Make sure you ran the seed script.
          </div>
        )}

        {stats.sectionProgress.map((s) => (
          <div key={s.code} className="flex items-center gap-2.5 py-1.5">
            <div className="w-[200px] flex-shrink-0 text-[12.6px] text-slate-700 font-medium truncate">
              {s.name} · {s.sub}
            </div>
            <div className="flex-1 h-[9px] bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${s.progress}%`,
                  background:
                    s.progress >= 85
                      ? '#10B981'
                      : s.progress >= 65
                      ? '#3B82F6'
                      : s.progress >= 45
                      ? '#F59E0B'
                      : '#EF4444',
                }}
              />
            </div>
            <div className="w-[42px] text-right font-bold text-[12px] tabular-nums">
              {s.progress}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}