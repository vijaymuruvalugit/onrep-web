import { useCallback, useEffect, useRef, useState } from 'react'
import { skatingOpsApi } from '../api/skatingOpsApi'

const FLUSH_IDLE_MS = 2000
const SK_PENDING_QUEUE = 'onrep.skating.coachingPendingQueue'

function emptyDraft() {
  return { scores: {}, tags: [], markers: [], notes: '' }
}

function readPendingQueue(sessionId) {
  try {
    const raw = sessionStorage.getItem(SK_PENDING_QUEUE)
    if (!raw) return []
    const all = JSON.parse(raw)
    return Array.isArray(all) ? all.filter((x) => x.sessionId === sessionId) : []
  } catch {
    return []
  }
}

function writePendingQueue(sessionId, items) {
  try {
    const raw = sessionStorage.getItem(SK_PENDING_QUEUE)
    const all = raw ? JSON.parse(raw) : []
    const rest = Array.isArray(all) ? all.filter((x) => x.sessionId !== sessionId) : []
    sessionStorage.setItem(SK_PENDING_QUEUE, JSON.stringify([...rest, ...items]))
  } catch {
    /* ignore */
  }
}

function newFlushId() {
  return `flush-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Optimistic coaching draft with batched flush (not per-tap POST).
 *
 * @param {object} opts
 * @param {string} opts.sessionId
 * @param {string} opts.studentId
 * @param {string} opts.sessionMode
 * @param {string} opts.blockId
 * @param {boolean} opts.disabled
 * @param {(payload: object) => void} [opts.onFlushSuccess]
 * @param {(err: Error) => void} [opts.onFlushError]
 */
export function useCoachingDraftQueue({
  sessionId,
  studentId,
  sessionMode = 'practice',
  blockId = '',
  disabled = false,
  onFlushSuccess,
  onFlushError,
}) {
  const [draft, setDraft] = useState(emptyDraft)
  const [syncState, setSyncState] = useState('idle')
  const [syncError, setSyncError] = useState('')
  const flushTimerRef = useRef(null)
  const flushingRef = useRef(false)
  const draftRef = useRef(draft)
  const studentIdRef = useRef(studentId)
  const prevStudentRef = useRef(studentId)

  draftRef.current = draft
  studentIdRef.current = studentId

  const hasPending = useCallback((d) => {
    const scores = Object.keys(d.scores || {}).length > 0
    const tags = (d.tags || []).length > 0
    const markers = (d.markers || []).length > 0
    const notes = Boolean(d.notes && String(d.notes).trim())
    return scores || tags || markers || notes
  }, [])

  const buildPayload = useCallback(
    (d, sid) => {
      const scores = {}
      for (const [k, v] of Object.entries(d.scores || {})) {
        const n = Number(v)
        if (n >= 1 && n <= 5) scores[k] = n
      }
      return {
        studentId: sid,
        clientFlushId: newFlushId(),
        sessionMode,
        blockId: blockId || undefined,
        scores,
        tags: [...(d.tags || [])],
        markers: [...(d.markers || [])],
        notes: d.notes?.trim() || undefined,
        eventType: 'batch',
        captureMode: 'batch',
      }
    },
    [sessionMode, blockId],
  )

  const flushDraft = useCallback(
    async (targetStudentId, draftSnapshot) => {
      if (!sessionId || !targetStudentId || disabled) return true
      const d = draftSnapshot || draftRef.current
      if (!hasPending(d)) return true
      if (flushingRef.current) return false

      flushingRef.current = true
      setSyncState('syncing')
      setSyncError('')
      const payload = buildPayload(d, targetStudentId)

      try {
        await skatingOpsApi.postCoachingEventsBatch(sessionId, payload)
        if (String(targetStudentId) === String(studentIdRef.current)) {
          setDraft(emptyDraft())
        }
        setSyncState('saved')
        onFlushSuccess?.(payload)
        return true
      } catch (e) {
        const msg = e?.message || 'Could not sync coaching notes'
        setSyncError(msg)
        setSyncState('error')
        const pending = readPendingQueue(sessionId)
        pending.push({ sessionId, payload, at: Date.now() })
        writePendingQueue(sessionId, pending)
        onFlushError?.(e)
        return false
      } finally {
        flushingRef.current = false
      }
    },
    [sessionId, disabled, hasPending, buildPayload, onFlushSuccess, onFlushError],
  )

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current)
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null
      void flushDraft(studentIdRef.current, draftRef.current)
    }, FLUSH_IDLE_MS)
  }, [flushDraft])

  const flushNow = useCallback(async () => {
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
    return flushDraft(studentId, draftRef.current)
  }, [flushDraft, studentId])

  useEffect(() => {
    const prev = prevStudentRef.current
    if (prev && prev !== studentId && sessionId) {
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
      const snapshot = { ...draftRef.current, scores: { ...draftRef.current.scores } }
      void flushDraft(prev, snapshot)
      setDraft(emptyDraft())
    }
    prevStudentRef.current = studentId
    setSyncState('idle')
    setSyncError('')
  }, [studentId, sessionId, flushDraft])

  useEffect(() => {
    if (!sessionId) return
    const pending = readPendingQueue(sessionId)
    if (pending.length === 0) return
    ;(async () => {
      const remain = []
      for (const item of pending) {
        try {
          await skatingOpsApi.postCoachingEventsBatch(sessionId, item.payload)
        } catch {
          remain.push(item)
        }
      }
      writePendingQueue(sessionId, remain)
    })()
  }, [sessionId])

  useEffect(() => {
    if (!hasPending(draft) || disabled) return undefined
    scheduleFlush()
    return () => {
      if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current)
    }
  }, [draft, disabled, hasPending, scheduleFlush])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') void flushNow()
    }
    const onBlur = () => void flushNow()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
    }
  }, [flushNow])

  const setQuickScore = useCallback((key, n) => {
    setDraft((prev) => ({ ...prev, scores: { ...prev.scores, [key]: n } }))
    setSyncState('pending')
  }, [])

  const toggleTag = useCallback((key) => {
    setDraft((prev) => {
      const set = new Set(prev.tags || [])
      if (set.has(key)) set.delete(key)
      else set.add(key)
      return { ...prev, tags: [...set] }
    })
    setSyncState('pending')
  }, [])

  const addMarker = useCallback((key) => {
    setDraft((prev) => ({
      ...prev,
      markers: [...(prev.markers || []), key],
    }))
    setSyncState('pending')
  }, [])

  const setNotes = useCallback((notes) => {
    setDraft((prev) => ({ ...prev, notes }))
    setSyncState('pending')
  }, [])

  return {
    draft,
    syncState,
    syncError,
    setQuickScore,
    toggleTag,
    addMarker,
    setNotes,
    flushNow,
    hasPending: hasPending(draft),
  }
}
