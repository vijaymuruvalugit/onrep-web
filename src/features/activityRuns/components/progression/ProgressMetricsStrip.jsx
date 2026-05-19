import React from 'react'

export default function ProgressMetricsStrip({ experience, metrics }) {
  return (
    <div className="progress-metrics-strip d-flex flex-wrap gap-3 small">
      <div>
        <span className="text-white-50">{experience.bestSplitLabel}</span>
        <div className="fw-bold font-monospace">
          {metrics.bestProgressSplit != null
            ? experience.formatSplitMs(metrics.bestProgressSplit)
            : '—'}
        </div>
      </div>
      <div>
        <span className="text-white-50">{experience.currentSplitLabel}</span>
        <div className="fw-bold font-monospace">
          {metrics.currentProgressSplit != null
            ? experience.formatSplitMs(metrics.currentProgressSplit)
            : '—'}
        </div>
      </div>
    </div>
  )
}
