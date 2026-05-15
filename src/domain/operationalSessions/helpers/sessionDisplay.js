/**
 * @param {string|null|undefined} iso
 */
function formatClock(iso, timeZone) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      ...(timeZone ? { timeZone } : {}),
    })
  } catch {
    return null
  }
}

/**
 * @param {import('../types').OperationalSession} session
 */
export function sessionDisplayTitle(session) {
  if (!session) return 'Session'
  const title = session.title?.trim()
  if (title) return title
  if (session.batchName?.trim()) return session.batchName.trim()
  if (session.placeName?.trim()) return session.placeName.trim()
  return 'Skating session'
}

/**
 * @param {import('../types').OperationalSession} session
 */
export function sessionTimeRangeLabel(session) {
  if (!session) return '—'
  if (session.startTime) {
    const st = String(session.startTime).slice(0, 5)
    const et = session.endTime ? String(session.endTime).slice(0, 5) : null
    return et ? `${st} – ${et}` : st
  }
  const startIso = session.actualStartAt || session.scheduledStartAt
  const endIso = session.actualEndAt || session.scheduledEndAt
  const tz = session.timezone || undefined
  const start = formatClock(startIso, tz)
  const end = formatClock(endIso, tz)
  if (start && end) return `${start} – ${end}`
  if (start) return start
  return '—'
}

/**
 * @param {import('../types').OperationalSession} session
 * @returns {'recurring'|'one-off'|'ad-hoc'}
 */
export function sessionTypeLabel(session) {
  const kind = String(session?.sessionKind || '').toLowerCase()
  const source = String(session?.sourceType || '').toLowerCase()
  if (source === 'ad_hoc') return 'ad-hoc'
  if (kind === 'one_off') return 'one-off'
  if (kind === 'recurring' || source === 'schedule') return 'recurring'
  return 'one-off'
}

/**
 * @param {'recurring'|'one-off'|'ad-hoc'} type
 */
export function sessionTypeBadgeColor(type) {
  if (type === 'recurring') return 'info'
  if (type === 'ad-hoc') return 'warning'
  return 'secondary'
}
