import React from 'react'
import { formatDurationMs } from '../utils/formatDuration'

const MEDALS = ['🥇', '🥈', '🥉']

export default function RunResultsCard({ results = [], onEditTime }) {
  const sorted = [...results].sort(
    (a, b) => (a.finish_order ?? 99) - (b.finish_order ?? 99),
  )

  if (sorted.length < 1) {
    return <p className="small text-body-secondary">No results yet</p>
  }

  return (
    <ul className="run-results-card list-unstyled mb-0">
      {sorted.map((r, i) => {
        const medal = MEDALS[i] || `${i + 1}.`
        const timeMs = r.time_ms ?? r.completion_time_ms ?? r.lap_time_ms
        const name = r.student_name || r.studentName || r.student_id
        return (
          <li key={String(r.student_id || i)} className="run-results-card__row py-2 border-bottom">
            <span className="me-2">{medal}</span>
            <span className="fw-semibold">{name}</span>
            {timeMs != null ? (
              <span className="ms-2 font-monospace text-body-secondary">
                {formatDurationMs(timeMs)}
              </span>
            ) : null}
            {onEditTime ? (
              <button
                type="button"
                className="btn btn-link btn-sm ms-2 p-0"
                onClick={() => onEditTime(r)}
              >
                Edit
              </button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
