import React from 'react'
import PhaseObservationTags from './PhaseObservationTags'
import PhaseCompactRating from './PhaseCompactRating'
import PhaseObservationNote from './PhaseObservationNote'
import PhaseMetricCounter from './PhaseMetricCounter'
import PhaseCheckpointToggle from './PhaseCheckpointToggle'

/**
 * Renders one capture item control.
 */
export default function PhaseCaptureRenderer({
  item,
  valueJson,
  disabled = false,
  compact = false,
  onChange,
}) {
  if (!item) return null
  const cfg = item.configurationJson || {}

  if (item.fieldType === 'tags') {
    const selected = Array.isArray(valueJson?.values) ? valueJson.values : []
    return (
      <PhaseObservationTags
        options={cfg.options || []}
        selected={selected}
        disabled={disabled}
        compact={compact}
        onToggle={(tag, on) => {
          const set = new Set(selected.map(String))
          if (on) set.add(String(tag))
          else set.delete(String(tag))
          onChange?.({ values: [...set] })
        }}
      />
    )
  }

  if (item.fieldType === 'rating') {
    return (
      <PhaseCompactRating
        value={valueJson?.value}
        scale={cfg.scale || 5}
        disabled={disabled}
        onChange={(v) => onChange?.({ value: v })}
      />
    )
  }

  if (item.fieldType === 'note') {
    return (
      <PhaseObservationNote
        value={valueJson?.text || ''}
        disabled={disabled}
        onChange={(text) => onChange?.({ text })}
      />
    )
  }

  if (item.fieldType === 'counter') {
    return (
      <PhaseMetricCounter
        value={valueJson?.value ?? 0}
        min={cfg.min ?? 0}
        max={cfg.max ?? 999}
        disabled={disabled}
        onChange={(v) => onChange?.({ value: v })}
      />
    )
  }

  if (item.fieldType === 'boolean') {
    return (
      <PhaseCheckpointToggle
        label={item.label}
        checked={Boolean(valueJson?.value)}
        disabled={disabled}
        onChange={(v) => onChange?.({ value: v })}
      />
    )
  }

  return null
}
