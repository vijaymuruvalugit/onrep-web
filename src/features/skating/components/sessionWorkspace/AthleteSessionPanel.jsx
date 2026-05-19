import React, { useState } from 'react'
import PhaseCaptureRenderer from '../phaseCapture/PhaseCaptureRenderer'
import { deepLayerItems, entryValueForField, uiRoleLabel } from '../../utils/phaseCaptureDisplay'
import './AthleteSessionPanel.css'

const TABS = [
  { id: 'timing', label: 'Timing' },
  { id: 'notes', label: 'Notes' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'history', label: 'History' },
  { id: 'progress', label: 'Progress' },
]

/**
 * Deep athlete context panel — timing, notes, secondary observations.
 */
export default function AthleteSessionPanel({
  athlete,
  captureItems = [],
  entries = [],
  activeTab = 'timing',
  onTabChange,
  disabled = false,
  timingSection,
  focusText = '',
  onChangeFocus,
  onSaveFocus,
  focusSaving = false,
  focusSaveMessage = '',
  onValueChange,
}) {
  const [internalTab, setInternalTab] = useState('timing')
  const tab = activeTab || internalTab
  const setTab = onTabChange || setInternalTab

  if (!athlete) return null

  const athleteId = String(athlete.id)
  const name = athlete.full_name || athlete.fullName || 'Athlete'
  const deepItems = deepLayerItems(captureItems)
  const noteItems = (captureItems || []).filter((it) => it.fieldType === 'note')

  const handleTab = (id) => {
    setTab(id)
  }

  return (
    <section className="athlete-session-panel" data-testid="athlete-session-panel">
      <header className="athlete-session-panel__header">
        <h3 className="athlete-session-panel__title mb-0">{name}</h3>
        <p className="small text-body-secondary mb-0">Athlete context for this session</p>
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
              placeholder="Focus for this athlete today…"
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
              deepItems.map((item) => (
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
