import http from '../../../api/http'

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
    }
  },

  async markBulkAttendance(classId, marks) {
    const { data } = await http.post(`/sessions/${encodeURIComponent(classId)}/attendance/bulk`, {
      marks,
    })
    return data || {}
  },
}

export default attendanceApi
