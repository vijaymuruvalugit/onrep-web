import React, { useMemo, useState } from 'react'
import {
  CCloseButton,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
} from '@coreui/react'
import { livePhaseLabel } from '../constants/coachLiveLabels'
import './PhaseModeStrip.css'

function phaseLabelForBlock(block) {
  return livePhaseLabel(block.blockType, block.title)
}

/**
 * Phase mode-switch — desktop: horizontal chips; mobile/tablet: single selector + sheet.
 */
function statusClass(runtimeStatus) {
  if (runtimeStatus === 'completed') return ' phase-mode-chip--completed'
  if (runtimeStatus === 'skipped') return ' phase-mode-chip--skipped'
  if (runtimeStatus === 'active') return ' phase-mode-chip--active-phase'
  return ''
}

export default function PhaseModeStrip({
  blocks,
  activeBlockId,
  onSelectBlock,
  athleteCountByPhaseId = {},
  busy = false,
  loading = false,
  onCompletePhase,
  onSkipPhase,
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const phases = useMemo(
    () =>
      (blocks || []).map((block) => {
        const id = String(block.id)
        return {
          id,
          label: phaseLabelForBlock(block),
          count: athleteCountByPhaseId[id] ?? 0,
          isActive: id === String(activeBlockId),
          runtimeStatus: block.runtimeStatus || block.runtime_status || 'pending',
        }
      }),
    [blocks, activeBlockId, athleteCountByPhaseId],
  )

  const activePhase = phases.find((p) => p.isActive) || phases[0]

  if (!blocks?.length) {
    return (
      <div className="phase-mode-strip phase-mode-strip--empty small text-body-secondary py-2">
        {loading ? 'Loading phases…' : 'No phases'}
      </div>
    )
  }

  const handleSelect = (id) => {
    onSelectBlock(id)
    setSheetOpen(false)
  }

  return (
    <nav className="phase-mode-strip" data-testid="phase-mode-strip" aria-label="Training phase">
      <div className="phase-mode-strip__mobile">
        <button
          type="button"
          className="phase-mode-strip__trigger"
          data-testid="phase-mode-strip-mobile-trigger"
          disabled={busy}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
        >
          <span className="phase-mode-strip__trigger-label">
            {activePhase?.label || 'Phase'}
          </span>
          <span className="phase-mode-strip__trigger-meta">
            {activePhase != null ? (
              <span className="phase-mode-strip__trigger-count" aria-hidden>
                · {activePhase.count}
              </span>
            ) : null}
            <span className="phase-mode-strip__trigger-chevron" aria-hidden>
              ▼
            </span>
          </span>
        </button>

        <COffcanvas
          placement="bottom"
          visible={sheetOpen}
          onHide={() => setSheetOpen(false)}
          className="phase-mode-sheet"
        >
          <COffcanvasHeader className="border-bottom">
            <COffcanvasTitle>Phases</COffcanvasTitle>
            <CCloseButton onClick={() => setSheetOpen(false)} />
          </COffcanvasHeader>
          <COffcanvasBody>
            <div
              className="phase-mode-sheet__list"
              role="listbox"
              aria-label="Training phases"
            >
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  type="button"
                  role="option"
                  aria-selected={phase.isActive}
                  className={`phase-mode-sheet__option${phase.isActive ? ' phase-mode-sheet__option--active' : ''}`}
                  data-testid={`phase-mode-sheet-option-${phase.id}`}
                  disabled={busy}
                  onClick={() => handleSelect(phase.id)}
                >
                  <span>{phase.label}</span>
                  <span className="phase-mode-sheet__option-count" aria-hidden>
                    · {phase.count}
                  </span>
                </button>
              ))}
            </div>
          </COffcanvasBody>
        </COffcanvas>
      </div>

      <div className="phase-mode-strip__scroll phase-mode-strip__scroll--desktop" role="list">
        {phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            role="listitem"
            className={`phase-mode-chip${phase.isActive ? ' phase-mode-chip--active' : ''}${statusClass(phase.runtimeStatus)}`}
            data-testid={`phase-mode-chip-${phase.id}`}
            disabled={busy}
            aria-pressed={phase.isActive}
            onClick={() => onSelectBlock(phase.id)}
          >
            <span className="phase-mode-chip__label">{phase.label}</span>
            <span className="phase-mode-chip__count" aria-hidden>
              · {phase.count}
            </span>
          </button>
        ))}
      </div>
      {onCompletePhase || onSkipPhase ? (
        <div className="phase-lifecycle-actions">
          {onCompletePhase ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={busy || !activeBlockId}
              onClick={() => onCompletePhase(activeBlockId)}
            >
              Complete phase
            </button>
          ) : null}
          {onSkipPhase ? (
            <button
              type="button"
              className="btn btn-sm btn-link"
              disabled={busy || !activeBlockId}
              onClick={() => onSkipPhase(activeBlockId)}
            >
              Skip
            </button>
          ) : null}
        </div>
      ) : null}
    </nav>
  )
}
