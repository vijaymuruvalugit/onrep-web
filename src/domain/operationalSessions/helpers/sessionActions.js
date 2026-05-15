/**
 * @param {import('../types').OperationalSession} session
 * @returns {'start'|'resume'|'view'}
 */
export function primaryActionForSession(session) {
  const s = String(session?.state || '').toLowerCase()
  if (s === 'active') return 'view'
  if (s === 'paused') return 'resume'
  if (s === 'completed' || s === 'archived' || s === 'cancelled') return 'view'
  return 'start'
}

/** @param {'start'|'resume'|'view'} action */
export function primaryActionLabel(action) {
  if (action === 'start') return 'Start session'
  if (action === 'resume') return 'Resume session'
  return 'View session'
}

/**
 * @param {import('../types').OperationalSession} session
 */
export function isLiveSession(session) {
  const s = String(session?.state || '').toLowerCase()
  return s === 'active' || s === 'paused'
}
