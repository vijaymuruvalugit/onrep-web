import React from 'react'
import PhaseCaptureRenderer from '../phaseCapture/PhaseCaptureRenderer'
import './phaseInteraction.css'

/**
 * Lightweight group/session observations (not per-athlete).
 */
export default function SessionObservationStrip({
  defs = [],
  valuesByKey = {},
  disabled = false,
  onChange,
}) {
  if (!defs.length) return null

  return (
    <div className="phase-session-obs" data-testid="phase-session-observation-strip">
      <p className="phase-session-obs__label small text-body-secondary mb-2">Group notes</p>
      <div className="phase-session-obs__fields">
        {defs.map((def) => {
          const key = def.observationKey
          const valueJson = valuesByKey[key] || {}
          return (
            <div key={key} className="phase-session-obs__field">
              <span className="phase-session-obs__field-label small">{def.label}</span>
              <PhaseCaptureRenderer
                item={{
                  id: key,
                  fieldType: def.fieldType,
                  label: def.label,
                  configurationJson: def.configurationJson || {},
                }}
                valueJson={valueJson}
                disabled={disabled}
                compact
                onChange={(next) => onChange?.(key, next)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
