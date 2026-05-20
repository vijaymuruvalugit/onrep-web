import React from 'react'
import ExpandableAthleteCard from './ExpandableAthleteCard'
import './phaseCapture.css'

export default function PhaseAthleteCaptureList({
  roster = [],
  captureItems = [],
  entries = [],
  captureMode = 'full',
  participationByStudentId = {},
  expandedAthleteId = null,
  selectedAthleteId = null,
  disabled = false,
  reviewOnly = false,
  onValueChange,
  onSelectAthlete,
  onToggleExpand,
}) {
  if (!roster.length) {
    return (
      <p className="phase-capture-list__empty small text-body-secondary mb-0">
        Add athletes to capture observations for this phase.
      </p>
    )
  }

  return (
    <div className="phase-capture-list" data-testid="phase-athlete-capture-list">
      {roster.map((athlete) => {
        const athleteId = String(athlete.id)
        return (
          <ExpandableAthleteCard
            key={athleteId}
            athlete={athlete}
            captureItems={captureItems}
            entries={entries}
            captureMode={captureMode}
            expanded={expandedAthleteId != null && String(expandedAthleteId) === athleteId}
            selected={selectedAthleteId != null && String(selectedAthleteId) === athleteId}
            participationStatus={participationByStudentId[athleteId]}
            disabled={disabled}
            reviewOnly={reviewOnly}
            onValueChange={onValueChange}
            onSelectAthlete={onSelectAthlete}
            onToggleExpand={onToggleExpand}
          />
        )
      })}
    </div>
  )
}
