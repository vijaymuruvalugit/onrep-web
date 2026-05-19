import React from 'react'
import { getActivityRunDefinition } from '../activityRunDefinitions'
import { getRunLaunchMeta } from '../utils/runLaunchMeta'
import { formatDurationMs } from '../utils/formatDuration'

function bestTimeFromPayload(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : []
  const times = results
    .map((r) => r?.time_ms ?? r?.completion_time_ms ?? r?.lap_time_ms)
    .filter((t) => Number.isFinite(Number(t)) && Number(t) > 0)
    .map(Number)
  return times.length ? Math.min(...times) : null
}

export default function SessionRunTimeline({ runs = [], compact = false }) {
  if (!runs.length) {
    if (compact) return null
    return (
      <p className="session-run-timeline__empty small text-body-secondary mb-0">
        Completed runs appear here
      </p>
    )
  }

  return (
    <div className={`session-run-timeline${compact ? ' session-run-timeline--compact' : ''}`}>
      <h3 className="session-run-timeline__heading">
        {compact ? 'Done' : 'Completed runs'}
        <span className="session-run-timeline__count">{runs.length}</span>
      </h3>
      <ul className="session-run-timeline__list list-unstyled mb-0">
        {runs.map((run) => {
          const def = getActivityRunDefinition(run.runType)
          const meta = getRunLaunchMeta(run.runType)
          const label = def?.label || run.runType
          const best = bestTimeFromPayload(run.runPayload)
          const n = (run.runPayload?.results || []).length
          return (
            <li key={run.id} className="session-run-timeline__item">
              <span className="session-run-timeline__emoji" aria-hidden>
                {meta.emoji}
              </span>
              <span className="session-run-timeline__meta">
                <span className="session-run-timeline__label">{label}</span>
                {run.runSequence != null ? (
                  <span className="session-run-timeline__seq">#{run.runSequence}</span>
                ) : null}
              </span>
              <span className="session-run-timeline__stats">
                {best != null ? (
                  <span className="session-run-timeline__time font-monospace">{formatDurationMs(best)}</span>
                ) : (
                  <span className="session-run-timeline__athletes">{n} athletes</span>
                )}
                <span className="session-run-timeline__check" aria-hidden>
                  ✓
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
