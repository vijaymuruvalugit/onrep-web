import React, { useMemo } from 'react'
import { CFormInput } from '@coreui/react'
import ObservationSummary from './ObservationSummary'
import PhaseCaptureRenderer from './PhaseCaptureRenderer'
import PhaseSemanticRating from './PhaseSemanticRating'
import {
  buildObservationSummary,
  entryValueForField,
  quickLayerItems,
} from '../../utils/phaseCaptureDisplay'

/**
 * Quick-layer athlete card — collapsed summary; expanded tags + rating + quick note only.
 */
export default function ExpandableAthleteCard({
  athlete,
  captureItems = [],
  entries = [],
  captureMode = 'full',
  expanded = false,
  selected = false,
  participationStatus,
  disabled = false,
  reviewOnly = false,
  onSelectAthlete,
  onToggleExpand,
  onValueChange,
}) {
  const athleteId = String(athlete?.id ?? athlete?.studentId ?? '')
  const name =
    athlete?.full_name ||
    athlete?.fullName ||
    [athlete?.first_name, athlete?.last_name].filter(Boolean).join(' ') ||
    'Athlete'
  const firstName = name.split(' ')[0]

  const quickItems = useMemo(() => quickLayerItems(captureItems), [captureItems])
  const tagItem = quickItems.find((it) => it.fieldType === 'tags')
  const ratingItem = quickItems.find((it) => it.fieldType === 'rating')
  const noteItem = quickItems.find((it) => it.fieldType === 'note')

  const summary = useMemo(
    () => buildObservationSummary(entries, athleteId, captureItems),
    [entries, athleteId, captureItems]
  )

  const handleChange = (item, valueJson) => {
    if (reviewOnly || disabled) return
    onValueChange?.(athleteId, item.id, valueJson)
  }

  const showInactive =
    participationStatus && participationStatus !== 'active' && participationStatus !== 'on_ice'

  return (
    <article
      className={`expandable-athlete-card${expanded ? ' expandable-athlete-card--expanded' : ''}${selected ? ' expandable-athlete-card--selected' : ''}${captureMode === 'fast' ? ' expandable-athlete-card--fast' : ''}${reviewOnly ? ' expandable-athlete-card--review' : ''}`}
      data-testid={`expandable-athlete-card-${athleteId}`}
    >
      <div className="expandable-athlete-card__header">
        <button
          type="button"
          className="expandable-athlete-card__name"
          onClick={() => onSelectAthlete?.(athleteId)}
          aria-pressed={selected}
        >
          {showInactive ? <span className="expandable-athlete-card__status-dot" aria-hidden /> : null}
          {firstName}
        </button>
        {!expanded ? (
          <>
            <ObservationSummary text={summary} className="expandable-athlete-card__summary" />
            <button
              type="button"
              className="btn btn-sm btn-outline-primary expandable-athlete-card__observe"
              disabled={disabled || reviewOnly}
              onClick={() => onToggleExpand?.(athleteId)}
            >
              + Observe
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-link expandable-athlete-card__collapse"
            onClick={() => onToggleExpand?.(null)}
          >
            Collapse
          </button>
        )}
      </div>

      {expanded ? (
        <div className="expandable-athlete-card__quick">
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
            <PhaseSemanticRating
              label={ratingItem.label}
              value={entryValueForField(entries, athleteId, ratingItem.id)?.value}
              scale={ratingItem.configurationJson?.scale || 5}
              compact
              disabled={disabled || reviewOnly}
              onChange={(v) => handleChange(ratingItem, { value: v })}
            />
          ) : null}
          {noteItem ? (
            <CFormInput
              className="phase-quick-note"
              size="sm"
              disabled={disabled || reviewOnly}
              placeholder="Quick note…"
              value={entryValueForField(entries, athleteId, noteItem.id)?.text || ''}
              onChange={(e) => handleChange(noteItem, { text: e.target.value })}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
