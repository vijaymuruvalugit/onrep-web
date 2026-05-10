import axios from 'axios'
import { authStorage } from './authStorage'
import normalizeApiError from './normalizeApiError'

let storeRef = null
let forceLogoutAction = null

function createActivityId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
})

http.interceptors.request.use((config) => {
  const nextConfig = { ...config }
  const token = authStorage.getToken()
  nextConfig.headers = nextConfig.headers || {}

  if (token) {
    nextConfig.headers.Authorization = `Bearer ${token}`
  }
  nextConfig.headers['x-activity-id'] = createActivityId()

  return nextConfig
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error)

    if (normalized.status === 401 && storeRef && forceLogoutAction) {
      storeRef.dispatch(forceLogoutAction('unauthorized'))
    }

    return Promise.reject(normalized)
  },
)

export function bindHttpAuth({ store, forceLogout }) {
  storeRef = store
  forceLogoutAction = forceLogout
}

export default http
