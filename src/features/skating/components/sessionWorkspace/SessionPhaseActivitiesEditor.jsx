import React, { useEffect, useState } from 'react'
import { CButton, CFormInput } from '@coreui/react'
import { maxExercisesForPhase } from '../../utils/phaseInteractionMode'
import { phaseCaptureApi } from '../../../../domain/phaseCapture/phaseCaptureApi'

/**
 * Lightweight exercise list editor (exercise_list / recovery phases only).
 */
export default function SessionPhaseActivitiesEditor({
  operationalSessionId,
  phase,
  disabled = false,
  onUpdated,
  title = 'Exercises',
}) {
  const max = maxExercisesForPhase(phase)
  const [local, setLocal] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset the editable draft when the phase changes */
    const sorted = [...(phase?.exercises || [])].sort((a, b) => a.sequence - b.sequence)
    setLocal(
      sorted.map((ex) => ({
        exerciseName: ex.exerciseName || '',
        description: ex.description || '',
      })),
    )
    setError('')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [phase?.id, phase?.exercises])

  const persist = async (nextList) => {
    if (!operationalSessionId || !phase?.id) return
    setBusy(true)
    setError('')
    try {
      const result = await phaseCaptureApi.replacePhaseExercises(
        operationalSessionId,
        phase.id,
        nextList,
      )
      onUpdated?.(result?.exercises || [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not save exercises')
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = () => {
    if (local.length >= max) return
    setLocal((prev) => [...prev, { exerciseName: '', description: '' }])
  }

  const handleRemove = (index) => {
    const next = local.filter((_, i) => i !== index)
    setLocal(next)
    void persist(
      next
        .filter((row) => row.exerciseName.trim())
        .map((row, i) => ({
          exerciseName: row.exerciseName.trim(),
          description: row.description.trim() || undefined,
          sequence: i + 1,
        })),
    )
  }

  const handleSave = () => {
    const payload = local
      .filter((row) => row.exerciseName.trim())
      .map((row, i) => ({
        exerciseName: row.exerciseName.trim(),
        description: row.description.trim() || undefined,
        sequence: i + 1,
      }))
    void persist(payload)
  }

  return (
    <div
      className="session-phase-activities mt-2 pt-2 border-top"
      data-testid="phase-activities-editor"
    >
      <p className="small fw-semibold mb-2">{title}</p>
      {error ? <p className="small text-warning mb-2">{error}</p> : null}
      <ul className="list-unstyled mb-2">
        {local.map((row, index) => (
          <li key={`act-${index}`} className="d-flex flex-wrap gap-2 align-items-center mb-2">
            <CFormInput
              size="sm"
              className="flex-grow-1"
              placeholder="Exercise name"
              value={row.exerciseName}
              disabled={disabled || busy}
              onChange={(e) => {
                const v = e.target.value
                setLocal((prev) =>
                  prev.map((r, i) => (i === index ? { ...r, exerciseName: v } : r)),
                )
              }}
            />
            <CFormInput
              size="sm"
              className="flex-grow-1"
              placeholder="Note (optional)"
              value={row.description}
              disabled={disabled || busy}
              onChange={(e) => {
                const v = e.target.value
                setLocal((prev) => prev.map((r, i) => (i === index ? { ...r, description: v } : r)))
              }}
            />
            <CButton
              size="sm"
              color="danger"
              variant="outline"
              disabled={disabled || busy}
              onClick={() => handleRemove(index)}
            >
              Remove
            </CButton>
          </li>
        ))}
      </ul>
      <div className="d-flex flex-wrap gap-2">
        <CButton
          size="sm"
          variant="outline"
          disabled={disabled || busy || local.length >= max}
          onClick={handleAdd}
        >
          Add exercise
        </CButton>
        <CButton size="sm" color="primary" disabled={disabled || busy} onClick={handleSave}>
          Save exercises
        </CButton>
      </div>
      <p className="small text-body-secondary mb-0 mt-1">Up to {max} exercises for this phase.</p>
    </div>
  )
}
