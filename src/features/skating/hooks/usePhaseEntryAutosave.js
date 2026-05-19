import { useCallback, useEffect, useRef } from 'react'
import { phaseCaptureApi } from '../../../domain/phaseCapture/phaseCaptureApi'

const DEBOUNCE_MS = 400
const FLUSH_IDLE_MS = 2000

/**
 * Queues phase entry upserts per session/phase.
 */
export function usePhaseEntryAutosave({
  operationalSessionId,
  phaseId,
  disabled = false,
  onSaved,
  onError,
}) {
  const queueRef = useRef(new Map())
  const timerRef = useRef(null)
  const idleRef = useRef(null)
  const flushingRef = useRef(false)

  const flush = useCallback(async () => {
    if (disabled || !operationalSessionId || !phaseId) return
    if (flushingRef.current || queueRef.current.size === 0) return
    flushingRef.current = true
    const entries = Array.from(queueRef.current.values())
    queueRef.current = new Map()
    try {
      const result = await phaseCaptureApi.savePhaseEntries(
        operationalSessionId,
        phaseId,
        entries
      )
      onSaved?.(result?.entries ?? [])
    } catch (e) {
      for (const ent of entries) {
        queueRef.current.set(`${ent.athleteId}:${ent.fieldId}`, ent)
      }
      onError?.(e)
    } finally {
      flushingRef.current = false
    }
  }, [disabled, operationalSessionId, phaseId, onSaved, onError])

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (idleRef.current) clearTimeout(idleRef.current)
    timerRef.current = setTimeout(() => {
      flush()
    }, DEBOUNCE_MS)
    idleRef.current = setTimeout(() => {
      flush()
    }, FLUSH_IDLE_MS)
  }, [flush])

  const queueEntry = useCallback(
    (athleteId, fieldId, valueJson) => {
      if (disabled || !athleteId || !fieldId) return
      queueRef.current.set(`${athleteId}:${fieldId}`, {
        athleteId: String(athleteId),
        fieldId: String(fieldId),
        valueJson: valueJson ?? {},
      })
      scheduleFlush()
    },
    [disabled, scheduleFlush]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (idleRef.current) clearTimeout(idleRef.current)
      if (queueRef.current.size > 0) flush()
    }
  }, [flush])

  return { queueEntry, flushNow: flush }
}

export default usePhaseEntryAutosave
