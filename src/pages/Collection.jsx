import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Collection() {
  const { user } = useAuth()
  const [sections, setSections] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState('info')

  // ---- Load sections once
  useEffect(() => {
    api
      .get('/collection/sections')
      .then(({ data }) => {
        setSections(data)
        if (data[0]) setActiveSection(data[0].code)
      })
      .catch((err) => {
        setMessage('Failed to load sections: ' + err.message)
        setMsgType('error')
      })
  }, [])

  // ---- Load fields for active section
  useEffect(() => {
    if (!activeSection) return
    setLoading(true)
    api
      .get(`/collection/${user.entity}/${activeSection}`)
      .then(({ data }) => {
        setFields(data)
        setLoading(false)
      })
      .catch((err) => {
        setMessage('Failed to load fields: ' + err.message)
        setMsgType('error')
        setLoading(false)
      })
  }, [activeSection, user.entity])

  async function updateField(fieldId, value) {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, value, status: 'complete' } : f)),
    )
    try {
      await api.patch(`/collection/field/${fieldId}`, null, { params: { value } })
    } catch (err) {
      setMessage('Save failed: ' + err.message)
      setMsgType('error')
    }
  }

  // ---- Single section submit (existing)
  async function handleSubmitSection() {
    if (!activeSection) return
    setBusy(true)
    try {
      await api.post(`/collection/submit/${user.entity}/${activeSection}`)
      setMessage('Section submitted for review ✓')
      setMsgType('success')
    } catch (err) {
      setMessage('Submit failed: ' + err.message)
      setMsgType('error')
    } finally {
      setBusy(false)
    }
  }

  // ---- NEW: Submit all sections at once
  async function handleSubmitAll() {
    if (!window.confirm('Submit all complete sections for review?')) return
    setBusy(true)
    try {
      const { data } = await api.post(`/collection/submit-all/${user.entity}`)
      let msg = `✓ Submitted ${data.submitted_count} section(s): ${data.submitted_sections.join(', ')}`
      if (data.skipped_count > 0) {
        msg += `  ·  Skipped ${data.skipped_count}: ${data.skipped_sections
          .map((s) => `${s.section} (${s.reason})`)
          .join(', ')}`
      }
      setMessage(msg)
      setMsgType(data.skipped_count > 0 ? 'warn' : 'success')
    } catch (err) {
      setMessage('Submit All failed: ' + err.message)
      setMsgType('error')
    } finally {
      setBusy(false)
    }
  }

  const current = sections.find((s) => s.code === activeSection)

  // Compute per-section completeness based on fields we know about
  function sectionStatus(code) {
    if (code === activeSection && fields.length > 0) {
      const incomplete = fields.filter((f) => f.required && !f.value).length
      return { total: fields.length, incomplete }
    }
    return null
  }

  const msgClasses =
    msgType === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : msgType === 'error'
      ? 'bg-red-50 border-red-200 text-red-800'
      : msgType === 'warn'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : 'bg-blue-50 border-blue-200 text-blue-800'

  return (
    <div>
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">BRSR Data Collection</h1>
          <p className="text-[12.6px] text-slate-500 mt-0.5">
            {user.entity} · FY 2025-26
          </p>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          <button
            onClick={handleSubmitSection}
            disabled={busy || !activeSection}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-[12.8px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Submit Current Section
          </button>
          <button
            onClick={handleSubmitAll}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-60"
          >
            {busy ? 'Submitting…' : '✓ Submit All Sections'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 border px-3 py-2.5 rounded-lg text-[12.4px] leading-relaxed ${msgClasses}`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
        {/* Section list */}
        <div className="bg-white border border-slate-200 rounded-xl p-2 h-fit lg:sticky lg:top-20">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold px-3 pt-2 pb-2">
            Disclosure Framework
          </div>
          {sections.map((s) => {
            const stat = sectionStatus(s.code)
            const hasIssue = stat && stat.incomplete > 0
            return (
              <button
                key={s.code}
                onClick={() => setActiveSection(s.code)}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition border ${
                  activeSection === s.code
                    ? 'bg-green-50 border-green-200'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-[13px] text-slate-800 truncate">
                    {s.name}
                  </div>
                  {hasIssue && (
                    <span className="flex-shrink-0 text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      {stat.incomplete} missing
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {s.sub}
                </div>
              </button>
            )
          })}
        </div>

        {/* Field list */}
        <div>
          {current && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-[15px] font-bold">
                    {current.name} — {current.sub}
                  </h3>
                  <p className="text-[11.6px] text-slate-500 mt-1">
                    Owner: <b>{current.owner}</b> · {fields.length} datapoints ·{' '}
                    {fields.filter((f) => f.required && !f.value).length} missing
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-10 text-slate-500">Loading fields…</div>
          )}

          {!loading && fields.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
              No fields found for this section.
            </div>
          )}

          {!loading &&
            fields.map((f) => {
              const missingRequired = f.required && !f.value
              return (
                <div
                  key={f.id}
                  className={`bg-white border rounded-xl p-4 mb-2.5 transition ${
                    f.status === 'flagged'
                      ? 'border-red-300 bg-red-50/30'
                      : missingRequired
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex gap-3 items-start mb-2">
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
                    <span
                      className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10.8px] font-bold ${
                        f.status === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : f.status === 'flagged'
                          ? 'bg-red-100 text-red-800'
                          : missingRequired
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {missingRequired && f.status !== 'complete'
                        ? 'missing'
                        : f.status}
                    </span>
                  </div>

                  {f.field_type === 'textarea' ? (
                    <textarea
                      value={f.value}
                      onChange={(e) => updateField(f.id, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-[13.5px] min-h-[70px]"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type={f.field_type === 'number' ? 'number' : 'text'}
                        value={f.value}
                        onChange={(e) => updateField(f.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-[13.5px]"
                      />
                      {f.unit && (
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          {f.unit}
                        </span>
                      )}
                    </div>
                  )}

                  {f.warn && (
                    <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-[11.3px] mt-3 border-l-[3px] border-red-500">
                      ⚠️ {f.warn}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}