import React from 'react'
import { getTimingMetrics } from '../../utils/progressionPayload'

export default function ParticipantProgressGrid({
  athletes,
  results = [],
  activeStudentId,
  disabled,
  onSelect,
  onCaptureParticipant,
}) {
  return (
    <div className="participant-progress-grid">
      {athletes.map((a) => {
        const sid = String(a.studentId || a.id)
        const row = results.find((r) => String(r.student_id) === sid)
        const events = row?.progress_events || []
        const last = events[events.length - 1]
        const timing = getTimingMetrics(last)
        const isActive = activeStudentId === sid
        return (
          <button
            key={sid}
            type="button"
            className={`participant-progress-grid__card${isActive ? ' participant-progress-grid__card--active' : ''}`}
            disabled={disabled}
            onClick={() => {
              onSelect?.(sid)
              onCaptureParticipant?.(sid)
            }}
          >
            <span className="participant-progress-grid__name">{a.fullName || a.full_name}</span>
            <span className="participant-progress-grid__count">{events.length} captured</span>
            {timing?.split_time_ms != null ? (
              <span className="participant-progress-grid__time font-monospace">
                {(timing.split_time_ms / 1000).toFixed(2)}s
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
