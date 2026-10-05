import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'

const SDGS = [
  { num: 6, title: 'Clean Water & Sanitation', sub: 'Water infrastructure', color: '#0EA5E9', progress: 82 },
  { num: 7, title: 'Affordable & Clean Energy', sub: 'Renewable capacity', color: '#F59E0B', progress: 71 },
  { num: 8, title: 'Decent Work & Economic Growth', sub: 'Employment & safety', color: '#8B5CF6', progress: 78 },
  { num: 9, title: 'Industry, Innovation & Infrastructure', sub: 'Core business', color: '#EF4444', progress: 88 },
  { num: 11, title: 'Sustainable Cities & Communities', sub: 'Community development', color: '#10B981', progress: 74 },
  { num: 13, title: 'Climate Action', sub: 'GHG reduction', color: '#059669', progress: 64 },
  { num: 16, title: 'Peace, Justice & Strong Institutions', sub: 'Governance & ethics', color: '#3B82F6', progress: 91 },
  { num: 17, title: 'Partnerships for the Goals', sub: 'Value chain engagement', color: '#1D4ED8', progress: 69 },
]

const CONTRIBUTIONS = [
  { sdg: 6, contribution: 'Drinking water & irrigation projects', indicator: '14,820 KL', status: 'On track', cls: 'complete' },
  { sdg: 7, contribution: 'Renewable generation & procurement', indicator: '9.5%', status: 'Below target', cls: 'partial' },
  { sdg: 8, contribution: '79,159 employees & workers', indicator: 'LTIFR 0.41', status: 'On track', cls: 'complete' },
  { sdg: 9, contribution: 'Core EPC business — 250+ projects', indicator: '250 projects', status: 'Leader', cls: 'complete' },
  { sdg: 11, contribution: 'CSR & community development', indicator: '₹186.4 Cr', status: 'On track', cls: 'complete' },
  { sdg: 13, contribution: 'Scope 1+2 emissions intensity', indicator: '12.84 t/₹Cr', status: 'Reduction needed', cls: 'partial' },
  { sdg: 16, contribution: 'Anti-corruption & ethics', indicator: '0 violations', status: 'Clean', cls: 'complete' },
  { sdg: 17, contribution: 'Value chain & supplier engagement', indicator: '28% coverage', status: 'Coverage gap', cls: 'partial' },
]

// --- Custom tooltip components for a polished look ---
function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-[12px]">
      <div className="font-bold text-slate-800">SDG {data.num}</div>
      <div className="text-slate-500 text-[11px]">{data.short}</div>
      <div className="font-mono font-bold mt-1" style={{ color: data.color }}>
        {data.progress}%
      </div>
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-[12px]">
      <div className="font-bold text-slate-800">{payload[0].name}</div>
      <div className="font-mono text-slate-700">{payload[0].value} goals</div>
    </div>
  )
}

export default function SDGReport() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [downloading, setDownloading] = useState(false)
  const avg = Math.round(SDGS.reduce((s, x) => s + x.progress, 0) / SDGS.length)
  const selectedUnit = searchParams.get('unit') || ''
  const isGroupLevel = user.role === 'esg-officer' || user.role === 'group-admin'

  async function downloadPDF() {
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const url = selectedUnit
        ? `${apiBase}/reports/sdg-pdf?entity_slug=${selectedUnit}`
        : `${apiBase}/reports/sdg-pdf`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'MEIL_SDG_Report_FY2526.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (err) {
      alert('SDG PDF generation failed: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  // --- Data shaping for charts ---
  const radarData = SDGS.map((s) => ({
    subject: `SDG ${s.num}`,
    progress: s.progress,
    fullMark: 100,
  }))

  const barData = SDGS.map((s) => ({
    num: s.num,
    label: `SDG ${s.num}`,
    short: s.title,
    progress: s.progress,
    color: s.color,
  }))

  const onTrack = SDGS.filter((s) => s.progress >= 70).length
  const needsAction = SDGS.length - onTrack
  const pieData = [
    { name: 'On Track', value: onTrack, color: '#10B981' },
    { name: 'Needs Action', value: needsAction, color: '#F59E0B' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            SDG Report
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {isGroupLevel ? 'MEIL Group' : user.entity} · FY 2025-26 · UN Sustainable
            Development Goals alignment
          </p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-[12.8px] hover:shadow-lg transition disabled:opacity-60"
        >
          {downloading ? '⏳ Generating…' : '⬇ Download SDG PDF'}
        </button>
      </div>

      {/* ============ KPI CARDS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
        <div className="md:col-span-1 bg-gradient-to-br from-sky-500 to-blue-700 text-white rounded-2xl p-5 lg:p-6">
          <div className="text-[11px] uppercase tracking-wider font-extrabold text-sky-100">
            SDG Alignment Score
          </div>
          <div className="text-5xl font-extrabold mt-2 tracking-tight">
            {avg}
            <span className="text-2xl text-sky-200">%</span>
          </div>
          <div className="text-[12.5px] text-sky-100 mt-2">
            Average across 8 prioritized goals
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-green-700">
            Goals On Track
          </div>
          <div className="text-3xl font-extrabold text-green-600 mt-1">{onTrack}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Score ≥ 70%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-amber-700">
            Needing Action
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">{needsAction}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Below 70% alignment</div>
        </div>
      </div>

      {/* ============ CHARTS ROW: RADAR + PIE ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Radar Chart — the star of the SDG view */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
          <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">
                SDG Alignment Radar
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Visual comparison across all 8 prioritized goals
              </p>
            </div>
          </div>
          <div style={{ width: '100%', height: 340 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData} outerRadius="75%">
                <defs>
                  <linearGradient id="sdgRadar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                  tickCount={5}
                  axisLine={false}
                />
                <Radar
                  name="Alignment"
                  dataKey="progress"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#sdgRadar)"
                  fillOpacity={1}
                  dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-[12px]">
                        <div className="font-bold text-slate-800">
                          {payload[0].payload.subject}
                        </div>
                        <div className="font-mono font-bold text-sky-600 mt-0.5">
                          {payload[0].value}%
                        </div>
                      </div>
                    )
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart — Goal Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
          <h3 className="text-[14px] font-bold text-slate-900 mb-1">
            Goal Status
          </h3>
          <p className="text-[12px] text-slate-500 mb-2">
            On track vs. needing action
          </p>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-1">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-[11.5px]">
                <span
                  className="w-3 h-3 rounded"
                  style={{ background: p.color }}
                />
                <span className="text-slate-600 font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ BAR CHART — Score by SDG ============ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">
          Alignment Score by Goal
        </h3>
        <p className="text-[12px] text-slate-500 mb-4">
          Each bar is colored by its UN SDG branding
        </p>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============ SDG CARDS ============ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 mb-5">
        <h3 className="text-[14px] font-bold mb-1">Prioritised UN SDGs</h3>
        <p className="text-[12px] text-slate-500 mb-5">
          Detailed view with progress bars
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SDGS.map((s) => (
            <div
              key={s.num}
              className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg grid place-items-center font-extrabold text-white text-[15px] flex-shrink-0"
                  style={{ background: s.color }}
                >
                  {s.num}
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-bold text-slate-800 leading-tight">
                    {s.title}
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                    {s.sub}
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.progress}%`, background: s.color }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Alignment
                </span>
                <span
                  className="text-[12px] font-extrabold"
                  style={{ color: s.color }}
                >
                  {s.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ CONTRIBUTIONS TABLE ============ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
        <h3 className="text-[14px] font-bold mb-4">SDG Contributions at a Glance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.6px]">
            <thead>
              <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200">
                <th className="py-2.5 pr-3">SDG</th>
                <th className="py-2.5 pr-3">Contribution</th>
                <th className="py-2.5 pr-3">Indicator</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {CONTRIBUTIONS.map((c) => (
                <tr key={c.sdg} className="border-b border-slate-100">
                  <td className="py-2.5 pr-3">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold">
                      SDG {c.sdg}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-slate-700">
                    {c.contribution}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-[11.5px]">
                    {c.indicator}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold ${
                        c.cls === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}