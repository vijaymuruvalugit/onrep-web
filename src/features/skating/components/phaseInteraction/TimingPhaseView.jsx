import React from 'react'
import './phaseInteraction.css'

/** Event-centric timing placeholder — not athlete-card dense. */
export default function TimingPhaseView({ phaseTitle }) {
  return (
    <section
      className="coach-live-phase-surface coach-live-phase-surface--timing"
      aria-label="Timing"
      data-testid="timing-phase-view"
    >
      <div className="phase-timing-placeholder">
        <p className="phase-timing-placeholder__title mb-1">
          {phaseTitle ? `${phaseTitle}` : 'Race'}
        </p>
        <p className="phase-timing-placeholder__hint text-body-secondary mb-0">
          Timing tools coming soon
        </p>
      </div>
    </section>
  )
}
