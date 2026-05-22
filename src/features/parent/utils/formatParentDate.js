import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

export function formatSessionWhen(session) {
  if (!session) return '—'
  const utc = session.startTimeUtc
  if (utc) {
    try {
      const d = new Date(utc)
      if (!Number.isNaN(d.getTime())) {
        const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        return `${formatDisplayDateDmy(d)} · ${time}`
      }
    } catch {
      /* fall through */
    }
  }
  const date = session.sessionDate || session.session_date
  const start = session.startTime || session.start_time
  if (date && start) return `${formatDisplayDateDmy(date)} · ${start}`
  if (date) return formatDisplayDateDmy(date)
  return '—'
}

export function formatShortDate(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return formatDisplayDateDmy(d)
  } catch {
    return String(value)
  }
}
