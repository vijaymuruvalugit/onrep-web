import http from '../../../api/http'

export async function getParentPerformanceSharing(activityId) {
  const { data } = await http.get('/activity-settings/parent-performance-sharing', {
    activityId,
  })
  return data
}

export async function patchParentPerformanceSharing(activityId, enabled) {
  const { data } = await http.patch(
    '/activity-settings/parent-performance-sharing',
    { enabled },
    { activityId },
  )
  return data
}
