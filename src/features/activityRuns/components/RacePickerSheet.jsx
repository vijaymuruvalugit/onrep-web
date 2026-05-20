import React from 'react'
import { CUSTOM_PRESET } from '../../skating/race/racePresets'

function RaceCard({ title, subtitle, disabled, onClick, compact = false, variant = 'preset' }) {
  const isCustom = variant === 'custom'
  return (
    <button
      type="button"
      className={`race-picker-card race-picker-card--${variant}${
        compact ? ' race-picker-card--compact' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="race-picker-card__content">
        <span className="race-picker-card__title">{title}</span>
        {subtitle ? <span className="race-picker-card__subtitle">{subtitle}</span> : null}
      </span>
      {!compact && !isCustom ? (
        <span className="race-picker-card__action" aria-hidden>
          →
        </span>
      ) : null}
    </button>
  )
}

export default function RacePickerSheet({
  presets = [],
  recentRaces = [],
  disabled,
  onSelectPreset,
  onSelectCustom,
}) {
  return (
    <div className="race-picker-sheet" data-testid="race-picker-sheet">
      <div className="race-picker-sheet__list">
        {presets.map((preset) => (
          <RaceCard
            key={preset.id}
            title={preset.title}
            subtitle={preset.subtitle}
            disabled={disabled}
            variant="preset"
            onClick={() => onSelectPreset?.(preset)}
          />
        ))}
        <RaceCard
          title={CUSTOM_PRESET.title}
          subtitle={CUSTOM_PRESET.subtitle}
          disabled={disabled}
          variant="custom"
          onClick={() => onSelectCustom?.()}
        />
      </div>
      {recentRaces.length > 0 ? (
        <div className="race-picker-sheet__recent">
          <p className="race-picker-sheet__recent-label">Recent</p>
          <div className="race-picker-sheet__list">
            {recentRaces.map((entry) => (
              <RaceCard
                key={`${entry.presetId}-${entry.recordedAt}`}
                title={entry.title}
                subtitle={entry.subtitle}
                compact
                disabled={disabled}
                onClick={() => onSelectPreset?.(entry.preset)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
