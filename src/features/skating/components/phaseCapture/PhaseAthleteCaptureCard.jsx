import React, { useMemo } from 'react'
import PhaseCaptureRenderer from './PhaseCaptureRenderer'
import { entryValueForField, inlineCaptureItemsForCard } from '../../utils/phaseCaptureDisplay'

/**
 * Fixed-height horizontal athlete row for rink-side capture.
 */
export default function PhaseAthleteCaptureCard({
  athlete,
  captureItems = [],
  entries = [],
  captureMode = 'full',
  coachDefaults = {},
  activePhase,
  disabled = false,
  reviewOnly = false,
  onValueChange,
  onOpenDetail,
}) {
  const athleteId = String(athlete?.id ?? athlete?.studentId ?? '')
  const name =
    athlete?.full_name ||
    athlete?.fullName ||
    [athlete?.first_name, athlete?.last_name].filter(Boolean).join(' ') ||
    'Athlete'

  const inlineItems = useMemo(
    () =>
      inlineCaptureItemsForCard(captureItems, {
        captureMode,
        coachDefaults,
        activePhase,
      }),
    [captureItems, captureMode, coachDefaults, activePhase]
  )

  const tagItem = inlineItems.find((it) => it.fieldType === 'tags')
  const ratingItem = inlineItems.find((it) => it.fieldType === 'rating')

  const handleChange = (item, valueJson) => {
    if (reviewOnly || disabled) return
    onValueChange?.(athleteId, item.id, valueJson)
  }

  return (
    <div
      className={`phase-athlete-card${captureMode === 'fast' ? ' phase-athlete-card--fast' : ''}${reviewOnly ? ' phase-athlete-card--review' : ''}`}
      data-testid={`phase-athlete-card-${athleteId}`}
    >
      <button
        type="button"
        className="phase-athlete-card__name"
        onClick={() => onOpenDetail?.(athleteId)}
      >
        {name.split(' ')[0]}
      </button>
      <div className="phase-athlete-card__capture">
        {tagItem ? (
          <PhaseCaptureRenderer
            item={tagItem}
            compact
            disabled={disabled || reviewOnly}
            valueJson={entryValueForField(entries, athleteId, tagItem.id)}
            onChange={(v) => handleChange(tagItem, v)}
          />
        ) : null}
        {captureMode !== 'fast' && ratingItem ? (
          <PhaseCaptureRenderer
            item={ratingItem}
            compact
            disabled={disabled || reviewOnly}
            valueJson={entryValueForField(entries, athleteId, ratingItem.id)}
            onChange={(v) => handleChange(ratingItem, v)}
          />
        ) : null}
      </div>
      <button
        type="button"
        className="phase-athlete-card__more"
        aria-label={`More for ${name}`}
        onClick={() => onOpenDetail?.(athleteId)}
      >
        ···
      </button>
    </div>
  )
}
