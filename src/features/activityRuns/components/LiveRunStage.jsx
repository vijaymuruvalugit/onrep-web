import React from 'react'

export default function LiveRunStage({ title, subtitle, live = true, onEnd, children }) {
  return (
    <section className="live-run-stage" data-testid="live-run-stage">
      <header className="live-run-stage__header">
        <div className="live-run-stage__titles">
          {live ? <span className="live-run-stage__badge">LIVE</span> : null}
          <h2 className="live-run-stage__title">{title}</h2>
          {subtitle ? <p className="live-run-stage__subtitle">{subtitle}</p> : null}
        </div>
        {onEnd ? (
          <button type="button" className="live-run-stage__end btn btn-sm btn-outline-light" onClick={onEnd}>
            End
          </button>
        ) : null}
      </header>
      <div className="live-run-stage__body">{children}</div>
    </section>
  )
}
