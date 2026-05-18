import http from '../../../api/http'
import { draftMarksToApiPayload } from '../utils/attendanceMarks'

function mergeRosterAttendance(data) {
  const students = Array.isArray(data?.students) ? data.students : []
  const attRows = Array.isArray(data?.attendance) ? data.attendance : []
  const attMap = new Map(attRows.map((a) => [String(a.student_id), Boolean(a.present)]))
  return students.map((s) => {
    const sid = String(s.id ?? s.studentId ?? s._id ?? '')
    const hasMark = sid && attMap.has(sid)
    return {
      ...s,
      attendanceStatus: hasMark ? (attMap.get(sid) ? 'present' : 'absent') : null,
      attendanceNotes: s.attendanceNotes ?? s.attendance_notes ?? '',
    }
  })
}

export const attendanceApi = {
  async getClassRoster(classId) {
    const { data } = await http.get(`/sessions/${encodeURIComponent(classId)}/roster`)
    const payload = data || {}
    return {
      ...payload,
      students: mergeRosterAttendance(payload),
      session: payload.session ?? null,
      attendanceEligible: payload.attendanceEligible !== false,
      attendanceEligibilityError: payload.attendanceEligibilityError ?? null,
    }
  },

  async markBulkAttendance(classId, marks) {
    const apiMarks = Array.isArray(marks) && marks[0]?.status !== undefined
      ? draftMarksToApiPayload(
          Object.fromEntries(marks.map((m) => [m.studentId, m])),
        )
      : marks
    const { data } = await http.post(`/sessions/${encodeURIComponent(classId)}/attendance/bulk`, {
      marks: apiMarks,
    })
    return data || {}
  },
}

export default attendanceApi
