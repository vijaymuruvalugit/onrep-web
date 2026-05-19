import { useCallback, useEffect, useState } from 'react'
import sessionRunsApi from '../api/sessionRunsApi'

export function useSessionRuns(operationalSessionId, phaseId) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!operationalSessionId) return
    setLoading(true)
    setError('')
    try {
      const list = await sessionRunsApi.listRuns(operationalSessionId, {
        phaseId: phaseId || undefined,
      })
      setRuns(list)
    } catch (e) {
      setError(e?.message || 'Could not load runs')
    } finally {
      setLoading(false)
    }
  }, [operationalSessionId, phaseId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createRun = useCallback(
    async (runType, runPayload = {}) => {
      if (!operationalSessionId || !phaseId) throw new Error('Session and phase required')
      const run = await sessionRunsApi.createRun(operationalSessionId, {
        runType,
        phaseId,
        runPayload,
      })
      setRuns((prev) => [...prev, run].filter(Boolean))
      return run
    },
    [operationalSessionId, phaseId],
  )

  const updateRun = useCallback(async (runId, runPayload, partial = true) => {
    const run = await sessionRunsApi.updateRun(runId, { runPayload, partial })
    setRuns((prev) => prev.map((r) => (r.id === run?.id ? run : r)))
    return run
  }, [])

  return { runs, loading, error, refresh, createRun, updateRun }
}

export default useSessionRuns
