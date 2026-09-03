/**
 * Map backend schedule/session API errors to coach-friendly copy.
 * @param {unknown} error axios error or string
 * @returns {string}
 */
export function friendlyScheduleApiMessage(error) {
  const raw =
    typeof error === 'string'
      ? error
      : error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        ''
  const msg = String(raw || '').trim()
  if (!msg) return 'Something went wrong. Please try again.'

  const lower = msg.toLowerCase()
  const looksLikeSql =
    lower.includes('does not exist') ||
    lower.includes('syntax error') ||
    lower.includes('undefined column') ||
    /\bcolumn\s+\S+/.test(lower) ||
    /\brelation\s+\S+/.test(lower)
  if (looksLikeSql) {
    return 'Could not load this schedule. Check your connection and tap Refresh.'
  }
  if (
    lower.includes('x-activity-id') ||
    lower.includes('activity context') ||
    lower.includes('activity_context')
  ) {
    return 'Could not preview this schedule. Switch program in the header and try again.'
  }
  if (lower.includes('max') && lower.includes('days') && lower.includes('materialize')) {
    return 'We could not refresh this batch’s calendar. Tap Refresh to try again.'
  }
  if (lower.includes('add active students')) {
    return 'Add students to this batch first. Sessions are created automatically once someone is enrolled.'
  }
  if (lower.includes('no active schedules') || lower.includes('no active patterns')) {
    return 'Add a weekly pattern above, or check that its start date is not still in the future.'
  }
  if (lower.includes('overlap') || lower.includes('conflict')) {
    return 'Two sessions overlap at the same time. Edit a pattern or remove the conflicting session, then refresh.'
  }
  if (lower.includes('invalid date')) {
    return 'Could not read the date range. Tap Refresh to try again.'
  }
  if (lower.includes('failed to materialize') || lower.includes('failed to generate') || lower.includes('failed to preview')) {
    return 'We could not update sessions from your weekly patterns. Tap Refresh to try again.'
  }
  if (lower.includes('unable to load') || lower.includes('failed to load')) {
    return 'Could not load this schedule. Check your connection and tap Refresh.'
  }

  return msg
}
