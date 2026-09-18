import React from 'react'
import {
  athleteInitials,
  cohortNamesFromAthletes,
  shortAthleteLabel,
} from '../../../utils/athleteDisplayName.js'

export default function AthleteSelectionGrid({
  athletes = [],
  selectedId,
  selectedIds = [],
  disabled,
  multi = false,
  onSelect,
}) {
  const selectedSet = new Set(
    multi ? selectedIds.map(String) : selectedId ? [String(selectedId)] : [],
  )
  const cohortNames = cohortNamesFromAthletes(athletes)

  return (
    <div className="athlete-selection-grid" role={multi ? 'group' : 'list'}>
      {athletes.map((a) => {
        const sid = String(a.studentId || a.id)
        const active = selectedSet.has(sid)
        const name = a.fullName || a.full_name || 'Student'
        return (
          <button
            key={sid}
            type="button"
            className={`athlete-selection-grid__chip${active ? ' athlete-selection-grid__chip--selected' : ''}`}
            disabled={disabled}
            aria-pressed={active}
            aria-label={name}
            onClick={() => onSelect?.(sid)}
          >
            <span className="athlete-selection-grid__avatar" aria-hidden>
              {athleteInitials(name)}
            </span>
            <span className="athlete-selection-grid__name">{shortAthleteLabel(name, cohortNames)}</span>
          </button>
        )
      })}
    </div>
  )
}
