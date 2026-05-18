/**
 * Shared presentation helpers for training session rows (lists, attendance, dashboard).
 */

/** Extract YYYY-MM-DD from API values (plain date or ISO datetime). */
export function normalizeSessionDateYmd(value) {
  if (value == null || value === '') return ''
  const m = String(value).match(/(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

/** @param {string|null|undefined} time */
export function formatSessionClock(time) {
  if (time == null || time === '') return '—'
  const s = String(time)
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return s.slice(0, 8)
  const h = m[1]
  const min = m[2]
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${min} ${ampm}`
}

/**
 * @param {string|null|undefined} isoDate YYYY-MM-DD
 * @param {{ weekday?: 'long'|'short', month?: 'long'|'short' }} opts
 */
export function formatSessionCalendarDate(isoDate, opts = {}) {
  if (!isoDate) return '—'
  const ymd = normalizeSessionDateYmd(isoDate)
  const d = parseSessionLocalDate(ymd || isoDate)
  if (!d) return ymd || String(isoDate).slice(0, 10) || '—'
  return new Intl.DateTimeFormat(undefined, {
    weekday: opts.weekday ?? 'long',
    month: opts.month ?? 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

/**
 * Near-term timeline label: Today / Tomorrow / short weekday + date.
 * @param {string|null|undefined} isoDate YYYY-MM-DD
 * @param {string} todayIso YYYY-MM-DD local
 */
/**
 * Calendar stamp for non-relative display: "Mon 11 May" (locale-aware).
 * @param {string} ymd YYYY-MM-DD
 */
export function formatDayStampShort(ymd) {
  const d = parseSessionLocalDate(ymd)
  if (!d) return ymd || '—'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d)
}

/**
 * Operational day label: Today / Tomorrow / Mon 11 May
 * @param {string|null|undefined} isoDate raw session date from API
 * @param {string} todayIso YYYY-MM-DD local
 */
export function formatOperationalDayStamp(isoDate, todayIso) {
  const ymd = normalizeSessionDateYmd(isoDate)
  if (!ymd || !todayIso) return '—'
  const d = parseSessionLocalDate(ymd)
  const t = parseSessionLocalDate(todayIso)
  if (!d || !t) return formatDayStampShort(ymd)
  const dayMs = 86400000
  const diff = Math.round((d.getTime() - t.getTime()) / dayMs)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return formatDayStampShort(ymd)
}

export function relativeSessionDayLabel(isoDate, todayIso) {
  return formatOperationalDayStamp(isoDate, todayIso)
}

/**
 * One-line when for coaches: "Today · 7:00 AM" / "Mon 11 May · 7:00 AM"
 */
export function formatOperationalSessionLine(isoDate, startTime, todayIso) {
  const day = formatOperationalDayStamp(isoDate, todayIso)
  const clock = formatSessionClock(startTime)
  if (day === '—') return clock === '—' ? '—' : clock
  if (clock === '—') return day
  return `${day} · ${clock}`
}

/**
 * Coach-facing range: "Today · 6:00 PM – 7:30 PM" / "Tue, May 12 · …"
 * @param {string|null|undefined} endTime
 */
export function formatOperationalSessionRange(isoDate, startTime, endTime, todayIso) {
  const day = formatOperationalDayStamp(isoDate, todayIso)
  const start = formatSessionClock(startTime)
  const end = formatSessionClock(endTime)
  const range =
    start !== '—' && end !== '—' ? `${start} – ${end}` : start !== '—' ? start : end !== '—' ? end : '—'
  if (day === '—') return range === '—' ? '—' : range
  if (range === '—') return day
  return `${day} · ${range}`
}

/** Clock range only: "6:00 PM – 7:30 PM" */
export function formatSessionClockRange(startTime, endTime) {
  const start = formatSessionClock(startTime)
  const end = formatSessionClock(endTime)
  if (start !== '—' && end !== '—') return `${start} – ${end}`
  if (start !== '—') return start
  if (end !== '—') return end
  return '—'
}

/** Wall-clock range from recorded actual session timestamps (ISO). */
export function formatActualSessionRange(actualStart, actualEnd) {
  const fmt = (iso) => {
    if (iso == null || iso === '') return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d)
  }
  const a = fmt(actualStart)
  const b = fmt(actualEnd)
  if (a === '—' && b === '—') return null
  return `${a} – ${b}`
}

/**
 * Neutral calendar date line for compact lists (avoids repeating Today/Tomorrow in every row).
 */
export function formatSessionScheduleDateLine(isoDate) {
  const ymd = normalizeSessionDateYmd(isoDate)
  const d = parseSessionLocalDate(ymd)
  if (!d) return '—'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/** @param {string} isoDate YYYY-MM-DD */
export function parseSessionLocalDate(isoDate) {
  const ymd = normalizeSessionDateYmd(isoDate)
  const src = ymd || String(isoDate)
  const m = src.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10) - 1
  const day = parseInt(m[3], 10)
  const d = new Date(y, mo, day)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Best-effort calendar day for an operational row (API may omit `sessionDate` on edge joins).
 * @param {{ sessionDate?: string, session_date?: string, operationalDayLocal?: string, operational_day_local?: string, scheduledStartAt?: string, scheduled_start_at?: string, timezone?: string }} row
 * @returns {string} YYYY-MM-DD or ''
 */
export function effectiveOperationalSessionDateYmd(row) {
  if (!row) return ''
  const direct = normalizeSessionDateYmd(row.sessionDate ?? row.session_date)
  if (direct) return direct
  const opDay = normalizeSessionDateYmd(row.operationalDayLocal ?? row.operational_day_local)
  if (opDay) return opDay
  const iso = row.scheduledStartAt ?? row.scheduled_start_at
  const tz = row.timezone
  if (iso && tz && String(tz).trim()) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: String(tz).trim(),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(iso))
    } catch {
      /* fall through */
    }
  }
  if (iso) return normalizeSessionDateYmd(new Date(iso).toISOString())
  return ''
}

function operationalSessionChronologicalKey(row) {
  const iso = row?.scheduledStartAt ?? row?.scheduled_start_at
  if (iso) return String(iso)
  const da = effectiveOperationalSessionDateYmd(row)
  const t = String(row?.startTime ?? row?.start_time ?? '').slice(0, 8)
  return da ? `${da}T${t || '00:00:00'}` : ''
}

/** Stable chronological ordering for board / timeline rows. */
export function compareOperationalSessionsChronological(a, b) {
  return operationalSessionChronologicalKey(a).localeCompare(operationalSessionChronologicalKey(b))
}

/** Max upcoming sessions shown in schedule / batch timelines (product-wide). */
export const UPCOMING_SESSIONS_DISPLAY_CAP = 3

/**
 * @param {object[]} rows
 * @param {number} [cap]
 */
export function sliceUpcomingSessionsForDisplay(rows, cap = UPCOMING_SESSIONS_DISPLAY_CAP) {
  if (!Array.isArray(rows) || rows.length <= cap) return rows || []
  return rows.slice(0, cap)
}

function sessionStartInstant(row) {
  const startIso = row?.scheduledStartAt ?? row?.scheduled_start_at
  if (startIso != null && startIso !== '') {
    const t = new Date(startIso).getTime()
    if (!Number.isNaN(t)) return t
  }
  const ymd = effectiveOperationalSessionDateYmd(row)
  const startTime = row?.startTime ?? row?.start_time
  if (!ymd || startTime == null || startTime === '') return null
  const d = parseSessionLocalDate(ymd)
  if (!d) return null
  const m = String(startTime).match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0)
  return d.getTime()
}

function sessionEndInstant(row) {
  const ymd = effectiveOperationalSessionDateYmd(row)
  const endTime = row?.endTime ?? row?.end_time
  // Prefer wall-clock on the session calendar day — UTC instants often hide “today” classes.
  if (ymd && endTime != null && endTime !== '') {
    const d = parseSessionLocalDate(ymd)
    if (d) {
      const m = String(endTime).match(/^(\d{1,2}):(\d{2})/)
      if (m) {
        d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0)
        return d.getTime()
      }
    }
  }
  const endIso = row?.scheduledEndAt ?? row?.scheduled_end_at
  if (endIso != null && endIso !== '') {
    const t = new Date(endIso).getTime()
    if (!Number.isNaN(t)) return t
  }
  return null
}

/**
 * False once the planned end time is in the past (cancelled rows excluded by caller).
 * Uses wall-clock end on the session calendar day when UTC instants are missing or wrong.
 * @param {string} [todayYmd] Academy-local today (YYYY-MM-DD) — drops prior calendar days.
 */
export function isOperationalSessionStillUpcoming(row, now = new Date(), todayYmd = '') {
  if (!row) return false
  const sessionYmd = effectiveOperationalSessionDateYmd(row)
  const today = String(todayYmd || '').slice(0, 10)
  if (today && sessionYmd && sessionYmd < today) return false
  if (today && sessionYmd && sessionYmd > today) return true
  if (today && sessionYmd === today) {
    const startMs = sessionStartInstant(row)
    if (startMs != null && startMs > now.getTime()) return true
  }
  const endMs = sessionEndInstant(row)
  if (endMs != null) return endMs > now.getTime()
  return true
}

/**
 * @param {{ sessionDate?: string, session_date?: string, startTime?: string, start_time?: string, scheduledStartAt?: string, scheduled_start_at?: string }} session
 * @returns {Date|null}
 */
export function sessionStartsAt(session) {
  const iso = session?.scheduledStartAt ?? session?.scheduled_start_at
  if (iso) {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const rawDate = session?.sessionDate ?? session?.session_date
  const date = normalizeSessionDateYmd(rawDate) || String(rawDate || '').slice(0, 10)
  const time = session?.startTime ?? session?.start_time
  if (!date || time == null || time === '') return null
  const t = String(time)
  const timePart = t.length <= 5 ? `${t}:00` : t.slice(0, 8)
  const isoLocal = `${date}T${timePart}`
  const d = new Date(isoLocal)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Index of the row to emphasize as "next up" for today's list (first pending future session, else first pending).
 * @returns {number} -1 if none
 */
export function getNextSessionHighlightIndex(sessions, now = new Date()) {
  if (!sessions?.length) return -1
  let firstPending = -1
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].attendanceMarked) continue
    if (firstPending < 0) firstPending = i
    const start = sessionStartsAt(sessions[i])
    if (start && start >= now) return i
  }
  return firstPending
}

/** Primary label: resolved batch name from API, else session title */
export function displayBatchTitle(session) {
  if (!session) return 'Class'
  const batch = session.batchName ?? session.batch_name
  if (batch && String(batch).trim()) return String(batch).trim()
  if (session.title && String(session.title).trim()) return String(session.title).trim()
  return 'Class'
}

/** @param {object} session normalized row */
export function formatExpectedStudents(session) {
  const n = session.expectedStudentCount ?? session.expected_student_count
  if (n == null || n === '') return null
  const num = Number(n)
  if (!Number.isFinite(num)) return null
  return num === 1 ? '1 student expected' : `${Math.round(num)} students expected`
}
