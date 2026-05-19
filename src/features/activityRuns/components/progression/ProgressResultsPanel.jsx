import React from 'react'
import { getTimingMetrics } from '../../utils/progressionPayload'

export default function ProgressResultsPanel({ events = [], experience }) {
  if (!events.length) {
    return <p className="small text-white-50 mb-0">No captures yet</p>
  }
  return (
    <ul className="progress-results-panel list-unstyled mb-0">
      {[...events]
        .sort((a, b) => Number(a.sequence) - Number(b.sequence))
        .map((ev) => {
          const timing = getTimingMetrics(ev)
          return (
            <li key={ev.sequence} className="progress-results-panel__row">
              <span className="progress-results-panel__seq">
                {experience.progressionLabel} {ev.sequence}
              </span>
              <span className="progress-results-panel__split font-monospace">
                {timing?.split_time_ms != null
                  ? experience.formatSplitMs(timing.split_time_ms)
                  : '—'}
              </span>
            </li>
          )
        })}
    </ul>
  )
}
