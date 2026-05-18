/** Coaching session mode — canonical values match backend operational_sessions.session_mode. */

export const SESSION_MODE_VALUES = Object.freeze([
  'practice',
  'assessment',
  'competition',
  'recovery',
  'testing',
])

export const SESSION_MODE_OPTIONS = Object.freeze([
  { value: 'practice', label: 'Practice' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'competition', label: 'Competition' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'testing', label: 'Testing' },
])

const LABELS = Object.freeze({
  practice: 'Practice',
  assessment: 'Assessment',
  competition: 'Competition',
  recovery: 'Recovery',
  testing: 'Testing',
})

/** Fixed palette — do not improvise per surface. */
const BADGE_COLORS = Object.freeze({
  practice: 'primary',
  assessment: 'info',
  competition: 'danger',
  recovery: 'success',
  testing: 'dark',
})

/**
 * @param {string|null|undefined} mode
 * @returns {string}
 */
export function normalizeSessionModeValue(mode) {
  const lc = String(mode || 'practice')
    .trim()
    .toLowerCase()
  if (SESSION_MODE_VALUES.includes(lc)) return lc
  return 'practice'
}

/**
 * @param {string|null|undefined} mode
 * @returns {string}
 */
export function sessionModeLabel(mode) {
  const v = normalizeSessionModeValue(mode)
  return LABELS[v] || LABELS.practice
}

/**
 * CoreUI CBadge color token.
 * @param {string|null|undefined} mode
 * @returns {string}
 */
export function sessionModeBadgeColor(mode) {
  const v = normalizeSessionModeValue(mode)
  return BADGE_COLORS[v] || BADGE_COLORS.practice
}
