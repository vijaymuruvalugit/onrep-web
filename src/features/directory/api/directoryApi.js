import http from '../../../api/http'

/** Staff directory (coach / owner / admin) — id, name, role; no email. */
export async function listStaffCoaches() {
  const { data } = await http.get('/coaches')
  return Array.isArray(data?.coaches) ? data.coaches : []
}
