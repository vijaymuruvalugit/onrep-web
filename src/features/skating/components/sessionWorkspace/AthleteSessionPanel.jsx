import React, { useMemo, useState } from 'react'
import { CFormInput } from '@coreui/react'
import PhaseCaptureRenderer from '../phaseCapture/PhaseCaptureRenderer'
import PhaseSemanticRating from '../phaseCapture/PhaseSemanticRating'
import {
  deepLayerItems,
  entryValueForField,
  quickLayerItems,
  uiRoleLabel,
} from '../../utils/phaseCaptureDisplay'
import '../phaseCapture/phaseCapture.css'
import './AthleteSessionPanel.css'

const TABS = [
  { id: 'observe', label: 'Observe' },
  { id: 'timing', label: 'Timing' },
  { id: 'notes', label: 'Notes' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'history', label: 'History' },
  { id: 'progress', label: 'Progress' },
]

/**
 * Student context panel — quick observations, timing, notes, advanced fields.
 */
export default function AthleteSessionPanel({
  athlete,
  captureItems = [],
  entries = [],
  captureMode = 'full',
  activeTab = 'observe',
  onTabChange,
  disabled = false,
  reviewOnly = false,
  participationStatus,
  timingSection,
  focusText = '',
  onChangeFocus,
  onSaveFocus,
  focusSaving = false,
  focusSaveMessage = '',
  onValueChange,
}) {
  const [internalTab, setInternalTab] = useState('observe')
  const tab = activeTab || internalTab
  const setTab = onTabChange || setInternalTab
  const quickItems = useMemo(() => quickLayerItems(captureItems), [captureItems])
  const tagItem = quickItems.find((it) => it.fieldType === 'tags')
  const ratingItem = quickItems.find((it) => it.fieldType === 'rating')
  const quickNoteItem = quickItems.find((it) => it.fieldType === 'note')

  if (!athlete) return null

  const athleteId = String(athlete.id)
  const name = athlete.full_name || athlete.fullName || 'Student'
  const deepItems = deepLayerItems(captureItems)
  const noteItems = deepItems.filter((it) => it.fieldType === 'note')

  const showInactive =
    participationStatus && participationStatus !== 'active' && participationStatus !== 'on_ice'

  const handleTab = (id) => {
    setTab(id)
  }

  const handleQuickChange = (item, valueJson) => {
    if (reviewOnly || disabled) return
    onValueChange?.(athleteId, item.id, valueJson)
  }

  return (
    <section className="athlete-session-panel" data-testid="athlete-session-panel">
      <header className="athlete-session-panel__header">
        <h3 className="athlete-session-panel__title mb-0">
          {showInactive ? <span className="athlete-session-panel__status-dot" aria-hidden /> : null}
          {name}
        </h3>
        <p className="small text-body-secondary mb-0">Student context for this session</p>
      </header>

      <div className="athlete-session-panel__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`athlete-session-panel__tab${tab === t.id ? ' athlete-session-panel__tab--active' : ''}`}
            onClick={() => handleTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="athlete-session-panel__body">
        {tab === 'observe' ? (
          <div className="athlete-session-panel__pane athlete-session-panel__observe">
            {tagItem ? (
              <PhaseCaptureRenderer
                item={tagItem}
                compact
                disabled={disabled || reviewOnly}
                valueJson={entryValueForField(entries, athleteId, tagItem.id)}
                onChange={(v) => handleQuickChange(tagItem, v)}
              />
            ) : null}
            {captureMode !== 'fast' && ratingItem ? (
              <PhaseSemanticRating
                label={ratingItem.label}
                value={entryValueForField(entries, athleteId, ratingItem.id)?.value}
                scale={ratingItem.configurationJson?.scale || 5}
                compact
                disabled={disabled || reviewOnly}
                onChange={(v) => handleQuickChange(ratingItem, { value: v })}
              />
            ) : null}
            {quickNoteItem ? (
              <CFormInput
                className="phase-quick-note"
                size="sm"
                disabled={disabled || reviewOnly}
                placeholder="Quick note…"
                value={entryValueForField(entries, athleteId, quickNoteItem.id)?.text || ''}
                onChange={(e) => handleQuickChange(quickNoteItem, { text: e.target.value })}
              />
            ) : null}
            {!tagItem && !ratingItem && !quickNoteItem ? (
              <p className="small text-body-secondary mb-0">No quick observations for this phase.</p>
            ) : null}
          </div>
        ) : null}

        {tab === 'timing' ? (
          <div className="athlete-session-panel__pane">
            {timingSection || (
              <p className="small text-body-secondary mb-0">No timing tools for this phase.</p>
            )}
          </div>
        ) : null}

        {tab === 'notes' ? (
          <div className="athlete-session-panel__pane">
            <label className="form-label small">Session focus</label>
            <textarea
              className="form-control form-control-sm mb-2"
              rows={2}
              disabled={disabled}
              value={focusText}
              placeholder="Focus for this student today…"
              onChange={(e) => onChangeFocus?.(e.target.value)}
            />
            {onSaveFocus ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary mb-3"
                disabled={disabled || focusSaving}
                onClick={onSaveFocus}
              >
                {focusSaving ? 'Saving…' : 'Save focus'}
              </button>
            ) : null}
            {focusSaveMessage ? (
              <p className="small text-success mb-2">{focusSaveMessage}</p>
            ) : null}
            {noteItems.map((item) => (
              <div key={item.id} className="mb-3">
                <label className="form-label small">{item.label}</label>
                <PhaseCaptureRenderer
                  item={item}
                  disabled={disabled}
                  valueJson={entryValueForField(entries, athleteId, item.id)}
                  onChange={(v) => onValueChange?.(athleteId, item.id, v)}
                />
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'advanced' ? (
          <div className="athlete-session-panel__pane">
            {deepItems.length === 0 ? (
              <p className="small text-body-secondary mb-0">No advanced observations for this phase.</p>
            ) : (
              deepItems.filter((item) => item.fieldType !== 'note').map((item) => (
                <div key={item.id} className="athlete-session-panel__field mb-3">
                  <div className="small text-body-secondary mb-1">
                    {uiRoleLabel(item.configurationJson?.uiRole)} · {item.label}
                  </div>
                  <PhaseCaptureRenderer
                    item={item}
                    disabled={disabled}
                    valueJson={entryValueForField(entries, athleteId, item.id)}
                    onChange={(v) => onValueChange?.(athleteId, item.id, v)}
                  />
                </div>
              ))
            )}
          </div>
        ) : null}

        {tab === 'history' || tab === 'progress' ? (
          <p className="small text-body-secondary mb-0 athlete-session-panel__placeholder">
            Coming soon
          </p>
        ) : null}
      </div>
    </section>
  )
}
