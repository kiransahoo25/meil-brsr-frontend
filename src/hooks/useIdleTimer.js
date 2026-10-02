import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Auto-logout after inactivity.
 *
 * @param {number} timeoutMs       Total idle timeout (default 3 min)
 * @param {number} warningBeforeMs How long before logout to show warning (default 15 sec)
 * @param {function} onIdle        Fired when the user has been idle past the timeout
 * @param {boolean} enabled        Whether the timer runs
 */
export function useIdleTimer({
  timeoutMs = 3 * 60 * 1000,
  warningBeforeMs = 15 * 1000,
  onIdle = () => {},
  enabled = true,
} = {}) {
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(warningBeforeMs / 1000),
  )

  const warningTimerRef = useRef(null)
  const logoutTimerRef = useRef(null)
  const countdownRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  // Keep latest onIdle in a ref so we don't re-attach listeners on every render
  const onIdleRef = useRef(onIdle)
  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  const clearTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    warningTimerRef.current = null
    logoutTimerRef.current = null
    countdownRef.current = null
  }

  const startTimers = useCallback(() => {
    clearTimers()
    setShowWarning(false)

    const initialSecs = Math.ceil(warningBeforeMs / 1000)
    setSecondsLeft(initialSecs)

    // Fire the warning N seconds before the actual logout
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      let s = initialSecs
      countdownRef.current = setInterval(() => {
        s -= 1
        setSecondsLeft(Math.max(s, 0))
        if (s <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
        }
      }, 1000)
    }, timeoutMs - warningBeforeMs)

    // Actual logout
    logoutTimerRef.current = setTimeout(() => {
      clearTimers()
      onIdleRef.current()
    }, timeoutMs)
  }, [timeoutMs, warningBeforeMs])

  const reset = useCallback(() => {
    lastActivityRef.current = Date.now()
    startTimers()
  }, [startTimers])

  useEffect(() => {
    if (!enabled) {
      clearTimers()
      setShowWarning(false)
      return
    }

    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel',
    ]

    // Throttle resets to at most 1 per second to avoid perf issues
    const handler = () => {
      const now = Date.now()
      if (now - lastActivityRef.current < 1000) return
      reset()
    }

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }))
    startTimers()

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler))
      clearTimers()
    }
  }, [enabled, reset, startTimers])

  return { showWarning, secondsLeft, reset }
}