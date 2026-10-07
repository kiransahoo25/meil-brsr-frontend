import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import EvidenceUploader from '../components/EvidenceUploader'
import CarbonCalculator from '../components/CarbonCalculator'

// Display order for sections in the sidebar
const SECTION_ORDER = [
  'A', 'B',
  'C1', 'C2', 'C3', 'C4', 'C5',
  'C6', 'C6D',
  'C7', 'C8', 'C9',
  'CORE',
]

const EVIDENCE_REQUIRED = new Set([
  'P6-E1', 'P6-E3a', 'P6-E3b', 'P6-E3c', 'P6-E2', 'P3-E5', 'P8-E2', 'Core-1',
])

const CARBON_CALC_FIELDS = new Set(['P6-E1', 'P6-E3a', 'P6-E3b', 'P6-E3c'])

function detectAnomaly(field, value) {
  if (!value || value === '') return null
  const num = parseFloat(value)
  if (isNaN(num)) return null
  if (field.unit === '%' && (num < 0 || num > 100)) return 'Percentage must be between 0 and 100'
  if (['tCO2e', 'GJ', 'KL'].includes(field.unit) && num < 0) return `${field.unit} value cannot be negative`
  if (field.code === 'P3-E5' && num > 20) return 'Fatalities count seems unusually high — please verify'
  if (field.code === 'P6-E1' && num > 10000000) return 'Value seems unusually large — verify units (GJ vs kWh?)'
  if (field.code === 'P6-E2' && num > 1000000) return 'Water withdrawal seems unusually large — verify units'
  if (field.code === 'P8-E2' && num > 1000) return 'CSR expenditure seems unusually large — verify units (Rs crore)'
  if (num > 500000000) return 'Value seems unusually large — please verify'
  return null
}

export default function Collection() {
  const { user } = useAuth()
  const [sections, setSections] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState('info')
  const [calcOpen, setCalcOpen] = useState(null)
  const [missingModal, setMissingModal] = useState(null) // holds missing sections array

  useEffect(() => {
    api
      .get('/collection/sections')
      .then(({ data }) => {
        const sorted = [...data].sort((a, b) => {
          const ia = SECTION_ORDER.indexOf(a.code)
          const ib = SECTION_ORDER.indexOf(b.code)
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
        })
        setSections(sorted)
        if (sorted[0]) setActiveSection(sorted[0].code)
      })
      .catch((err) => {
        setMessage('Failed to load sections: ' + err.message)
        setMsgType('error')
      })
  }, [])

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

  async function submitAll(force = false) {
    setBusy(true)
    setMessage('')
    try {
      const { data } = await api.post(
        `/collection/submit-all/${user.entity}`,
        null,
        { params: force ? { force: true } : {} },
      )

      if (force) {
        // Force submit — everything went through
        setMessage(
          `⚠️ Force-submitted ${data.submitted_count} section(s) with missing fields. Your approver will see what's incomplete.`,
        )
        setMsgType('warn')
      } else {
        // Normal submit
        if (data.skipped_count > 0) {
          // Show caution modal
          setMissingModal(data.skipped_sections || [])
          if (data.submitted_count > 0) {
            setMessage(
              `✓ Submitted ${data.submitted_count} complete section(s). ${data.skipped_count} section(s) still have missing fields.`,
            )
            setMsgType('warn')
          } else {
            setMessage('')
          }
        } else {
          let msg = `✓ Submitted ${data.submitted_count} section(s)`
          if (data.submitted_sections.length > 0) {
            msg += `: ${data.submitted_sections.join(', ')}`
          }
          setMessage(msg)
          setMsgType('success')
        }
      }
    } catch (err) {
      setMessage('Submit failed: ' + err.message)
      setMsgType('error')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmitAll() {
    await submitAll(false)
  }

  async function handleForceSubmit() {
    setMissingModal(null)
    await submitAll(true)
  }

  function jumpToSection(sectionCode) {
    setActiveSection(sectionCode)
    setMissingModal(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function sectionCompletion(code) {
    if (code === activeSection && fields.length > 0) {
      const done = fields.filter((f) => f.value).length
      return { done, total: fields.length, pct: Math.round((done / fields.length) * 100) }
    }
    return null
  }

  const current = sections.find((s) => s.code === activeSection)
  const loadedComplete = fields.filter((f) => f.value).length

  const msgClasses =
    msgType === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : msgType === 'error'
      ? 'bg-red-50 border-red-200 text-red-800'
      : msgType === 'warn'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : 'bg-blue-50 border-blue-200 text-blue-800'

  const totalMissing = missingModal
    ? missingModal.reduce((sum, s) => sum + s.missing_fields.length, 0)
    : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            BRSR Data Collection
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {user.entity} · FY 2025-26 · Fill in the required values below
          </p>
        </div>
        <button
          onClick={handleSubmitAll}
          disabled={busy}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-[13.5px] hover:shadow-lg transition disabled:opacity-60"
        >
          {busy ? 'Submitting…' : '✓ Submit All Sections'}
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`mb-5 border px-4 py-3 rounded-xl text-[12.6px] leading-relaxed ${msgClasses}`}
        >
          {message}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
        {/* Sidebar: Sections */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 h-fit lg:sticky lg:top-20">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold px-3 pt-2 pb-3">
            Sections ({sections.length})
          </div>
          {sections.map((s, idx) => {
            const active = activeSection === s.code
            const stat = sectionCompletion(s.code)
            const complete = stat && stat.pct === 100
            return (
              <button
                key={s.code}
                onClick={() => setActiveSection(s.code)}
                className={`w-full text-left px-3 py-3 rounded-xl mb-1.5 transition border ${
                  active
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-sm'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex-shrink-0 grid place-items-center text-[11px] font-extrabold ${
                      complete
                        ? 'bg-green-500 text-white'
                        : active
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {complete ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13px] font-bold truncate ${
                        active ? 'text-green-800' : 'text-slate-800'
                      }`}
                    >
                      {s.name}
                    </div>
                    <div className="text-[10.8px] text-slate-500 truncate mt-0.5">
                      {s.sub}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Main: Fields */}
        <div>
          {current && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <h3 className="text-[17px] font-extrabold text-slate-900">
                    {current.name}
                  </h3>
                  <p className="text-[12px] text-slate-500 mt-1">
                    {current.sub} · Owner: <b>{current.owner}</b>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {loadedComplete}
                    <span className="text-slate-400 text-base">/{fields.length}</span>
                  </div>
                  <div className="text-[10.5px] uppercase tracking-wider font-bold text-slate-500">
                    filled
                  </div>
                </div>
              </div>
              {fields.length > 0 && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                    style={{ width: `${(loadedComplete / fields.length) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-2xl">
              Loading fields…
            </div>
          )}

          {!loading && fields.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm">
              No fields found for this section.
            </div>
          )}

          {!loading &&
            fields.map((f) => {
              const filled = !!f.value
              const missingRequired = f.required && !f.value
              const anomaly = detectAnomaly(f, f.value)
              const needsEvidence = EVIDENCE_REQUIRED.has(f.code)
              const showCalculator = CARBON_CALC_FIELDS.has(f.code)
              const calcIsOpen = calcOpen === f.id

              return (
                <div
                  key={f.id}
                  className={`bg-white border-2 rounded-2xl p-5 mb-3 transition ${
                    anomaly
                      ? 'border-red-300 bg-red-50/40'
                      : missingRequired
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-[10.5px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                          {f.code}
                        </span>
                        {f.required && (
                          <span className="text-[10px] font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            REQUIRED
                          </span>
                        )}
                        {needsEvidence && (
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            📎 EVIDENCE NEEDED
                          </span>
                        )}
                        {showCalculator && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            🧮 CALCULATOR
                          </span>
                        )}
                      </div>
                      <div className="text-[14.5px] font-bold leading-snug text-slate-900">
                        {f.label}
                      </div>
                    </div>
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full grid place-items-center text-[14px] font-bold ${
                        anomaly
                          ? 'bg-red-100 text-red-700'
                          : filled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {anomaly ? '!' : filled ? '✓' : '·'}
                    </div>
                  </div>

                  {f.field_type === 'textarea' ? (
                    <textarea
                      value={f.value}
                      onChange={(e) => updateField(f.id, e.target.value)}
                      placeholder="Type your answer here…"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-[14px] min-h-[80px] font-medium placeholder:text-slate-400"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type={f.field_type === 'number' ? 'number' : 'text'}
                        value={f.value}
                        onChange={(e) => updateField(f.id, e.target.value)}
                        placeholder={f.field_type === 'number' ? '0' : 'Enter value…'}
                        className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-[14px] font-medium placeholder:text-slate-400"
                      />
                      {f.unit && (
                        <span className="px-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 whitespace-nowrap">
                          {f.unit}
                        </span>
                      )}
                    </div>
                  )}

                  {anomaly && (
                    <div className="mt-3 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-r-lg text-[12.5px] font-semibold">
                      ⚠️ <strong>Unusual value:</strong> {anomaly}
                    </div>
                  )}

                  {f.warn && !anomaly && (
                    <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 text-amber-900 px-4 py-3 rounded-r-lg text-[12.5px]">
                      ⚠️ {f.warn}
                    </div>
                  )}

                  {showCalculator && (
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setCalcOpen(calcIsOpen ? null : f.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-bold text-[12.5px] hover:bg-emerald-100 transition"
                      >
                        🧮 {calcIsOpen ? 'Close Calculator' : 'Open Carbon Calculator'}
                      </button>
                      <span className="text-[11.5px] text-slate-500">
                        Convert kWh or fuel into tCO₂e using Indian factors
                      </span>
                    </div>
                  )}

                  {calcIsOpen && (
                    <div className="mt-3">
                      <CarbonCalculator
                        onInsert={(value) => {
                          updateField(f.id, String(value))
                          setCalcOpen(null)
                        }}
                      />
                    </div>
                  )}

                  {needsEvidence && (
                    <EvidenceUploader
                      fieldId={f.id}
                      entitySlug={user.entity}
                      fieldCode={f.code}
                    />
                  )}
                </div>
              )
            })}

          {!loading && fields.length > 0 && (
            <div className="mt-5 bg-white border-2 border-dashed border-green-300 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold text-slate-800 text-[14px]">
                  Ready to submit all sections?
                </div>
                <div className="text-[12px] text-slate-500 mt-1">
                  All filled sections will be sent to your Entity Approver for review.
                </div>
              </div>
              <button
                onClick={handleSubmitAll}
                disabled={busy}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-[13.5px] hover:shadow-lg transition disabled:opacity-60"
              >
                {busy ? 'Submitting…' : '✓ Submit All Sections'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CAUTION MODAL — Missing fields warning                       */}
      {/* ============================================================ */}
      {missingModal && missingModal.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setMissingModal(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 lg:px-6 py-4 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 grid place-items-center text-2xl flex-shrink-0">
                ⚠️
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base lg:text-lg font-extrabold text-amber-900">
                  Some sections are incomplete
                </h2>
                <p className="text-[12.5px] text-amber-800 mt-0.5 leading-relaxed">
                  {missingModal.length} section{missingModal.length > 1 ? 's' : ''}{' '}
                  with {totalMissing} missing field{totalMissing > 1 ? 's' : ''}.
                  You can go back and fill them, or submit anyway.
                </p>
              </div>
              <button
                onClick={() => setMissingModal(null)}
                className="text-amber-500 hover:text-amber-800 text-2xl leading-none w-8 h-8 grid place-items-center rounded-lg hover:bg-amber-100 flex-shrink-0"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body — section list */}
            <div className="flex-1 overflow-y-auto px-5 lg:px-6 py-4">
              <div className="space-y-3">
                {missingModal.map((sec) => (
                  <div
                    key={sec.section_code}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => jumpToSection(sec.section_code)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-amber-50 transition text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">
                          {sec.section_code}
                        </span>
                        <span className="text-[13px] font-bold text-slate-800">
                          {sec.section}
                        </span>
                      </div>
                      <span className="text-[11.5px] font-bold text-amber-700 whitespace-nowrap">
                        {sec.missing_fields.length} missing →
                      </span>
                    </button>

                    <div className="p-2.5 space-y-1">
                      {sec.missing_fields.map((f) => (
                        <div
                          key={f.code}
                          className="flex items-start gap-2.5 px-2 py-1.5 text-[12px]"
                        >
                          <span className="font-mono text-[10.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold flex-shrink-0 mt-0.5">
                            {f.code}
                          </span>
                          <span className="text-slate-700 leading-snug">
                            {f.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3.5 text-[12.3px] leading-relaxed">
                <strong>What happens if I submit anyway?</strong>
                <br />
                All sections will be sent to your Entity Approver for review — even
                the incomplete ones. Your approver will see exactly which fields are
                empty and can request changes if needed.
              </div>
            </div>

            {/* Footer — actions */}
            <div className="px-5 lg:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setMissingModal(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition"
              >
                ← Go Back and Fill
              </button>
              <button
                onClick={handleForceSubmit}
                disabled={busy}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-[13px] hover:shadow-lg transition disabled:opacity-60"
              >
                {busy ? 'Submitting…' : '⚠️ Submit Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}