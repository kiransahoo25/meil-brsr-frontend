import { useEffect, useRef } from 'react'
import api from '../lib/api'

/**
 * A hook to deter screenshot and screen recording attempts.
 * @param {boolean} enabled - Whether the protection is active.
 * @param {function} onAttempt - Callback fired when a capture attempt is detected.
 */
export function useScreenshotPrevention({ enabled = true, onAttempt } = {}) {
  const onAttemptRef = useRef(onAttempt)
  useEffect(() => {
    onAttemptRef.current = onAttempt
  }, [onAttempt])

  useEffect(() => {
    if (!enabled) return

    const logAttempt = (method) => {
      // Layer 4: Log the attempt to the backend
      api.post('/security/log-attempt', { method }).catch(() => {
        // Silently fail if the log endpoint is unreachable
      })
      if (onAttemptRef.current) {
        onAttemptRef.current(method)
      }
    }

    // Layer 1: Block common keyboard shortcuts
    const handleKeyDown = (e) => {
      // PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault()
        e.stopPropagation()
        navigator.clipboard.writeText('') // Clear the clipboard
        logAttempt('PrintScreen')
        return false
      }

      // Windows Snipping Tool (Win + Shift + S) - this is a best-effort block
      if (e.key.toLowerCase() === 's' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        logAttempt('Snipping Tool Shortcut')
        return false
      }

      // macOS screenshot shortcuts (Cmd + Shift + 3, 4, 5)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault()
        logAttempt('macOS Screenshot Shortcut')
        return false
      }
    }

    // Layer 3: Detect PrintScreen usage (on keyup) and window visibility changes
    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('')
        logAttempt('PrintScreen Detected')
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // This can indicate a screen recording tool being activated
        logAttempt('Visibility Change')
      }
    }

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup: remove listeners when the hook is unmounted
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled])
}