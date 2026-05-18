import React from 'react'
import { livePhaseLabel } from '../constants/coachLiveLabels'

/**
 * Horizontal phase mode-switch — live coaching only (no inline edit).
 */
export default function PhaseModeStrip({
  blocks,
  activeBlockId,
  onSelectBlock,
  athleteCountByPhaseId = {},
  busy = false,
}) {
  if (!blocks?.length) {
    return (
      <div className="phase-mode-strip phase-mode-strip--empty small text-body-secondary py-2">
        No phases yet.
      </div>
    )
  }

  return (
    <nav className="phase-mode-strip" data-testid="phase-mode-strip" aria-label="Training phase">
      <div className="phase-mode-strip__scroll" role="list">
        {blocks.map((block) => {
          const id = String(block.id)
          const isActive = id === String(activeBlockId)
          const count = athleteCountByPhaseId[id] ?? 0
          const label = livePhaseLabel(block.blockType, block.title)
          return (
            <button
              key={id}
              type="button"
              role="listitem"
              className={`phase-mode-chip${isActive ? ' phase-mode-chip--active' : ''}`}
              data-testid={`phase-mode-chip-${id}`}
              disabled={busy}
              aria-pressed={isActive}
              onClick={() => onSelectBlock(id)}
            >
              <span className="phase-mode-chip__label">{label}</span>
              <span className="phase-mode-chip__count" aria-hidden>
                · {count}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
