/**
 * Activity-aware UI copy for Admin. Internal routes/API may still say batch/coach/session.
 *
 * Shared shell (sidebar, Batches toolbar, staff labels) reuses skating labels.
 * Music-only helpers remain for offering attributes and skating-only screens.
 */

import { hasCapability } from '@onrep/contracts'

export function isMusicActivity(activityOrType) {
  const t =
    typeof activityOrType === 'string'
      ? activityOrType
      : activityOrType?.type || activityOrType?.activityType
  return (
    String(t || '')
      .trim()
      .toLowerCase() === 'music'
  )
}

const SHARED_COPY = {
  staff: 'Coach',
  staffPlural: 'Coaches',
  offering: 'Batch',
  offeringPlural: 'Batches',
  lesson: 'Session',
  lessonPlural: 'Sessions',
  createOffering: 'Add batch',
  offeringName: 'Batch name',
  schedule: 'Schedule',
  attendance: 'Attendance',
}

/**
 * @param {'skating'|'music'|string|null|undefined} activityType
 * @param {'private'|'group'|null|undefined} [format]
 */
export function activityCopy(activityType, format = null) {
  void format
  void activityType
  return { ...SHARED_COPY }
}

export function musicSuggestedTraditions() {
  return ['Carnatic']
}

export function musicSuggestedInstruments() {
  return ['Violin', 'Veena']
}

/** True when skating-only UI (specializations, race chrome) should show. */
export function showSkatingSpecializationUi(activityOrType) {
  const t =
    typeof activityOrType === 'string'
      ? activityOrType
      : activityOrType?.type || activityOrType?.activityType
  return hasCapability(t, 'skatingRoutes')
}
