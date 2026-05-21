import React from 'react'
import './phaseInteraction.css'

/**
 * Guided activity checklist — flow over analytics.
 */
export default function PhaseExerciseChecklist({
  exercises = [],
  disabled = false,
  reviewOnly = false,
  onToggleComplete,
}) {
  if (!exercises.length) {
    return (
      <p className="phase-exercise-list__empty small text-body-secondary mb-0">
        No activities yet. Edit phases to add guided steps.
      </p>
    )
  }

  return (
    <ul className="phase-exercise-list" data-testid="phase-exercise-checklist">
      {exercises.map((ex) => {
        const done = Boolean(ex.configurationJson?.completed)
        const skipped = Boolean(ex.configurationJson?.skipped)
        return (
          <li
            key={ex.id}
            className={`phase-exercise-list__item${done ? ' phase-exercise-list__item--done' : ''}${skipped ? ' phase-exercise-list__item--skipped' : ''}`}
          >
            <label className="phase-exercise-list__label">
              <input
                type="checkbox"
                className="form-check-input phase-exercise-list__check"
                checked={done}
                disabled={disabled || reviewOnly}
                onChange={(e) =>
                  onToggleComplete?.(ex.id, {
                    completed: e.target.checked,
                    skipped: false,
                  })
                }
              />
              <span className="phase-exercise-list__name">{ex.exerciseName}</span>
            </label>
            {ex.description ? (
              <p className="phase-exercise-list__desc small text-body-secondary mb-0">
                {ex.description}
              </p>
            ) : null}
            {!reviewOnly && !done ? (
              <button
                type="button"
                className="btn btn-link btn-sm phase-exercise-list__skip p-0"
                disabled={disabled}
                onClick={() => onToggleComplete?.(ex.id, { completed: false, skipped: true })}
              >
                Skip
              </button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
