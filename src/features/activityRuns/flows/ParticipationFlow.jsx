import React, { useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import DurationPrimitive from '../components/primitives/DurationPrimitive'
import ParticipationPrimitive from '../components/primitives/ParticipationPrimitive'
import { buildRunPayload, participationMeta } from '../utils/buildRunPayload'

export default function ParticipationFlow({
  definition,
  athletes,
  disabled,
  busy,
  runType,
  onSaveRun,
}) {
  const [selectedIds, setSelectedIds] = useState([])
  const [durationMs, setDurationMs] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setError('')
    try {
      const results = selectedIds.map((student_id) => ({
        student_id,
        duration_ms: durationMs,
        ...participationMeta(),
      }))
      const payload = buildRunPayload(runType, {
        completed: runType === 'MEDITATION_BLOCK' ? completed : undefined,
        results,
      })
      await onSaveRun?.(runType, payload)
      setDurationMs(null)
      setSelectedIds([])
    } catch (e) {
      setError(e?.message || 'Could not save')
    }
  }

  return (
    <div className="participation-flow">
      <ParticipationPrimitive
        athletes={athletes}
        selectedIds={selectedIds}
        disabled={disabled}
        onChange={setSelectedIds}
      />
      {definition.capabilities.duration ? (
        <DurationPrimitive
          disabled={disabled || selectedIds.length < 1}
          onDurationMs={setDurationMs}
        />
      ) : null}
      {runType === 'MEDITATION_BLOCK' ? (
        <CButton
          type="button"
          color={completed ? 'success' : 'light'}
          size="lg"
          className="w-100 my-2"
          disabled={disabled}
          onClick={() => setCompleted((c) => !c)}
        >
          {completed ? 'Completed' : 'Mark completed'}
        </CButton>
      ) : null}
      {error ? <CAlert color="danger" className="small py-2">{error}</CAlert> : null}
      <CButton
        type="button"
        color="primary"
        size="lg"
        className="w-100 mt-3"
        disabled={disabled || busy || selectedIds.length < 1}
        onClick={() => void save()}
      >
        Save
      </CButton>
    </div>
  )
}
