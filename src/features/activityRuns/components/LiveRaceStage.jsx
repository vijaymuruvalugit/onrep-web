import React from 'react'

export default function LiveRaceStage({
  title,
  statusLine,
  subtitle,
  live = true,
  onEnd,
  children,
}) {
  return (
    <section className="live-race-stage live-run-stage" data-testid="live-race-stage">
      <header className="live-run-stage__header">
        <div className="live-run-stage__titles">
          {live ? <span className="live-run-stage__badge">LIVE</span> : null}
          {statusLine ? (
            <p className="live-race-stage__status font-monospace mb-1">{statusLine}</p>
          ) : null}
          <h2 className="live-run-stage__title">{title}</h2>
          {subtitle ? <p className="live-run-stage__subtitle">{subtitle}</p> : null}
        </div>
        {onEnd ? (
          <button
            type="button"
            className="live-run-stage__end btn btn-sm btn-outline-light"
            onClick={onEnd}
          >
            End
          </button>
        ) : null}
      </header>
      <div className="live-run-stage__body">{children}</div>
    </section>
  )
}
