import React, { useState } from 'react'
import { getActivityRunDefinition } from '../activityRunDefinitions'

export default function SessionRunTimeline({ runs = [] }) {
  const [open, setOpen] = useState({})

  if (!runs.length) {
    return <p className="small text-body-secondary">No completed runs yet</p>
  }

  return (
    <div className="session-run-timeline">
      {runs.map((run) => {
        const def = getActivityRunDefinition(run.runType)
        const label = def?.label || run.runType
        const key = run.id
        const isOpen = open[key] !== false
        const seq = run.runSequence ?? ''
        return (
          <div key={key} className="session-run-timeline__card border rounded mb-2">
            <button
              type="button"
              className="btn btn-light w-100 text-start d-flex justify-content-between align-items-center py-3"
              onClick={() => setOpen((o) => ({ ...o, [key]: !isOpen }))}
            >
              <span className="fw-semibold">
                {label}
                {seq ? ` #${seq}` : ''}
              </span>
              <span className="small text-body-secondary">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen ? (
              <div className="px-3 pb-3 small text-body-secondary">
                {(run.runPayload?.results || []).length} result(s)
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
