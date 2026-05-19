import React from 'react'

/** Labeled semantic rating — never naked number pills alone. */
export default function PhaseSemanticRating({
  label,
  value,
  scale = 5,
  disabled = false,
  compact = false,
  onChange,
}) {
  const n = Math.min(5, Math.max(1, Number(scale) || 5))
  return (
    <div
      className={`phase-semantic-rating${compact ? ' phase-semantic-rating--compact' : ''}`}
      role="group"
      aria-label={label || 'Rating'}
    >
      <span className="phase-semantic-rating__label">{label}</span>
      <div className="phase-rating-compact">
        {Array.from({ length: n }, (_, i) => i + 1).map((score) => (
          <button
            key={score}
            type="button"
            className={`phase-rating-compact__btn${Number(value) === score ? ' phase-rating-compact__btn--on' : ''}`}
            disabled={disabled}
            onClick={() => onChange?.(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  )
}
