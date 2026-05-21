import React, { useState } from 'react'
import PhaseAthleteCaptureList from '../phaseCapture/PhaseAthleteCaptureList'

/**
 * Dense athlete observation capture (Skills / technical focus).
 */
export default function ObservationPhaseView({
  roster = [],
  captureItems = [],
  entries = [],
  lapStudentId,
  disabled = false,
  reviewOnly = false,
  onEntryChange,
  onSelectAthlete,
  useSkillsWorkspace = false,
  skillsWorkspace = null,
}) {
  const [expandedAthleteId, setExpandedAthleteId] = useState(null)

  if (useSkillsWorkspace && skillsWorkspace) {
    return skillsWorkspace
  }

  return (
    <section
      className="coach-live-phase-surface coach-live-phase-surface--observation"
      aria-label="Phase capture"
      data-testid="observation-phase-view"
    >
      <PhaseAthleteCaptureList
        roster={roster}
        captureItems={captureItems}
        entries={entries}
        captureMode="full"
        participationByStudentId={{}}
        expandedAthleteId={expandedAthleteId}
        selectedAthleteId={lapStudentId}
        disabled={disabled}
        reviewOnly={reviewOnly}
        onValueChange={onEntryChange}
        onSelectAthlete={onSelectAthlete}
        onToggleExpand={(id) => {
          setExpandedAthleteId(id)
          if (id) onSelectAthlete?.(id)
        }}
      />
      {!lapStudentId && roster.length ? (
        <p className="small text-body-secondary mb-0 mt-2">
          Tap a student to expand quick observations.
        </p>
      ) : null}
    </section>
  )
}
