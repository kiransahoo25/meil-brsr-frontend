import { useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

const SEVERITY_STYLE = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
}

export default function AIGapAnalysis() {
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runAnalysis() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/ai/gap-analysis', {
        entity_slug: user.entity,
      })
      setReport(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 mb-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white grid place-items-center text-xl flex-shrink-0">
            🤖
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-slate-900">
              AI Copilot — BRSR Gap Analysis
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Reviews your qualitative disclosures and flags missing details
            </p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-[12.8px] hover:shadow-lg transition disabled:opacity-60"
        >
          {loading ? '⏳ Analyzing…' : report ? '🔄 Re-run Analysis' : '✨ Run AI Analysis'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-[12.4px]">
          {error}
        </div>
      )}

      {!report && !loading && !error && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12.5px] text-slate-500 mt-2">
          Click <b>Run AI Analysis</b> to scan all your narrative disclosures and
          identify gaps before submission.
        </div>
      )}

      {report && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 border border-violet-200 text-[10.5px] font-bold text-violet-700">
              {report.mode.includes('gemini') ? '🤖 Gemini AI' : '📋 Rule-based'}
            </span>
            <span className="text-[11.5px] text-slate-500">
              {report.gaps.length} gap{report.gaps.length === 1 ? '' : 's'} detected
            </span>
          </div>

          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3.5 mb-3 text-[12.8px] text-slate-800 leading-relaxed">
            <strong>Summary:</strong> {report.summary}
          </div>

          {report.gaps.length === 0 ? (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-[12.8px]">
              ✅ No significant gaps detected. Your disclosures look complete.
            </div>
          ) : (
            <div className="space-y-2.5">
              {report.gaps.map((gap, i) => (
                <div
                  key={i}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                        SEVERITY_STYLE[gap.severity] || SEVERITY_STYLE.Low
                      }`}
                    >
                      {gap.severity}
                    </span>
                    <span className="text-[12.5px] font-bold text-slate-800">
                      {gap.principle}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-2">
                    <div className="text-[12.5px] text-slate-700 leading-relaxed">
                      <span className="text-slate-500 font-semibold">Issue: </span>
                      {gap.issue}
                    </div>
                    <div className="text-[12.5px] text-green-800 leading-relaxed bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <strong>Suggestion: </strong>
                      {gap.suggestion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}