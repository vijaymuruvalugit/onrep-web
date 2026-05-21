import React, { useMemo } from 'react'
import { resolveInteractionMode } from '../utils/phaseInteractionMode'
import { isSkillsPhaseBlock } from '../constants/coachLiveLabels'
import ObservationPhaseView from './phaseInteraction/ObservationPhaseView'
import ExerciseListPhaseView from './phaseInteraction/ExerciseListPhaseView'
import RecoveryPhaseView from './phaseInteraction/RecoveryPhaseView'
import TimingPhaseView from './phaseInteraction/TimingPhaseView'

/**
 * Switches live phase experience by hidden interactionMode.
 */
export default function PhaseInteractionRenderer({
  activePhase,
  phaseRoster = [],
  phaseCapture,
  lapStudentId,
  disabled = false,
  reviewOnly = false,
  isRaceMode = false,
  skillsWorkspace = null,
  onExerciseToggle,
  onSessionObservationChange,
}) {
  const mode = useMemo(() => resolveInteractionMode(activePhase), [activePhase])

  const isTechnical = isSkillsPhaseBlock(activePhase)
  const captureItems = activePhase?.captureItems || []
  const sessionObsByPhaseKey = phaseCapture?.sessionObsByPhaseKey || {}

  if (isRaceMode && mode === 'timing') {
    return null
  }

  if (mode === 'timing') {
    return <TimingPhaseView phaseTitle={activePhase?.title} />
  }

  if (mode === 'exercise_list') {
    return (
      <ExerciseListPhaseView
        activePhase={activePhase}
        sessionObsByPhaseKey={sessionObsByPhaseKey}
        disabled={disabled}
        reviewOnly={reviewOnly}
        onExerciseToggle={onExerciseToggle}
        onSessionObservationChange={onSessionObservationChange}
      />
    )
  }

  if (mode === 'recovery') {
    return (
      <RecoveryPhaseView
        activePhase={activePhase}
        sessionObsByPhaseKey={sessionObsByPhaseKey}
        disabled={disabled}
        reviewOnly={reviewOnly}
        onExerciseToggle={onExerciseToggle}
        onSessionObservationChange={onSessionObservationChange}
      />
    )
  }

  return (
    <ObservationPhaseView
      roster={phaseRoster}
      captureItems={captureItems}
      entries={phaseCapture?.entries || []}
      lapStudentId={lapStudentId}
      disabled={disabled}
      reviewOnly={reviewOnly}
      onEntryChange={phaseCapture?.onEntryChange}
      onSelectAthlete={phaseCapture?.onSelectAthlete}
      useSkillsWorkspace={isTechnical}
      skillsWorkspace={skillsWorkspace}
    />
  )
}
