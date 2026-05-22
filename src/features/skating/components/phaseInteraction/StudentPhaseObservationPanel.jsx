import React, { useMemo } from 'react'
import PhaseCaptureRenderer from '../phaseCapture/PhaseCaptureRenderer'
import { entryValueForField } from '../../utils/phaseCaptureDisplay'
import './phaseInteraction.css'

function athleteName(athlete) {
  return (
    athlete?.full_name ||
    athlete?.fullName ||
    [athlete?.first_name, athlete?.last_name].filter(Boolean).join(' ') ||
    'student'
  )
}

export default function StudentPhaseObservationPanel({
  roster = [],
  captureItems = [],
  entries = [],
  selectedAthleteId,
  disabled = false,
  reviewOnly = false,
  onEntryChange,
}) {
  const selectedAthlete = useMemo(
    () => roster.find((r) => String(r.id) === String(selectedAthleteId)) || null,
    [roster, selectedAthleteId],
  )
  const items = useMemo(
    () =>
      [...(captureItems || [])].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
    [captureItems],
  )

  if (!items.length) return null

  if (!selectedAthleteId || !selectedAthlete) {
    return (
      <div className="phase-student-observations" data-testid="phase-student-observations">
        <p className="phase-student-observations__label small text-body-secondary mb-2">
          Student observations
        </p>
        <p className="small text-body-secondary mb-0">
          Select a student above to capture observations for this phase.
        </p>
      </div>
    )
  }

  const name = athleteName(selectedAthlete)

  return (
    <div className="phase-student-observations" data-testid="phase-student-observations">
      <p className="phase-student-observations__label small text-body-secondary mb-2">
        Observations for {name}
      </p>
      <div className="phase-student-observations__fields">
        {items.map((item) => (
          <div key={item.id} className="phase-student-observations__field">
            <span className="phase-student-observations__field-label small">{item.label}</span>
            <PhaseCaptureRenderer
              item={item}
              valueJson={entryValueForField(entries, selectedAthleteId, item.id)}
              disabled={disabled || reviewOnly}
              compact
              onChange={(next) => onEntryChange?.(selectedAthleteId, item.id, next)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
