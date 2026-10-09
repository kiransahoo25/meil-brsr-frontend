import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(code, password)
      navigate('/')
    } catch {
      setError('Login failed')
    } finally {
      setBusy(false)
    }
  }

  function quickLogin(c) {
    setCode(c)
    setPassword('demo')
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="bg-gradient-to-br from-[#0b1f33] via-[#14304f] to-[#1d4066] text-white p-12 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-sky-500 grid place-items-center font-extrabold text-2xl text-[#04231a]">
              M
            </div>
            <div>
              <h1 className="font-bold text-sm">Megha Engineering & Infrastructures Ltd.</h1>
              <span className="text-[10px] text-sky-300 tracking-widest uppercase">
                BRSR · ESG · SDG Reporting Portal
              </span>
            </div>
          </div>

          <h2 className="text-4xl font-extrabold mt-12 leading-tight tracking-tight">
            Build. Sustain.
            <br />
            <span className="bg-gradient-to-r from-green-400 to-sky-400 bg-clip-text text-transparent">
              Report with Confidence.
            </span>
          </h2>

          <p className="text-slate-300 mt-4 max-w-lg text-sm leading-relaxed">
            A unified platform for SEBI BRSR compliance, ESG performance tracking, and UN
            SDG alignment across MEIL's 7 business units and 4 subsidiaries.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-2xl font-extrabold">11</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-1 font-bold">
                Reporting Units
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-2xl font-extrabold">250+</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-1 font-bold">
                Project Sites
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-2xl font-extrabold">79K</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-1 font-bold">
                Employees
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-8">
          🏗️ Engineering the Nation since 1989 · Hyderabad, India
        </p>
      </div>

      <div className="bg-white p-8 lg:p-12 flex flex-col justify-center">
        <h2 className="text-2xl font-extrabold tracking-tight">Sign in to your account</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Use your assigned access code or click a demo below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-2">
              Access Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A1, B3, D1, E1"
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none text-sm font-medium"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-green-700 text-white font-extrabold hover:shadow-lg transition disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className="mt-6 bg-green-50 border border-green-200 text-green-900 p-4 rounded-xl text-xs leading-relaxed">
          <b>Demo password:</b> always{' '}
          <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">demo</code>.
          Try a demo user:
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['A1', 'B1', 'C1', 'D1', 'E1'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => quickLogin(c)}
                className="bg-white border border-green-300 text-green-700 px-2.5 py-1 rounded font-mono font-bold text-[11px] hover:bg-green-100 transition"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
