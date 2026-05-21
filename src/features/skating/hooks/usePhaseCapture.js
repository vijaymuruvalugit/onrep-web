import { useCallback, useEffect, useMemo, useState } from 'react'
import { phaseCaptureApi } from '../../../domain/phaseCapture/phaseCaptureApi'

/**
 * Loads phases, capture items, entries, and capture mode for operational session.
 */
export function usePhaseCapture(operationalSessionId, { enabled = true } = {}) {
  const [phases, setPhases] = useState([])
  const [entries, setEntries] = useState([])
  const [sessionObservations, setSessionObservations] = useState([])
  const [captureMode, setCaptureMode] = useState('full')
  const [sessionPresets, setSessionPresets] = useState([])
  const [coachDefaults, setCoachDefaults] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!operationalSessionId || !enabled) return
    setLoading(true)
    setError('')
    try {
      const [payload, defaults] = await Promise.all([
        phaseCaptureApi.getSessionPhases(operationalSessionId),
        phaseCaptureApi.getCoachDefaults().catch(() => ({})),
      ])
      setPhases(payload?.phases ?? [])
      setEntries(payload?.entries ?? [])
      setSessionObservations(payload?.sessionObservations ?? [])
      setCaptureMode(payload?.captureMode || defaults?.defaultCaptureMode || 'full')
      setSessionPresets(payload?.sessionPresets ?? [])
      setCoachDefaults(defaults || {})
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load phases')
    } finally {
      setLoading(false)
    }
  }, [operationalSessionId, enabled])

  useEffect(() => {
    reload()
  }, [reload])

  const entriesByAthleteField = useMemo(() => {
    const map = {}
    for (const e of entries) {
      const key = `${e.athleteId}:${e.fieldId}`
      map[key] = e.valueJson
    }
    return map
  }, [entries])

  const mergeEntries = useCallback((saved) => {
    if (!Array.isArray(saved) || saved.length === 0) return
    setEntries((prev) => {
      const next = [...prev]
      for (const row of saved) {
        const idx = next.findIndex(
          (e) =>
            String(e.athleteId) === String(row.athleteId) &&
            String(e.fieldId) === String(row.fieldId)
        )
        if (idx >= 0) next[idx] = { ...next[idx], ...row }
        else next.push(row)
      }
      return next
    })
  }, [])

  const setMode = useCallback(
    async (mode) => {
      setCaptureMode(mode)
      if (!operationalSessionId) return
      try {
        await phaseCaptureApi.setCaptureMode(operationalSessionId, mode)
      } catch {
        /* optimistic */
      }
    },
    [operationalSessionId]
  )

  const updatePhaseInList = useCallback((phaseDto) => {
    if (!phaseDto?.id) return
    setPhases((prev) => prev.map((p) => (String(p.id) === String(phaseDto.id) ? { ...p, ...phaseDto } : p)))
  }, [])

  const mergeSessionObservations = useCallback((saved) => {
    if (!Array.isArray(saved) || saved.length === 0) return
    setSessionObservations((prev) => {
      const next = [...prev]
      for (const row of saved) {
        const idx = next.findIndex(
          (e) =>
            String(e.phaseId) === String(row.phaseId) &&
            String(e.observationKey) === String(row.observationKey)
        )
        if (idx >= 0) next[idx] = { ...next[idx], ...row }
        else next.push(row)
      }
      return next
    })
  }, [])

  const sessionObsByPhaseKey = useMemo(() => {
    const map = {}
    for (const row of sessionObservations) {
      const key = `${row.phaseId}:${row.observationKey}`
      map[key] = row.valueJson
    }
    return map
  }, [sessionObservations])

  const updatePhaseExercisesInList = useCallback((phaseId, exercises) => {
    setPhases((prev) =>
      prev.map((p) =>
        String(p.id) === String(phaseId) ? { ...p, exercises: exercises || [] } : p
      )
    )
  }, [])

  return {
    phases,
    entries,
    sessionObservations,
    sessionObsByPhaseKey,
    entriesByAthleteField,
    captureMode,
    setCaptureMode: setMode,
    sessionPresets,
    coachDefaults,
    loading,
    error,
    reload,
    mergeEntries,
    mergeSessionObservations,
    updatePhaseExercisesInList,
    updatePhaseInList,
    setPhases,
  }
}

export default usePhaseCapture
