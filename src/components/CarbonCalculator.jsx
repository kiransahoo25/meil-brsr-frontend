import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function CarbonCalculator({ onInsert }) {
  const [reference, setReference] = useState(null)
  const [tab, setTab] = useState('calculator')
  const [loading, setLoading] = useState(true)

  // Calculator state
  const [calcType, setCalcType] = useState('electricity')
  const [electricity, setElectricity] = useState('')
  const [fuelType, setFuelType] = useState('diesel_litre')
  const [fuelQty, setFuelQty] = useState('')
  const [result, setResult] = useState(null)
  const [calcError, setCalcError] = useState('')
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    api
      .get('/carbon/reference')
      .then(({ data }) => {
        setReference(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function runCalculation() {
    setCalcError('')
    setResult(null)
    setCalculating(true)
    try {
      let endpoint, payload
      if (calcType === 'electricity') {
        const kwh = parseFloat(electricity)
        if (isNaN(kwh) || kwh <= 0) throw new Error('Enter a valid positive number')
        endpoint = '/carbon/calc/electricity'
        payload = { kwh }
      } else if (calcType === 'renewable') {
        const kwh = parseFloat(electricity)
        if (isNaN(kwh) || kwh <= 0) throw new Error('Enter a valid positive number')
        endpoint = '/carbon/calc/renewable'
        payload = { kwh }
      } else {
        const qty = parseFloat(fuelQty)
        if (isNaN(qty) || qty <= 0) throw new Error('Enter a valid positive number')
        endpoint = '/carbon/calc/fuel'
        payload = { fuel_type: fuelType, quantity: qty }
      }

      const { data } = await api.post(endpoint, payload)
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setCalcError(err.response?.data?.detail || err.message)
    } finally {
      setCalculating(false)
    }
  }

  function reset() {
    setElectricity('')
    setFuelQty('')
    setResult(null)
    setCalcError('')
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center text-slate-500 text-[13px]">
        Loading reference data…
      </div>
    )
  }

  if (!reference) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center text-red-600 text-[13px]">
        Could not load carbon reference data.
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-green-700 text-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center text-xl">
            🌍
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-extrabold leading-tight">
              Carbon Equivalent Calculator
            </h3>
            <p className="text-[11.5px] text-emerald-100 mt-0.5">
              Indian emission factors · {reference.version}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('calculator')}
          className={`flex-1 px-4 py-2.5 text-[12.8px] font-semibold border-b-2 -mb-px transition ${
            tab === 'calculator'
              ? 'text-emerald-700 border-emerald-500'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          🧮 Calculator
        </button>
        <button
          onClick={() => setTab('reference')}
          className={`flex-1 px-4 py-2.5 text-[12.8px] font-semibold border-b-2 -mb-px transition ${
            tab === 'reference'
              ? 'text-emerald-700 border-emerald-500'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          📋 Reference Table
        </button>
      </div>

      {/* Calculator tab */}
      {tab === 'calculator' && (
        <div className="p-5">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { id: 'electricity', icon: '⚡', label: 'Electricity' },
              { id: 'fuel', icon: '⛽', label: 'Fuel' },
              { id: 'renewable', icon: '☀️', label: 'Renewable' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setCalcType(t.id)
                  reset()
                }}
                className={`px-2 py-2.5 rounded-xl text-[12px] font-bold transition border-2 ${
                  calcType === t.id
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-lg mb-0.5">{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>

          {/* Inputs */}
          {calcType === 'fuel' && (
            <div className="mb-3">
              <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-medium focus:border-emerald-500 outline-none"
              >
                {Object.entries(reference.fuel_factors).map(([key, f]) => (
                  <option key={key} value={key}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} · {f.value} {f.unit}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-1.5">
              {calcType === 'fuel' ? 'Quantity' : 'Electricity consumed (kWh)'}
            </label>
            <input
              type="number"
              value={calcType === 'fuel' ? fuelQty : electricity}
              onChange={(e) =>
                calcType === 'fuel'
                  ? setFuelQty(e.target.value)
                  : setElectricity(e.target.value)
              }
              placeholder="e.g. 5000"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-[14px] font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={runCalculation}
              disabled={calculating}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-[13px] hover:shadow-lg transition disabled:opacity-60"
            >
              {calculating ? 'Calculating…' : '🧮 Calculate Emissions'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50"
            >
              Reset
            </button>
          </div>

          {/* Error */}
          {calcError && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-800 px-3 py-2.5 rounded-xl text-[12.3px]">
              ⚠️ {calcError}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-4 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-4">
              <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-emerald-700 mb-1">
                {calcType === 'renewable' ? 'Emissions Avoided' : 'Emissions Generated'}
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <div className="text-4xl font-extrabold text-emerald-800 tracking-tight">
                  {result.output}
                </div>
                <div className="text-[13px] font-bold text-emerald-700">
                  {result.output_unit}
                </div>
              </div>

              <div className="space-y-1.5 text-[11.5px] text-emerald-900 bg-white/60 border border-emerald-200 rounded-lg p-3">
                <div>
                  <span className="font-bold">Formula:</span>{' '}
                  <span className="font-mono">{result.formula}</span>
                </div>
                <div>
                  <span className="font-bold">Factor:</span> {result.factor_used}
                </div>
              </div>

              {onInsert && (
                <button
                  onClick={() => {
                    onInsert(result.output)
                    reset()
                  }}
                  className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[12.5px] hover:bg-emerald-700 transition"
                >
                  ✓ Insert {result.output} {result.output_unit} into field
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reference tab */}
      {tab === 'reference' && (
        <div className="p-5">
          {/* Grid factor highlight */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
            <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-emerald-700 mb-1">
              Indian Grid Emission Factor
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-extrabold text-emerald-800">
                {reference.grid_emission_factor.value}
              </div>
              <div className="text-[12.5px] font-bold text-emerald-700">
                tCO₂e / MWh
              </div>
            </div>
            <div className="text-[11px] text-emerald-800 mt-1.5">
              Source: {reference.grid_emission_factor.source} ·{' '}
              {reference.grid_emission_factor.year}
            </div>
          </div>

          {/* Fuel table */}
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-2">
            Fuel Emission Factors
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold">
                  <th className="py-2.5 px-3">Fuel</th>
                  <th className="py-2.5 px-3 text-right">Factor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reference.fuel_factors).map(([key, f]) => (
                  <tr key={key} className="border-t border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-700">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {f.value} <span className="text-slate-500 font-sans text-[11px]">{f.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-[10.5px] text-slate-500 leading-relaxed">
            Last updated: <b>{reference.last_updated}</b> · Sources: Central Electricity
            Authority (CEA), IPCC 2006 Guidelines, Ministry of Environment (MoEFCC)
          </div>
        </div>
      )}
    </div>
  )
}