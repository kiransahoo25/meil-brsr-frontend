import { useState, useCallback } from 'react'
import { useScreenshotPrevention } from '../hooks/useScreenshotPrevention'

/**
 * Wraps the application to enable screenshot prevention and provide
 * user feedback when an attempt is detected.
 */
export default function ScreenshotGuard({ children }) {
  const [attempts, setAttempts] = useState(0)
  const [showWarning, setShowWarning] = useState(false)

  const handleAttempt = useCallback((method) => {
    setAttempts((prev) => {
      const newCount = prev + 1
      // Only show the warning every 5 attempts to avoid being annoying
      if (newCount % 5 === 1) {
        setShowWarning(true)
        setTimeout(() => setShowWarning(false), 4000)
      }
      return newCount
    })
  }, [])

  // Layer 1, 3 & 4: Enable the hook
  useScreenshotPrevention({ enabled: true, onAttempt: handleAttempt })

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-xl bg-slate-900 text-white text-[13px] font-medium shadow-2xl border border-slate-700 flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <strong>Security Notice:</strong> Screen capture attempts on this portal are
            monitored and logged.
          </div>
        </div>
      )}
    </>
  )
}