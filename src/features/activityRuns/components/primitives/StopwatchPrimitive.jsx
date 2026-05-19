import React, { useEffect, useRef, useState } from 'react'
import { CButton } from '@coreui/react'

export default function StopwatchPrimitive({ disabled, onStopMs, className = '' }) {
  const [running, setRunning] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const startRef = useRef(0)
  const tickRef = useRef(null)

  useEffect(() => {
    if (!running) return undefined
    tickRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startRef.current)
    }, 50)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [running])

  const start = () => {
    startRef.current = Date.now()
    setElapsedMs(0)
    setRunning(true)
  }

  const stop = () => {
    setRunning(false)
    const ms = Math.round(Date.now() - startRef.current)
    setElapsedMs(ms)
    onStopMs?.(ms)
  }

  const reset = () => {
    setRunning(false)
    setElapsedMs(0)
  }

  const display =
    elapsedMs >= 60000
      ? `${Math.floor(elapsedMs / 60000)}:${((elapsedMs % 60000) / 1000).toFixed(2).padStart(5, '0')}`
      : (elapsedMs / 1000).toFixed(2)

  return (
    <div className={`activity-stopwatch ${className}`.trim()} role="group" aria-label="Stopwatch">
      <div className="activity-stopwatch__display font-monospace" aria-live="polite">
        {display}s
      </div>
      <div className="activity-stopwatch__actions d-flex flex-wrap gap-2 justify-content-center">
        {!running ? (
          <CButton type="button" size="lg" color="primary" disabled={disabled} onClick={start}>
            Start
          </CButton>
        ) : (
          <CButton type="button" size="lg" color="danger" disabled={disabled} onClick={stop}>
            Stop
          </CButton>
        )}
        <CButton type="button" size="lg" color="light" disabled={disabled || running} onClick={reset}>
          Reset
        </CButton>
      </div>
    </div>
  )
}
