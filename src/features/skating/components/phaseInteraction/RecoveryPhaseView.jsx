import React, { useMemo } from 'react'
import PhaseExerciseChecklist from './PhaseExerciseChecklist'
import StudentPhaseObservationPanel from './StudentPhaseObservationPanel'
import SessionPhaseActivitiesEditor from '../sessionWorkspace/SessionPhaseActivitiesEditor'
import './phaseInteraction.css'

export default function RecoveryPhaseView({
  activePhase,
  roster = [],
  entries = [],
  selectedAthleteId,
  disabled = false,
  reviewOnly = false,
  onEntryChange,
  onExerciseToggle,
  operationalSessionId,
  onExercisesUpdated,
}) {
  const exercises = useMemo(
    () => [...(activePhase?.exercises || [])].sort((a, b) => a.sequence - b.sequence),
    [activePhase?.exercises],
  )

  return (
    <section
      className="coach-live-phase-surface coach-live-phase-surface--recovery"
      aria-label="Recovery flow"
      data-testid="recovery-phase-view"
    >
      <StudentPhaseObservationPanel
        roster={roster}
        captureItems={activePhase?.captureItems || []}
        entries={entries}
        selectedAthleteId={selectedAthleteId}
        disabled={disabled}
        reviewOnly={reviewOnly}
        onEntryChange={onEntryChange}
      />
      <div className="phase-activities-block">
        <PhaseExerciseChecklist
          exercises={exercises}
          disabled={disabled}
          reviewOnly={reviewOnly}
          onToggleComplete={onExerciseToggle}
        />
        {!reviewOnly && operationalSessionId ? (
          <SessionPhaseActivitiesEditor
            operationalSessionId={operationalSessionId}
            phase={activePhase}
            disabled={disabled}
            title="Edit activities"
            onUpdated={(nextExercises) => onExercisesUpdated?.(activePhase?.id, nextExercises)}
          />
        ) : null}
      </div>
    </section>
  )
}
