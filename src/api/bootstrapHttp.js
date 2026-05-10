/**
 * Minimal HTTP client for bootstrap calls that must not send x-activity-id (e.g. GET /activities).
 * Avoids circular imports with workspace slice + main http interceptor.
 */
import axios from 'axios'
import { authStorage } from './authStorage'

const bootstrapHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
})

bootstrapHttp.interceptors.request.use((config) => {
  const next = { ...config }
  next.headers = next.headers || {}
  const token = authStorage.getToken()
  if (token) next.headers.Authorization = `Bearer ${token}`
  delete next.headers['x-activity-id']
  return next
})

export default bootstrapHttp
