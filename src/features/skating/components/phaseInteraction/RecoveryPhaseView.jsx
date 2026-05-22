import React, { useCallback, useMemo, useState } from 'react'
import PhaseExerciseChecklist from './PhaseExerciseChecklist'
import SessionObservationStrip from './SessionObservationStrip'
import PhaseAthleteCaptureList from '../phaseCapture/PhaseAthleteCaptureList'
import SessionPhaseActivitiesEditor from '../sessionWorkspace/SessionPhaseActivitiesEditor'
import './phaseInteraction.css'

export default function RecoveryPhaseView({
  activePhase,
  roster = [],
  entries = [],
  participationByStudentId = {},
  sessionObsByPhaseKey = {},
  selectedAthleteId,
  disabled = false,
  reviewOnly = false,
  onEntryChange,
  onSelectAthlete,
  onParticipationStatusChange,
  onExerciseToggle,
  onSessionObservationChange,
  operationalSessionId,
  onExercisesUpdated,
}) {
  const [expandedAthleteId, setExpandedAthleteId] = useState(null)
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
      {defs.length ? (
        <SessionObservationStrip
          defs={defs}
          valuesByKey={valuesByKey}
          disabled={disabled || reviewOnly}
          onChange={handleObsChange}
        />
      ) : null}
      {activePhase?.captureItems?.length ? (
        <div className="phase-student-capture">
          <p className="phase-student-capture__label small text-body-secondary mb-2">
            Student attendance and observations
          </p>
          <PhaseAthleteCaptureList
            roster={roster}
            captureItems={activePhase.captureItems}
            entries={entries}
            captureMode="full"
            participationByStudentId={participationByStudentId}
            expandedAthleteId={expandedAthleteId}
            selectedAthleteId={selectedAthleteId}
            disabled={disabled}
            reviewOnly={reviewOnly}
            onValueChange={onEntryChange}
            onSelectAthlete={onSelectAthlete}
            onParticipationStatusChange={onParticipationStatusChange}
            onToggleExpand={(id) => {
              setExpandedAthleteId(id)
              if (id) onSelectAthlete?.(id)
            }}
          />
        </div>
      ) : null}
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
