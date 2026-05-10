import http from '../../../api/http'

export async function getCoachUiConfig() {
  const { data } = await http.get('/academy/coach-ui-config')
  return data?.config && typeof data.config === 'object' ? data.config : {}
}

export async function patchCoachUiConfig(body) {
  const { data } = await http.patch('/academy/coach-ui-config', body)
  return data?.config && typeof data.config === 'object' ? data.config : {}
}
