import React from 'react'
import './phaseInteraction.css'

/**
 * Guided exercise checklist — flow over analytics.
 */
export default function PhaseExerciseChecklist({
  exercises = [],
  disabled = false,
  reviewOnly = false,
  onToggleComplete,
  onRemoveExercise,
  onAddExercise,
  canAddExercise = true,
}) {
  if (!exercises.length) {
    return (
      <div className="phase-exercise-list__empty">
        <p className="small text-body-secondary mb-2">No exercises yet.</p>
        {!reviewOnly && onAddExercise ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={disabled || !canAddExercise}
            onClick={onAddExercise}
          >
            Add exercise
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <ul className="phase-exercise-list" data-testid="phase-exercise-checklist">
        {exercises.map((ex) => {
          const done = Boolean(ex.configurationJson?.completed)
          const skipped = Boolean(ex.configurationJson?.skipped)
          return (
            <li
              key={ex.id}
              className={`phase-exercise-list__item${done ? ' phase-exercise-list__item--done' : ''}${skipped ? ' phase-exercise-list__item--skipped' : ''}`}
            >
              <div className="phase-exercise-list__row">
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
                {!reviewOnly && onRemoveExercise ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-link phase-exercise-list__remove"
                    disabled={disabled}
                    aria-label={`Remove ${ex.exerciseName}`}
                    onClick={() => onRemoveExercise(ex.id)}
                  >
                    ×
                  </button>
                ) : null}
              </div>
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
      {!reviewOnly && onAddExercise ? (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary phase-exercise-list__add"
          disabled={disabled || !canAddExercise}
          onClick={onAddExercise}
        >
          Add exercise
        </button>
      ) : null}
    </>
  )
}
