import React, { useState } from 'react'
import { CButton, CButtonGroup } from '@coreui/react'
import { QUICK_COACHING_CATEGORIES } from '../constants/quickCoachingCategories'
import { MARKER_OPTIONS, tagsForSessionMode } from '../constants/quickCoachingTagsByMode'
import QualitativeObservationStrip from './QualitativeObservationStrip'
import { DEFAULT_RAPID_KPIS } from '../constants/rapidObservationKpis'

/** Formal assessment uses full nine dimensions (student_assessments). */
const FORMAL_ASSESSMENT_KPIS = DEFAULT_RAPID_KPIS

/**
 * Tap-first coaching panel — optimistic local state; parent owns flush queue.
 */
export default function FastCoachingPanel({
  sessionMode = 'practice',
  draft,
  syncState,
  syncError,
  disabled,
  comfortable = false,
  onQuickScore,
  onToggleTag,
  onMarker,
  onNotesChange,
  onManualSync,
  obsScores = {},
  obsFlashKeys,
  onFormalTap,
  formalDisabled,
  formalSaving,
}) {
  const [fullGridOpen, setFullGridOpen] = useState(false)
  const modeTags = tagsForSessionMode(sessionMode)

  return (
    <div className={`fast-coaching-panel${comfortable ? ' fast-coaching-panel--comfortable' : ''}`}>
      <section className="fast-coaching-panel__quick" aria-label="Quick coaching">
        {QUICK_COACHING_CATEGORIES.map(({ key, label }) => (
          <div
            key={key}
            className="fast-coaching-row mb-2 d-flex align-items-center flex-wrap gap-2"
          >
            <span className="small fast-coaching-row__label">{label}</span>
            <CButtonGroup role="group" aria-label={`${label} score`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <CButton
                  key={n}
                  type="button"
                  size="sm"
                  color={draft.scores?.[key] === n ? 'primary' : 'light'}
                  className={
                    draft.scores?.[key] === n ? 'rapid-kpi-chip--active fast-coaching-chip' : 'fast-coaching-chip'
                  }
                  disabled={disabled}
                  onClick={() => onQuickScore(key, n)}
                >
                  {n}
                </CButton>
              ))}
            </CButtonGroup>
          </div>
        ))}
      </section>

      <section className="mb-3" aria-label="Session tags">
        <div className="small text-body-secondary mb-1">Tags ({sessionMode})</div>
        <div className="d-flex flex-wrap gap-2">
          {modeTags.map(({ key, label }) => {
            const on = (draft.tags || []).includes(key)
            return (
              <CButton
                key={key}
                type="button"
                size="sm"
                color={on ? 'primary' : 'light'}
                className="fast-coaching-chip"
                disabled={disabled}
                onClick={() => onToggleTag(key)}
              >
                {label}
              </CButton>
            )
          })}
        </div>
      </section>

      <section className="mb-3 d-flex flex-wrap gap-2" aria-label="Markers">
        {MARKER_OPTIONS.map(({ key, label, short }) => (
          <CButton
            key={key}
            type="button"
            size="sm"
            color="light"
            className="fast-coaching-marker"
            disabled={disabled}
            title={label}
            onClick={() => onMarker(key)}
          >
            <span className="me-1">{short}</span>
            {label}
          </CButton>
        ))}
      </section>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-2 small" aria-live="polite">
        {syncState === 'syncing' ? (
          <span className="skating-sync-pending">Pending sync…</span>
        ) : syncState === 'saved' ? (
          <span className="skating-sync-ok">Saved</span>
        ) : syncState === 'pending' ? (
          <span className="text-body-secondary">On your screen — syncs shortly</span>
        ) : syncState === 'error' ? (
          <span className="text-danger">{syncError}</span>
        ) : null}
        {onManualSync ? (
          <CButton type="button" color="link" size="sm" className="p-0" disabled={disabled} onClick={onManualSync}>
            Sync now
          </CButton>
        ) : null}
      </div>

      <details
        className="small mb-2"
        open={fullGridOpen}
        onToggle={(e) => setFullGridOpen(e.target.open)}
      >
        <summary className="text-body-secondary user-select-none" style={{ cursor: 'pointer' }}>
          All dimensions (formal assessment)
        </summary>
        <p className="text-body-secondary mt-2 mb-2" style={{ fontSize: '0.8rem' }}>
          Saves to assessment history when you complete the grid.
        </p>
        <QualitativeObservationStrip
          obsScores={obsScores}
          obsFlashKeys={obsFlashKeys}
          disabled={formalDisabled}
          onTap={onFormalTap}
          kpis={FORMAL_ASSESSMENT_KPIS}
          comfortable={comfortable}
        />
        {formalSaving ? (
          <span className="small skating-sync-pending d-block mt-1">Saving assessment…</span>
        ) : null}
      </details>

      <input
        type="text"
        className="form-control form-control-sm mt-2"
        placeholder="Short note (optional)"
        value={draft.notes || ''}
        disabled={disabled}
        onChange={(e) => onNotesChange(e.target.value)}
      />
    </div>
  )
}