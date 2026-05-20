import React from 'react'
import { getActivityRunDefinition } from '../activityRunDefinitions'
import { getRunLaunchMeta } from '../utils/runLaunchMeta'
import { formatDurationMs } from '../utils/formatDuration'
import { getTimingMetrics } from '../utils/normalizeProgressionPayload'

function bestTimeFromPayload(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : []
  const times = results
    .map((r) => r?.time_ms ?? r?.completion_time_ms ?? r?.lap_time_ms)
    .filter((t) => Number.isFinite(Number(t)) && Number(t) > 0)
    .map(Number)
  return times.length ? Math.min(...times) : null
}

function athleteNameFor(row, athleteMap) {
  const id = String(row?.student_id || row?.studentId || '')
  const athlete = athleteMap.get(id)
  return athlete?.full_name || athlete?.fullName || athlete?.name || id || 'Athlete'
}

function eventTimeLabel(event) {
  const timing = getTimingMetrics(event)
  if (!timing) return null
  const split = timing.split_time_ms != null ? formatDurationMs(timing.split_time_ms) : null
  const cumulative =
    timing.cumulative_time_ms != null ? formatDurationMs(timing.cumulative_time_ms) : null
  if (split && cumulative && split !== cumulative) return `${split} split · ${cumulative} total`
  return split || cumulative
}

function RaceRunDetails({ run, athletes = [] }) {
  const payload = run.runPayload || {}
  const results = Array.isArray(payload.results) ? payload.results : []
  const teams = Array.isArray(payload.teams) ? payload.teams : []
  const athleteMap = new Map(
    athletes.map((a) => [String(a.studentId || a.id || ''), a]).filter(([id]) => Boolean(id)),
  )
  const targetLaps =
    payload.progression_config?.target_progress_count ?? payload.race_meta?.targetLaps ?? null
  const startedAt = payload.race_meta?.startedAt
  const finishedAt = payload.race_meta?.endedAt || payload.race_meta?.completedAt

  const orderedResults = [...results].sort((a, b) => {
    const ao = Number(a.finish_order || 9999)
    const bo = Number(b.finish_order || 9999)
    return ao - bo
  })

  return (
    <div className="session-run-timeline__details">
      <div className="session-run-timeline__detail-grid">
        {targetLaps ? (
          <span>
            <strong>{targetLaps}</strong> {Number(targetLaps) === 1 ? 'lap' : 'laps'}
          </span>
        ) : null}
        {startedAt ? <span>Started {new Date(startedAt).toLocaleTimeString()}</span> : null}
        {finishedAt ? <span>Ended {new Date(finishedAt).toLocaleTimeString()}</span> : null}
      </div>

      {orderedResults.length ? (
        <div className="session-run-timeline__detail-section">
          <p className="session-run-timeline__detail-label">Athletes</p>
          {orderedResults.map((row, index) => {
            const events = Array.isArray(row.progress_events) ? row.progress_events : []
            const time = row.time_ms ?? row.completion_time_ms
            return (
              <div key={`${row.student_id || index}`} className="session-run-timeline__athlete-detail">
                <div className="session-run-timeline__athlete-line">
                  <span>
                    {row.finish_order ? `${row.finish_order}. ` : ''}
                    {athleteNameFor(row, athleteMap)}
                  </span>
                  {time != null ? (
                    <span className="font-monospace">{formatDurationMs(time)}</span>
                  ) : null}
                </div>
                {events.length ? (
                  <ol className="session-run-timeline__lap-list">
                    {events.map((event, eventIndex) => (
                      <li key={`${event.sequence || eventIndex}`} className="session-run-timeline__lap">
                        <span>Lap {event.sequence || eventIndex + 1}</span>
                        <span className="font-monospace">{eventTimeLabel(event) || 'Recorded'}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}

      {teams.length ? (
        <div className="session-run-timeline__detail-section">
          <p className="session-run-timeline__detail-label">Teams</p>
          {teams.map((team, index) => (
            <div key={team.team_id || index} className="session-run-timeline__athlete-detail">
              <div className="session-run-timeline__athlete-line">
                <span>{team.name || team.team_id || `Team ${index + 1}`}</span>
                {team.time_ms != null ? (
                  <span className="font-monospace">{formatDurationMs(team.time_ms)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!orderedResults.length && !teams.length ? (
        <p className="small text-body-secondary mb-0">No detailed race data saved.</p>
      ) : null}
    </div>
  )
}

export default function SessionRunTimeline({
  runs = [],
  athletes = [],
  compact = false,
  headingLabel = 'Completed runs',
  defaultCollapsed = false,
}) {
  const completedRuns = runs.filter((run) => {
    const status = run?.runPayload?.race_meta?.status
    return status !== 'active' && status !== 'abandoned'
  })

  if (!completedRuns.length) {
    if (compact) return null
    return (
      <p className="session-run-timeline__empty small text-body-secondary mb-0">
        Completed runs appear here
      </p>
    )
  }

  return (
    <details
      className={`session-run-timeline${compact ? ' session-run-timeline--compact' : ''}`}
      open={!defaultCollapsed}
    >
      <summary className="session-run-timeline__summary">
        <h3 className="session-run-timeline__heading">
          {compact ? 'Done' : headingLabel}
          <span className="session-run-timeline__count">{completedRuns.length}</span>
        </h3>
      </summary>
      <ul className="session-run-timeline__list list-unstyled mb-0">
        {completedRuns.map((run) => {
          const def = getActivityRunDefinition(run.runType)
          const meta = getRunLaunchMeta(run.runType)
          const label =
            run.runPayload?.race_meta?.title || def?.label || run.runType
          const best = bestTimeFromPayload(run.runPayload)
          const n = (run.runPayload?.results || []).length
          return (
            <li key={run.id} className="session-run-timeline__item">
              <details className="session-run-timeline__race-details">
                <summary className="session-run-timeline__race-summary">
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
                      <span className="session-run-timeline__time font-monospace">
                        {formatDurationMs(best)}
                      </span>
                    ) : (
                      <span className="session-run-timeline__athletes">{n} athletes</span>
                    )}
                    <span className="session-run-timeline__check" aria-hidden>
                      ✓
                    </span>
                  </span>
                </summary>
                <RaceRunDetails run={run} athletes={athletes} />
              </details>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
