import React, { useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import StopwatchPrimitive from '../components/primitives/StopwatchPrimitive'
import AthleteSelectionGrid from '../components/AthleteSelectionGrid'
import PenaltyStepper from '../components/primitives/PenaltyStepper'
import { buildRunPayload, participationMeta } from '../utils/buildRunPayload'

export default function TimerFlow({
  definition,
  athletes,
  disabled,
  busy,
  runType = 'TIME_TRIAL',
  onSaveRun,
}) {
  const [selectedId, setSelectedId] = useState('')
  const [timeMs, setTimeMs] = useState(null)
  const [penalties, setPenalties] = useState(0)
  const [attempt, setAttempt] = useState(1)
  const [error, setError] = useState('')

  const save = async () => {
    if (!selectedId || timeMs == null) return
    setError('')
    try {
      const result = {
        student_id: selectedId,
        time_ms: timeMs,
        ...participationMeta(),
      }
      if (definition.capabilities.penalties) {
        result.penalties = penalties
        result.completion_time_ms = timeMs
      }
      const payload = buildRunPayload(runType, {
        attempt: definition.capabilities.attempts ? attempt : undefined,
        results: [result],
      })
      await onSaveRun?.(runType, payload)
      setTimeMs(null)
      setPenalties(0)
      if (definition.capabilities.attempts) setAttempt((a) => a + 1)
    } catch (e) {
      setError(e?.message || 'Could not save')
    }
  }

  return (
    <div className="timer-flow">
      <AthleteSelectionGrid
        athletes={athletes}
        selectedId={selectedId}
        disabled={disabled}
        onSelect={setSelectedId}
      />
      {definition.capabilities.timing ? (
        <StopwatchPrimitive
          disabled={disabled || !selectedId}
          onStopMs={setTimeMs}
          className="my-3"
        />
      ) : null}
      {definition.capabilities.penalties ? (
        <PenaltyStepper value={penalties} disabled={disabled} onChange={setPenalties} />
      ) : null}
      {definition.capabilities.attempts ? (
        <p className="small text-body-secondary mt-2">Attempt {attempt}</p>
      ) : null}
      {error ? <CAlert color="danger" className="small py-2">{error}</CAlert> : null}
      <CButton
        type="button"
        color="primary"
        size="lg"
        className="w-100 mt-3 activity-runs-sticky-action"
        disabled={disabled || busy || !selectedId || timeMs == null}
        onClick={() => void save()}
      >
        Save timing
      </CButton>
    </div>
  )
}
