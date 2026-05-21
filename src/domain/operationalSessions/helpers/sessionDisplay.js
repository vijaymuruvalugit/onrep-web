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
 * @param {string|null|undefined} value
 */
function formatSurfaceType(value) {
  if (!value) return null
  const s = String(value).trim()
  if (!s) return null
  if (s.length <= 4 && s === s.toUpperCase()) {
    return s.charAt(0) + s.slice(1).toLowerCase()
  }
  return s
}

/**
 * Compact context line: specialization • surface • session mode.
 * @param {import('../types').OperationalSession} session
 */
export function sessionOperationalContextLine(session) {
  if (!session) return null
  const parts = []
  const spec =
    session.academySubActivityName?.trim() ||
    session.academy_sub_activity_name?.trim() ||
    null
  if (spec) parts.push(spec)
  const surfaceRaw =
    session.surfaceProfile?.type ?? session.surface_profile?.type ?? null
  const surface = formatSurfaceType(surfaceRaw)
  if (surface) parts.push(surface)
  const mode = session.sessionMode ?? session.session_mode
  if (mode) {
    const label = String(mode)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    parts.push(label)
  }
  return parts.length ? parts.join(' • ') : null
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
