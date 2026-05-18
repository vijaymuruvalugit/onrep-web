import React, { useEffect, useRef, useState } from 'react'
import { CButton } from '@coreui/react'

/** Minimal stopwatch — fills manual time on stop (P3). */
export default function StopwatchHelper({ disabled, onStop }) {
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
    const ms = Date.now() - startRef.current
    setElapsedMs(ms)
    onStop?.(ms / 1000)
  }

  const sec = (elapsedMs / 1000).toFixed(2)

  return (
    <div className="stopwatch-helper d-flex flex-wrap align-items-center gap-2 small">
      <span className="font-monospace">{sec}s</span>
      {!running ? (
        <CButton type="button" size="sm" color="light" disabled={disabled} onClick={start}>
          Start
        </CButton>
      ) : (
        <CButton type="button" size="sm" color="primary" disabled={disabled} onClick={stop}>
          Stop → use time
        </CButton>
      )}
    </div>
  )
}
