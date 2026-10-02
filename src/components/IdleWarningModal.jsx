export default function IdleWarningModal({ secondsLeft, onStay, onLogout }) {
  const pct = Math.max(0, Math.min(100, (secondsLeft / 15) * 100))

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-100 grid place-items-center mx-auto mb-4 animate-pulse">
          <span className="text-3xl">⏱️</span>
        </div>

        <h2 className="text-xl font-bold text-center text-slate-900">
          Still there?
        </h2>
        <p className="text-center text-slate-500 mt-2 text-[13.5px] leading-relaxed">
          You've been inactive for a while. For your security, you'll be signed
          out automatically in:
        </p>

        {/* Countdown */}
        <div className="text-center my-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-red-50 border-4 border-red-200 grid place-items-center">
              <span className="text-4xl font-extrabold text-red-600 tabular-nums leading-none">
                {secondsLeft}
              </span>
            </div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mt-3">
              seconds
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onLogout}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition"
          >
            Sign Out Now
          </button>
          <button
            onClick={onStay}
            autoFocus
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-[13px] hover:shadow-lg transition"
          >
            Stay Logged In
          </button>
        </div>

        <div className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
          The portal automatically signs you out after{' '}
          <b className="text-slate-600">3 minutes</b> of inactivity.
        </div>
      </div>
    </div>
  )
}