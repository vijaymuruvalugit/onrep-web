import { normalizeStatus } from './studentStatus'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

export function getStudentDisplayName(student) {
  return student?.full_name || student?.fullName || 'Unknown student'
}

export function getStudentActivity(student) {
  return student?.activity_name || student?.activity || student?.group_name || 'Not assigned'
}

export function getStudentBatch(student) {
  if (Array.isArray(student?.batch_names) && student.batch_names.length > 0) {
    return student.batch_names.join(', ')
  }
  const ids = student?.batch_ids ?? student?.batchIds
  if (Array.isArray(ids) && ids.length > 0) {
    return ids.join(', ')
  }
  return 'Not assigned'
}

// Soft display label for the Students list "Parent" column. Real per-student
// parent management lives on the detail page; the list-level GET /students
// endpoint doesn't currently include a count of linked parents, so we fall
// back to legacy parent_guardian_name (still populated for older students)
// and otherwise show an em-dash so the column doesn't read "Not linked"
// for every newly-created student.
export function getStudentParent(student) {
  return student?.parent_guardian_name || student?.parentName || '—'
}

export function getStudentAge(student) {
  if (!student?.date_of_birth) return '—'
  const dob = new Date(student.date_of_birth)
  if (Number.isNaN(dob.getTime())) return '—'
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  const monthDelta = now.getMonth() - dob.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) years -= 1
  return years >= 0 ? String(years) : '—'
}

export function getCreatedDate(student) {
  const value = student?.created_at || student?.createdAt
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return formatDisplayDateDmy(date)
}

export function getEnrollmentStatus(student) {
  const explicit = student?.enrollment_status || student?.status
  return normalizeStatus(explicit || 'pending')
}

export function getPaymentStatus(student) {
  return student?.coach_monthly_fee_status || student?.payment_status || 'Pending'
}

export function getAttendanceSummary(student) {
  const attendance = student?.attendance_percent
  if (attendance === null || attendance === undefined || attendance === '') return '—'
  return `${attendance}%`
}

export function normalizeStudentsListPayload(payload) {
  const students = Array.isArray(payload?.students) ? payload.students : []
  const pagination = payload?.pagination || null

  return {
    students,
    pagination: {
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || pagination?.limit || students.length || 10,
      total: pagination?.total || students.length,
      totalPages:
        pagination?.totalPages ||
        (pagination?.total && (pagination?.pageSize || pagination?.limit)
          ? Math.ceil(pagination.total / (pagination.pageSize || pagination.limit))
          : 1),
      hasNextPage: Boolean(pagination?.hasNextPage),
      hasPrevPage: Boolean(pagination?.hasPrevPage),
    },
    hasServerPagination: Boolean(payload?.pagination),
  }
}
