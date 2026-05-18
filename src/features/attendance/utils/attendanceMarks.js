/**
 * Map UI draft marks to API bulk payload.
 * @param {Record<string, { studentId: string, status?: string|null, notes?: string }>} draftMarks
 */
export function draftMarksToApiPayload(draftMarks) {
  return Object.values(draftMarks || {}).map((m) => {
    const studentId = m.studentId
    if (m.status === null || m.status === 'unmarked') {
      return { studentId, unmark: true }
    }
    return { studentId, present: m.status === 'present' }
  })
}

/**
 * Toggle present/absent; tap the active status again to clear (unmark).
 * @param {'present'|'absent'} target
 * @param {string|null|undefined} currentStatus
 * @returns {string|null}
 */
export function toggleAttendanceStatus(target, currentStatus) {
  if (currentStatus === target) return null
  return target
}
