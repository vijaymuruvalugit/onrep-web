import React from 'react'
import PhaseAthleteCaptureCard from './PhaseAthleteCaptureCard'
import './phaseCapture.css'

export default function PhaseAthleteCaptureList({
  roster = [],
  captureItems = [],
  entries = [],
  captureMode = 'full',
  coachDefaults = {},
  activePhase,
  disabled = false,
  reviewOnly = false,
  onValueChange,
  onOpenDetail,
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
      {roster.map((athlete) => (
        <PhaseAthleteCaptureCard
          key={String(athlete.id)}
          athlete={athlete}
          captureItems={captureItems}
          entries={entries}
          captureMode={captureMode}
          coachDefaults={coachDefaults}
          activePhase={activePhase}
          disabled={disabled}
          reviewOnly={reviewOnly}
          onValueChange={onValueChange}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  )
}
