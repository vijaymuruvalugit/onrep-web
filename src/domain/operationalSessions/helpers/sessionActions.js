/**
 * @param {{ state?: string|null, operationalState?: string|null, isCancelled?: boolean, status?: string|null }} session
 */
export function isOperationalSessionCancelled(session) {
  if (!session) return false
  if (session.isCancelled === true) return true
  const op = String(session.state ?? session.operationalState ?? '').toLowerCase()
  if (op === 'cancelled') return true
  return String(session.status || '').toUpperCase() === 'CANCELLED'
}

/**
 * @param {import('../types').OperationalSession} session
 * @returns {'start'|'resume'|'view'}
 */
export function primaryActionForSession(session) {
  if (isOperationalSessionCancelled(session)) return 'view'
  const s = String(session?.state || '').toLowerCase()
  if (s === 'active') return 'view'
  if (s === 'paused') return 'resume'
  if (s === 'completed' || s === 'archived') return 'view'
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
