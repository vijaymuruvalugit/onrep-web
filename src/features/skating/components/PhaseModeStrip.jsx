import React, { useEffect, useMemo, useRef, useState } from 'react'
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

function statusSuffix(runtimeStatus) {
  if (runtimeStatus === 'completed') return ' ✓'
  if (runtimeStatus === 'active') return ' ←'
  return ''
}

function statusClass(runtimeStatus, isActive) {
  let c = ''
  if (runtimeStatus === 'completed') c += ' phase-mode-chip--completed'
  if (runtimeStatus === 'skipped') c += ' phase-mode-chip--skipped'
  if (runtimeStatus === 'active' || isActive) c += ' phase-mode-chip--active-phase'
  if (isActive) c += ' phase-mode-chip--current'
  return c
}

/**
 * Phase mode-switch with sequential progress guidance.
 */
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
  const activeChipRef = useRef(null)

  const phases = useMemo(
    () =>
      (blocks || []).map((block) => {
        const id = String(block.id)
        const runtimeStatus = block.runtimeStatus || block.runtime_status || 'pending'
        const isActive = id === String(activeBlockId)
        return {
          id,
          label: phaseLabelForBlock(block),
          displayLabel: `${phaseLabelForBlock(block)}${statusSuffix(isActive ? 'active' : runtimeStatus)}`,
          count: athleteCountByPhaseId[id] ?? 0,
          isActive,
          runtimeStatus,
        }
      }),
    [blocks, activeBlockId, athleteCountByPhaseId],
  )

  const activePhase = phases.find((p) => p.isActive) || phases[0]

  useEffect(() => {
    activeChipRef.current?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeBlockId])

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
            {activePhase?.runtimeStatus === 'completed' ? ' ✓' : activePhase?.isActive ? ' ←' : ''}
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
            <div className="phase-mode-sheet__list" role="listbox" aria-label="Training phases">
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  type="button"
                  role="option"
                  aria-selected={phase.isActive}
                  className={`phase-mode-sheet__option${phase.isActive ? ' phase-mode-sheet__option--active' : ''}${statusClass(phase.runtimeStatus, phase.isActive)}`}
                  data-testid={`phase-mode-sheet-option-${phase.id}`}
                  disabled={busy}
                  onClick={() => handleSelect(phase.id)}
                >
                  <span>{phase.displayLabel}</span>
                  <span className="phase-mode-sheet__option-count" aria-hidden>
                    · {phase.count}
                  </span>
                </button>
              ))}
            </div>
          </COffcanvasBody>
        </COffcanvas>
      </div>

      <div
        className="phase-mode-strip__scroll phase-mode-strip__scroll--desktop phase-mode-strip__sequence"
        role="list"
      >
        {phases.map((phase, index) => (
          <React.Fragment key={phase.id}>
            {index > 0 ? <span className="phase-mode-strip__connector" aria-hidden /> : null}
            <button
              type="button"
              role="listitem"
              ref={phase.isActive ? activeChipRef : undefined}
              className={`phase-mode-chip${phase.isActive ? ' phase-mode-chip--active' : ''}${statusClass(phase.runtimeStatus, phase.isActive)}`}
              data-testid={`phase-mode-chip-${phase.id}`}
              disabled={busy}
              aria-pressed={phase.isActive}
              aria-current={phase.isActive ? 'step' : undefined}
              onClick={() => onSelectBlock(phase.id)}
            >
              <span className="phase-mode-chip__label">{phase.displayLabel}</span>
              <span className="phase-mode-chip__count" aria-hidden>
                · {phase.count}
              </span>
            </button>
          </React.Fragment>
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
