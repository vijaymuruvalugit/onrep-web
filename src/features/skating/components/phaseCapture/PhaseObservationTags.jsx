import React from 'react'

/**
 * Compact horizontal tag chips for athlete cards.
 */
export default function PhaseObservationTags({
  options = [],
  selected = [],
  disabled = false,
  onToggle,
  compact = true,
}) {
  const selectedSet = new Set((selected || []).map(String))

  return (
    <div className={`phase-tags${compact ? ' phase-tags--compact' : ''}`} role="group" aria-label="Observations">
      {options.map((opt) => {
        const on = selectedSet.has(String(opt))
        return (
          <button
            key={opt}
            type="button"
            className={`phase-tags__chip${on ? ' phase-tags__chip--on' : ''}`}
            disabled={disabled}
            onClick={() => onToggle?.(opt, !on)}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
