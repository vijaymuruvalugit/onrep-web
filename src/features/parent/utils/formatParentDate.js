export function formatSessionWhen(session) {
  if (!session) return '—'
  const utc = session.startTimeUtc
  if (utc) {
    try {
      const d = new Date(utc)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    } catch {
      /* fall through */
    }
  }
  const date = session.sessionDate || session.session_date
  const start = session.startTime || session.start_time
  if (date && start) return `${date} · ${start}`
  if (date) return String(date)
  return '—'
}

export function formatShortDate(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return String(value)
  }
}
