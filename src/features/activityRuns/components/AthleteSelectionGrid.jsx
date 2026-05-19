import React from 'react'
import { CButton } from '@coreui/react'

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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

  return (
    <div className="athlete-selection-grid d-flex flex-wrap gap-2">
      {athletes.map((a) => {
        const sid = String(a.studentId || a.id)
        const active = selectedSet.has(sid)
        return (
          <CButton
            key={sid}
            type="button"
            size="lg"
            color={active ? 'primary' : 'light'}
            className="athlete-selection-grid__chip"
            disabled={disabled}
            onClick={() => onSelect?.(sid)}
          >
            <span className="athlete-selection-grid__avatar" aria-hidden>
              {initials(a.fullName || a.full_name)}
            </span>
            <span className="text-truncate">{a.fullName || a.full_name || 'Athlete'}</span>
          </CButton>
        )
      })}
    </div>
  )
}
