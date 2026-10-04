import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function TrustBadge({ submissionId }) {
  const [proof, setProof] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!submissionId) return
    api
      .get(`/trust/verify/${submissionId}`)
      .then(({ data }) => {
        setProof(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [submissionId])

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10.5px] font-bold text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
        Verifying…
      </span>
    )
  }

  if (!proof) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10.5px] font-bold text-slate-500">
        No proof
      </span>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowDetails((s) => !s)}
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 border border-green-200 text-[10.5px] font-bold text-green-800 hover:bg-green-200 transition"
      >
        <span>🛡️</span>
        <span>Verified on Blockchain</span>
      </button>

      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-50 w-[320px] max-w-[calc(100vw-32px)] bg-white border border-slate-200 rounded-xl shadow-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 grid place-items-center text-base">
                🛡️
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-slate-800">
                  Cryptographic Proof
                </div>
                <div className="text-[10.5px] text-green-700 font-semibold">
                  ✓ Integrity verified
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-[11.5px]">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                  SHA-256 Fingerprint
                </div>
                <div className="font-mono text-[10.5px] text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 break-all leading-relaxed">
                  {proof.fingerprint}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    Chain
                  </div>
                  <div className="text-slate-700">Bitcoin (OTS)</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    Algorithm
                  </div>
                  <div className="text-slate-700">SHA-256</div>
                </div>
              </div>

              {proof.verification?.anchored_at && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    Anchored
                  </div>
                  <div className="text-slate-700 font-mono text-[11px]">
                    {new Date(proof.verification.anchored_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 text-[10.5px] text-slate-500 leading-relaxed">
              This fingerprint mathematically proves the data has not been altered
              since submission.
            </div>
          </div>
        </>
      )}
    </div>
  )
}