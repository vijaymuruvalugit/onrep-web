import React from 'react'
import { CButton } from '@coreui/react'
import { QUICK_COACHING_CATEGORIES, quickCategoryLiveLabel } from '../constants/quickCoachingCategories'
import { MARKER_OPTIONS, tagsForSessionMode } from '../constants/quickCoachingTagsByMode'
import QualitativeObservationStrip from './QualitativeObservationStrip'
import { DEFAULT_RAPID_KPIS } from '../constants/rapidObservationKpis'
import { liveLabel } from '../constants/coachLiveLabels'

const FORMAL_SCORE_DIMENSIONS = DEFAULT_RAPID_KPIS

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
  liveMode = false,
  uiProfile,
  onQuickScore,
  onToggleTag,
  onMarker,
  markerPulse = null,
  onNotesChange,
  onManualSync,
  obsScores = {},
  obsFlashKeys,
  onFormalTap,
  formalDisabled,
  formalSaving,
}) {
  const profile = uiProfile || {
    showQuickScores: true,
    showFormalScoreGrid: false,
    showModeTags: true,
    formalScoreExpanded: false,
    emphasizeRecover: false,
  }
  const modeTags = tagsForSessionMode(sessionMode)

  return (
    <div
      className={`fast-coaching-panel${comfortable ? ' fast-coaching-panel--comfortable' : ''}${
        liveMode ? ' fast-coaching-panel--live' : ''
      }`}
    >
      {profile.showQuickScores !== false ? (
        <section className="fast-coaching-panel__quick" aria-label="Coach now">
          {QUICK_COACHING_CATEGORIES.map(({ key }) => {
            const label = quickCategoryLiveLabel(key)
            const emphasized = profile.emphasizeRecover && key === 'recovery'
            return (
              <div
                key={key}
                className={`fast-coaching-row mb-3 d-flex align-items-stretch gap-2${
                  emphasized ? ' fast-coaching-row--emphasis' : ''
                }`}
              >
                <span className="fast-coaching-row__label">{label}</span>
                <div className="fast-coaching-scores flex-grow-1" role="group" aria-label={`${label} score`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <CButton
                      key={n}
                      type="button"
                      color={draft.scores?.[key] === n ? 'primary' : 'light'}
                      className={`fast-coaching-score-chip${
                        draft.scores?.[key] === n
                          ? ' fast-coaching-score-chip--active rapid-kpi-chip--active'
                          : ''
                      }`}
                      disabled={disabled}
                      onClick={() => onQuickScore(key, n)}
                    >
                      {n}
                    </CButton>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      ) : null}

      {profile.showModeTags !== false ? (
        <section className="mb-3" aria-label="Tags">
          <div className="d-flex flex-wrap gap-2">
            {modeTags.map(({ key, label }) => {
              const on = (draft.tags || []).includes(key)
              return (
                <CButton
                  key={key}
                  type="button"
                  color={on ? 'primary' : 'light'}
                  className={`fast-coaching-tag${on ? ' fast-coaching-tag--on' : ''}`}
                  disabled={disabled}
                  onClick={() => onToggleTag(key)}
                >
                  {label}
                </CButton>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="mb-2" aria-label="Markers">
        <div className="d-flex flex-wrap gap-2">
          {MARKER_OPTIONS.map(({ key, label, short }) => {
            const active = markerPulse === key
            return (
              <CButton
                key={key}
                type="button"
                color={active ? 'primary' : 'light'}
                className={`fast-coaching-marker${active ? ' fast-coaching-marker--active' : ''}`}
                disabled={disabled || !onMarker}
                title={label}
                onClick={() => onMarker?.(key)}
              >
                <span aria-hidden>{short}</span>
                <span className="ms-1">{label}</span>
              </CButton>
            )
          })}
        </div>
      </section>

      {!liveMode ? (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2 small" aria-live="polite">
          {syncState === 'syncing' ? (
            <span className="skating-sync-pending">Pending sync…</span>
          ) : syncState === 'saved' ? (
            <span className="skating-sync-ok">Saved</span>
          ) : syncState === 'pending' ? (
            <span className="text-body-secondary">On screen — syncs shortly</span>
          ) : syncState === 'error' ? (
            <span className="text-danger">{syncError}</span>
          ) : null}
          {onManualSync ? (
            <CButton
              type="button"
              color="link"
              size="sm"
              className="p-0"
              disabled={disabled}
              onClick={onManualSync}
            >
              Sync now
            </CButton>
          ) : null}
        </div>
      ) : (
        <div className="fast-coaching-sync small mb-2" aria-live="polite">
          {syncState === 'syncing' || syncState === 'pending' ? (
            <span className="skating-sync-pending">{liveLabel('syncing')}…</span>
          ) : syncState === 'saved' ? (
            <span className="skating-sync-ok">{liveLabel('saved')}</span>
          ) : syncState === 'error' ? (
            <span className="text-danger">{syncError}</span>
          ) : null}
        </div>
      )}

      {profile.showFormalScoreGrid ? (
        <section className="fast-coaching-formal mb-2" aria-label={liveLabel('score')}>
          {!liveMode ? (
            <details open={profile.formalScoreExpanded}>
              <summary className="text-body-secondary user-select-none small" style={{ cursor: 'pointer' }}>
                {liveLabel('score')} (full)
              </summary>
              <QualitativeObservationStrip
                obsScores={obsScores}
                obsFlashKeys={obsFlashKeys}
                disabled={formalDisabled}
                onTap={onFormalTap}
                kpis={FORMAL_SCORE_DIMENSIONS}
                comfortable={comfortable}
              />
            </details>
          ) : (
            <details className="fast-coaching-formal__details" open={profile.formalScoreExpanded}>
              <summary className="small fw-semibold text-body-secondary user-select-none mb-2">
                {liveLabel('score')}
              </summary>
              <QualitativeObservationStrip
                obsScores={obsScores}
                obsFlashKeys={obsFlashKeys}
                disabled={formalDisabled}
                onTap={onFormalTap}
                kpis={FORMAL_SCORE_DIMENSIONS}
                comfortable={comfortable}
              />
            </details>
          )}
          {formalSaving ? (
            <span className="small skating-sync-pending d-block mt-1">Saving…</span>
          ) : null}
        </section>
      ) : !liveMode ? (
        <details className="small mb-2">
          <summary className="text-body-secondary user-select-none" style={{ cursor: 'pointer' }}>
            {liveLabel('score')} (optional)
          </summary>
          <QualitativeObservationStrip
            obsScores={obsScores}
            obsFlashKeys={obsFlashKeys}
            disabled={formalDisabled}
            onTap={onFormalTap}
            kpis={FORMAL_SCORE_DIMENSIONS}
            comfortable={comfortable}
          />
        </details>
      ) : null}

      <input
        type="text"
        className="form-control form-control-sm mt-2"
        placeholder={liveMode ? liveLabel('note') : 'Short note (optional)'}
        value={draft.notes || ''}
        disabled={disabled}
        onChange={(e) => onNotesChange(e.target.value)}
      />
    </div>
  )
}
