import React from 'react'

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function firstName(name) {
  return String(name || 'Athlete').trim().split(/\s+/)[0] || 'Athlete'
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
    <div className="athlete-selection-grid" role={multi ? 'group' : 'list'}>
      {athletes.map((a) => {
        const sid = String(a.studentId || a.id)
        const active = selectedSet.has(sid)
        const name = a.fullName || a.full_name || 'Athlete'
        return (
          <button
            key={sid}
            type="button"
            className={`athlete-selection-grid__chip${active ? ' athlete-selection-grid__chip--selected' : ''}`}
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onSelect?.(sid)}
          >
            <span className="athlete-selection-grid__avatar" aria-hidden>
              {initials(name)}
            </span>
            <span className="athlete-selection-grid__name">{firstName(name)}</span>
          </button>
        )
      })}
    </div>
  )
}
