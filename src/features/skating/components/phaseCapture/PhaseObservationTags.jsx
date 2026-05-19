import React from 'react'

const MAX_VISIBLE = 3

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
  const visible = options.slice(0, MAX_VISIBLE)
  const overflow = Math.max(0, options.length - MAX_VISIBLE)

  return (
    <div className={`phase-tags${compact ? ' phase-tags--compact' : ''}`} role="group" aria-label="Observations">
      {visible.map((opt) => {
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
      {overflow > 0 ? (
        <span className="phase-tags__overflow">+{overflow} more</span>
      ) : null}
    </div>
  )
}
