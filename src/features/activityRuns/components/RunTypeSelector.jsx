import React from 'react'
import filterDefinitionsForActivity from '../utils/filterDefinitionsForActivity'
import { getRunLaunchMeta } from '../utils/runLaunchMeta'

/** Prioritized skating run types shown first in the launcher strip. */
const SKATING_PRIMARY = [
  'HEAT_RACE',
  'TIME_TRIAL',
  'SKILL_RACE',
  'RELAY_RACE',
  'REACTION_TIMING',
  'ELIMINATION_RACE',
  'FLYING_LAP',
  'ENDURANCE_LAPS',
]

function sortForSkating(defs, activitySlug) {
  if (activitySlug !== 'skating') return defs
  const order = new Map(SKATING_PRIMARY.map((t, i) => [t, i]))
  return [...defs].sort((a, b) => {
    const ai = order.has(a.type) ? order.get(a.type) : 99
    const bi = order.has(b.type) ? order.get(b.type) : 99
    return ai - bi
  })
}

export default function RunTypeSelector({
  activitySlug = 'skating',
  disabled,
  compact = false,
  activeType = null,
  onSelect,
}) {
  const defs = sortForSkating(filterDefinitionsForActivity(activitySlug), activitySlug)

  return (
    <div className={`run-type-selector${compact ? ' run-type-selector--compact' : ''}`}>
      {!compact ? (
        <p className="run-type-selector__prompt mb-2">Launch a run</p>
      ) : (
        <p className="run-type-selector__prompt run-type-selector__prompt--compact mb-1">Switch run</p>
      )}
      <div className="run-type-selector__strip" role="listbox" aria-label="Run types">
        {defs.map((d) => {
          const meta = getRunLaunchMeta(d.type)
          const isActive = activeType === d.type
          return (
            <button
              key={d.type}
              type="button"
              role="option"
              aria-selected={isActive}
              className={`run-launch-chip run-launch-chip--${meta.accent}${isActive ? ' run-launch-chip--active' : ''}`}
              disabled={disabled}
              onClick={() => onSelect?.(d.type)}
            >
              <span className="run-launch-chip__emoji" aria-hidden>
                {meta.emoji}
              </span>
              <span className="run-launch-chip__label">{meta.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
