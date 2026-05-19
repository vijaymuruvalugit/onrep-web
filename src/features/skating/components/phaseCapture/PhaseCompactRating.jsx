import React from 'react'

/** Horizontal 1–5 pills for card row. */
export default function PhaseCompactRating({ value, scale = 5, disabled = false, onChange }) {
  const n = Math.min(5, Math.max(1, Number(scale) || 5))
  return (
    <div className="phase-rating-compact" role="group" aria-label="Rating">
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
  )
}
