import axios from 'axios'
import { authStorage } from './authStorage'
import normalizeApiError from './normalizeApiError'
import {
  requestRequiresActivityWorkspace,
  requestSkipsActivityHeader,
  normalizeApiPath,
  isValidUuid,
} from '../core/activityWorkspace/apiActivityContext'

let storeRef = null
let forceLogoutAction = null
const workspaceDebugEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ACTIVITY_WORKSPACE_DEBUG === '1'

function buildFullUrl(config) {
  const base = config.baseURL ? String(config.baseURL).replace(/\/$/, '') : ''
  const u = config.url != null ? String(config.url) : ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  const path = u.startsWith('/') ? u : `/${u}`
  return base ? `${base}${path}` : path
}

function resolveActivityIdFromStore() {
  if (!storeRef) return null
  try {
    const id = storeRef.getState()?.workspace?.activeActivityId
    return id && isValidUuid(String(id)) ? String(id).trim() : null
  } catch {
    return null
  }
}

function debugWorkspaceRequest({ pathForRules, fullUrl, skipHeader, activityId, headerValue }) {
  if (!workspaceDebugEnabled) return
  const route = typeof window !== 'undefined' ? window.location?.pathname || '' : ''
  // Temporary diagnostic for QA hardening; keep behind env flag.
  console.debug('[workspace-http]', {
    route,
    pathForRules,
    requestUrl: fullUrl,
    activeActivityId: activityId,
    skipActivityHeader: skipHeader,
    injectedHeader: headerValue || null,
  })
}

let activityForbiddenHandler = null
let subscriptionRequiredHandler = null

/** Registered from store setup to avoid http ↔ workspace circular imports. */
export function registerActivityForbiddenHandler(fn) {
  activityForbiddenHandler = typeof fn === 'function' ? fn : null
}

/**
 * Phase 2.2 global paywall trigger. When any API returns
 * `403 { code: 'SUBSCRIPTION_REQUIRED' }`, the registered handler decides how
 * to navigate (typically `history.push('/coach/billing/paywall')`).
 *
 * Registered from `App.jsx` so that http stays decoupled from react-router.
 */
export function registerSubscriptionRequiredHandler(fn) {
  subscriptionRequiredHandler = typeof fn === 'function' ? fn : null
}

function maybeDispatchWorkspaceFault(errorBody, status) {
  if (!storeRef || status !== 403 || !activityForbiddenHandler) return
  const msg = String(errorBody?.error || errorBody?.message || '').toLowerCase()
  if (msg.includes('activity') || msg.includes('workspace') || msg.includes('partition')) {
    activityForbiddenHandler()
  }
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

  const fullUrl = buildFullUrl(nextConfig)
  const pathForRules = normalizeApiPath(fullUrl)
  const skipHeader =
    nextConfig.skipActivityHeader === true || requestSkipsActivityHeader(pathForRules)
  const activityId = resolveActivityIdFromStore()

  if (skipHeader) {
    delete nextConfig.headers['x-activity-id']
    debugWorkspaceRequest({
      pathForRules,
      fullUrl,
      skipHeader,
      activityId,
      headerValue: null,
    })
    return nextConfig
  }

  if (activityId) {
    nextConfig.headers['x-activity-id'] = activityId
  } else {
    delete nextConfig.headers['x-activity-id']
  }

  if (requestRequiresActivityWorkspace(pathForRules) && !activityId) {
    const err = new Error('Choose an activity to continue.')
    err.code = 'WORKSPACE_REQUIRED'
    err.isWorkspaceGate = true
    return Promise.reject(err)
  }

  debugWorkspaceRequest({
    pathForRules,
    fullUrl,
    skipHeader,
    activityId,
    headerValue: nextConfig.headers['x-activity-id'],
  })

  return nextConfig
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.isWorkspaceGate) {
      return Promise.reject(
        normalizeApiError({
          response: {
            status: 0,
            data: { error: error.message, code: 'WORKSPACE_REQUIRED' },
          },
        }),
      )
    }

    const normalized = normalizeApiError(error)
    const status = normalized.status
    const body = error?.response?.data

    if (status === 401 && storeRef && forceLogoutAction) {
      storeRef.dispatch(forceLogoutAction('unauthorized'))
    } else if (
      status === 403 &&
      (body?.code === 'SUBSCRIPTION_REQUIRED' || normalized?.code === 'SUBSCRIPTION_REQUIRED') &&
      subscriptionRequiredHandler
    ) {
      try {
        subscriptionRequiredHandler(body || normalized)
      } catch (handlerError) {
        console.error('[http] subscription required handler failed', handlerError)
      }
    } else {
      maybeDispatchWorkspaceFault(body, status)
    }

    return Promise.reject(normalized)
  },
)

export function bindHttpAuth({ store, forceLogout }) {
  storeRef = store
  forceLogoutAction = forceLogout
}

export default http
