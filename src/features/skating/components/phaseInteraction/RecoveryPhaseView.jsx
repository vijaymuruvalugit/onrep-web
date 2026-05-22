import React, { useMemo } from 'react'
import PhaseExerciseChecklist from './PhaseExerciseChecklist'
import StudentPhaseObservationPanel from './StudentPhaseObservationPanel'
import { phaseCaptureApi } from '../../../../domain/phaseCapture/phaseCaptureApi'
import { maxExercisesForPhase } from '../../utils/phaseInteractionMode'
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
  const maxExercises = maxExercisesForPhase(activePhase)

  const persistExercises = async (nextExercises) => {
    if (!operationalSessionId || !activePhase?.id) return
    const payload = nextExercises
      .filter((ex) => String(ex.exerciseName || '').trim())
      .map((ex, index) => ({
        exerciseName: String(ex.exerciseName || '').trim(),
        description: ex.description ? String(ex.description).trim() : undefined,
        sequence: index + 1,
      }))
    const result = await phaseCaptureApi.replacePhaseExercises(
      operationalSessionId,
      activePhase.id,
      payload,
    )
    onExercisesUpdated?.(activePhase.id, result?.exercises || [])
  }

  const handleAddExercise = () => {
    const exerciseName = window.prompt('Exercise name')
    const name = String(exerciseName || '').trim()
    if (!name) return
    void persistExercises([...exercises, { exerciseName: name, description: '' }])
  }

  const handleRemoveExercise = (exerciseId) => {
    void persistExercises(exercises.filter((ex) => String(ex.id) !== String(exerciseId)))
  }

  return (
    <section
      className="coach-live-phase-surface coach-live-phase-surface--recovery"
      aria-label="Recovery flow"
      data-testid="recovery-phase-view"
    >
      <div className="phase-exercises-block">
        <PhaseExerciseChecklist
          exercises={exercises}
          disabled={disabled}
          reviewOnly={reviewOnly}
          onToggleComplete={onExerciseToggle}
          onAddExercise={operationalSessionId ? handleAddExercise : null}
          onRemoveExercise={operationalSessionId ? handleRemoveExercise : null}
          canAddExercise={!maxExercises || exercises.length < maxExercises}
        />
      </div>
      <StudentPhaseObservationPanel
        roster={roster}
        captureItems={activePhase?.captureItems || []}
        entries={entries}
        selectedAthleteId={selectedAthleteId}
        disabled={disabled}
        reviewOnly={reviewOnly}
        onEntryChange={onEntryChange}
      />
    </section>
  )
}
