import React, { useCallback, useMemo } from 'react'
import PhaseExerciseChecklist from './PhaseExerciseChecklist'
import SessionObservationStrip from './SessionObservationStrip'
import './phaseInteraction.css'

export default function RecoveryPhaseView({
  activePhase,
  sessionObsByPhaseKey = {},
  disabled = false,
  reviewOnly = false,
  onExerciseToggle,
  onSessionObservationChange,
}) {
  const exercises = useMemo(
    () => [...(activePhase?.exercises || [])].sort((a, b) => a.sequence - b.sequence),
    [activePhase?.exercises],
  )

  const defs = activePhase?.sessionObservationDefs || []

  const valuesByKey = useMemo(() => {
    const phaseId = String(activePhase?.id || '')
    const out = {}
    for (const def of defs) {
      const key = def.observationKey
      out[key] = sessionObsByPhaseKey[`${phaseId}:${key}`] || {}
    }
    return out
  }, [activePhase?.id, defs, sessionObsByPhaseKey])

  const handleObsChange = useCallback(
    (observationKey, valueJson) => {
      onSessionObservationChange?.(observationKey, valueJson)
    },
    [onSessionObservationChange],
  )

  return (
    <section
      className="coach-live-phase-surface coach-live-phase-surface--recovery"
      aria-label="Recovery flow"
      data-testid="recovery-phase-view"
    >
      <PhaseExerciseChecklist
        exercises={exercises}
        disabled={disabled}
        reviewOnly={reviewOnly}
        onToggleComplete={onExerciseToggle}
      />
      {defs.length ? (
        <SessionObservationStrip
          defs={defs}
          valuesByKey={valuesByKey}
          disabled={disabled || reviewOnly}
          onChange={handleObsChange}
        />
      ) : null}
    </section>
  )
}
