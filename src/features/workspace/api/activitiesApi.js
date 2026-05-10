import http from '../../../api/http'
import bootstrapHttp from '../../../api/bootstrapHttp'

export async function listActivities() {
  const { data } = await bootstrapHttp.get('/activities')
  return Array.isArray(data?.activities) ? data.activities : []
}

export async function createActivity(body) {
  const { data } = await http.post('/activities', body)
  return data?.activity || null
}

export async function deactivateActivity(activityId) {
  const { data } = await http.patch(`/activities/${encodeURIComponent(activityId)}`, {
    isActive: false,
  })
  return data?.activity || null
}
