/** Dev-only diagnostics when day-board returns no rows. */
export function devLogEmptyDayBoard(dateYmd, sessions) {
  if (!import.meta.env.DEV) return
  if (sessions?.length > 0) return
  // eslint-disable-next-line no-console
  console.debug('[operational-sessions] day-board empty', { date: dateYmd })
}
