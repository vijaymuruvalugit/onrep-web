/**
 * Composed view-model for Parent Home — keeps fan-out orchestration out of the page.
 * Dashboard + fees are loaded independently; derived loading/errors for the shell.
 */

export function selectParentHomeModel(state) {
  const p = state.parent
  const dash = p.dashboard || {}
  const sessions = Array.isArray(dash.sessions) ? dash.sessions : []
  const attendancePreview = Array.isArray(dash.attendance) ? dash.attendance : []
  const notificationsPreview = Array.isArray(dash.notifications) ? dash.notifications : []
  const resultsPreview = Array.isArray(dash.results) ? dash.results : []

  const fees = Array.isArray(p.fees) ? p.fees : []
  const paidCount = fees.filter((f) => String(f.status || '').toUpperCase() === 'PAID').length
  const dueCount = fees.length - paidCount

  const presentCount = attendancePreview.filter(
    (a) => String(a.status || '').toUpperCase() === 'PRESENT',
  ).length
  const attendanceDenom = attendancePreview.length
  const attendanceRate =
    attendanceDenom > 0 ? Math.round((100 * presentCount) / attendanceDenom) : null

  const studentNames = new Set()
  sessions.forEach((s) => {
    if (s.student?.name) studentNames.add(s.student.name)
    if (s.student_name) studentNames.add(s.student_name)
  })
  attendancePreview.forEach((a) => {
    if (a.studentName) studentNames.add(a.studentName)
  })

  return {
    dashboardLoading: p.dashboardLoading,
    dashboardError: p.dashboardError,
    feesLoading: p.feesLoading,
    feesError: p.feesError,
    anyLoading: p.dashboardLoading || p.feesLoading,
    /** Partial failure: home can still render dashboard if fees fail */
    blockingError: p.dashboardError,
    sessions,
    attendancePreview,
    notificationsPreview,
    resultsPreview,
    feesSummary: {
      total: fees.length,
      paidCount,
      dueCount,
      items: fees.slice(0, 5),
    },
    participation: {
      attendanceRate,
      presentCount,
      recentCount: attendanceDenom,
    },
    linkedStudentNames: Array.from(studentNames),
  }
}
