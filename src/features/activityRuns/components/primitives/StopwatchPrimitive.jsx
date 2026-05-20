import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { CButton } from '@coreui/react'

const StopwatchPrimitive = forwardRef(function StopwatchPrimitive(
  {
    disabled,
    onStopMs,
    onTick,
    className = '',
    autoStart = false,
    operationalMode = false,
    timerStartedAt = null,
  },
  ref,
) {
  const [running, setRunning] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const startRef = useRef(0)
  const lastCaptureRef = useRef(0)
  const tickRef = useRef(null)

  const restoreTimer = useCallback((anchorMs) => {
    if (!anchorMs) return
    startRef.current = anchorMs
    lastCaptureRef.current = 0
    const events = []
    void events
    setElapsedMs(Math.max(0, Date.now() - anchorMs))
    setRunning(true)
  }, [])

  useEffect(() => {
    if (timerStartedAt && !disabled) {
      restoreTimer(timerStartedAt)
      return
    }
    if (autoStart && !disabled) {
      startRef.current = Date.now()
      lastCaptureRef.current = 0
      setElapsedMs(0)
      setRunning(true)
    }
  }, [autoStart, disabled, timerStartedAt, restoreTimer])

  useEffect(() => {
    if (!running) return undefined
    tickRef.current = window.setInterval(() => {
      const ms = Date.now() - startRef.current
      setElapsedMs(ms)
      onTick?.(ms)
    }, 50)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [running, onTick])

  const start = () => {
    startRef.current = Date.now()
    lastCaptureRef.current = 0
    setElapsedMs(0)
    setRunning(true)
  }

  const reset = () => {
    setRunning(false)
    setElapsedMs(0)
    lastCaptureRef.current = 0
  }

  const captureProgressEvent = () => {
    if (!running) start()
    const cumulativeTimeMs = Math.round(Date.now() - startRef.current)
    const splitTimeMs = Math.round(cumulativeTimeMs - lastCaptureRef.current)
    lastCaptureRef.current = cumulativeTimeMs
    return { splitTimeMs, cumulativeTimeMs }
  }

  const stop = () => {
    setRunning(false)
    const ms = Math.round(Date.now() - startRef.current)
    setElapsedMs(ms)
    onStopMs?.(ms)
    return ms
  }

  useImperativeHandle(ref, () => ({
    start,
    reset,
    stop,
    restoreTimer,
    captureProgressEvent,
    isRunning: () => running,
    getElapsedMs: () => elapsedMs,
    getTimerStartedAt: () => startRef.current,
  }))

  const display =
    elapsedMs >= 60000
      ? `${Math.floor(elapsedMs / 60000)}:${((elapsedMs % 60000) / 1000).toFixed(2).padStart(5, '0')}`
      : (elapsedMs / 1000).toFixed(2)

  return (
    <div className={`activity-stopwatch ${className}`.trim()} role="group" aria-label="Stopwatch">
      <div className="activity-stopwatch__display font-monospace" aria-live="polite">
        {display}s
      </div>
      {!operationalMode ? (
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
      ) : null}
    </div>
  )
})

export default StopwatchPrimitive
