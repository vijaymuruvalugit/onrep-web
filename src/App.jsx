/**
 * App Component
 *
 * Root application component that sets up routing, theme management,
 * and lazy-loaded page components with suspense boundaries.
 *
 * Features:
 * - Client-side routing with HashRouter
 * - Theme detection from URL parameters and Redux state
 * - Lazy loading for all routes with loading spinner fallback
 * - Public routes (login, register, error pages)
 * - Protected routes wrapped in DefaultLayout
 *
 * @module App
 */

import React, { Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { CSpinner } from '@coreui/react'
import { useOnrepColorModes, ONREP_COLOR_MODE_STORAGE_KEY } from './hooks/useOnrepColorModes'
import './scss/style.scss'

// We use those styles to show code examples, you should remove them in your application.
import './scss/examples.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
const RequireAuth = React.lazy(() => import('./layouts/RequireAuth'))
const SubscriptionShell = React.lazy(
  () => import('./features/subscription/components/SubscriptionShell'),
)
const SubscriptionPaywallPage = React.lazy(
  () => import('./features/subscription/pages/SubscriptionPaywallPage'),
)
const SubscriptionPaymentProcessingPage = React.lazy(
  () => import('./features/subscription/pages/SubscriptionPaymentProcessingPage'),
)
const SubscriptionGuard = React.lazy(() => import('./features/auth/guards/SubscriptionGuard'))
const ChangePasswordPage = React.lazy(() => import('./features/auth/pages/ChangePasswordPage'))
const MobileOnlyPage = React.lazy(() => import('./features/auth/pages/MobileOnlyPage'))

import { publicRoutes } from './routes/publicRoutes'
import { restoreSession } from './features/auth/slices/authSlice'
import { registerSubscriptionRequiredHandler } from './api/http'
import { refreshSubscription } from './features/auth/subscriptionRefresh'
import { sanitizeNext } from './features/auth/sanitizeNext'
import { hasAcademyAdminCapability } from './features/auth/utils/academyAdminAccess'
import { restorePublicHashRoute } from './utils/restorePublicHashRoute'

/**
 * Global paywall redirector — 403 SUBSCRIPTION_REQUIRED interceptor.
 *
 * Doctrine (CONTEXT/05):
 *   1. Preferred path: `navigate('/subscription/paywall?next=…', { replace: true })`
 *      so React Router stays in charge, layouts unmount cleanly, Redux state
 *      remains coherent.
 *   2. Fallback hard navigation `window.location.replace(...)` is reserved for
 *      shell corruption (router not yet mounted, handler unregistered). It
 *      bypasses React state cleanup and can mask future bugs.
 *   3. Owner-only — coach/parent/student never see `/subscription/*` from a
 *      403. They still get the standard 403 surface in the dashboard.
 *   4. Force-refresh `/auth/me` post-redirect so the new `can_access_app`
 *      shape is reflected (the guard also does this defensively).
 *   5. Loop guard: if we are already on the paywall, skip the redirect.
 */
function SubscriptionPaywallBinder() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)

  useEffect(() => {
    registerSubscriptionRequiredHandler(() => {
      try {
        if (typeof window === 'undefined') return
        // Loop guard — already on the paywall / processing page.
        if (window.location.hash.startsWith('#/subscription/')) return
        // Owner-only redirect. Non-owners just see the 403 surface from the
        // calling page; the backend coach gate already 403s appropriately.
        if (user && !hasAcademyAdminCapability(user)) return

        const currentHash = window.location.hash || ''
        const currentPath = currentHash.startsWith('#') ? currentHash.slice(1) : ''
        const cleanPath = currentPath.split('?')[0]
        const safeNext = sanitizeNext(currentPath) // includes query
        const nextQs = safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''
        const target = `/subscription/paywall${nextQs}`

        // Force /auth/me refresh — the cached subscription is now stale.
        refreshSubscription(dispatch, { force: true }).catch(() => {})

        // Preferred: in-router navigate. Hard fallback only if the navigate
        // handler is unavailable (e.g. mid-mount race).
        try {
          navigate(target, { replace: true })
        } catch (navErr) {
          // Shell-corruption fallback. Documented as last resort.
          console.warn(
            '[paywall] navigate replace failed; falling back to hard replace',
            navErr?.message,
          )
          window.location.replace(`#${target}`)
        }
        // Avoid the dashboard route remaining the back-button target.
        // (replace:true handles that for navigate; the hard fallback above
        // uses location.replace for the same effect.)
        void cleanPath
      } catch (e) {
        console.warn('[paywall] redirect failed', e?.message)
      }
    })
    return () => registerSubscriptionRequiredHandler(null)
  }, [dispatch, navigate, user])
  return null
}

/**
 * Centralized event-driven `refreshSubscription` triggers.
 *
 * Each event uses the 30s TTL (no force) — multi-tab focus churn / laptop
 * wakeups must not hammer `/auth/me`. The processing page and 403 interceptor
 * are the only sites that force-bypass the TTL.
 */
function SubscriptionEventRefresher() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return undefined
    function onVisible() {
      if (typeof document !== 'undefined' && document.hidden) return
      refreshSubscription(dispatch).catch(() => {})
    }
    function onOnline() {
      refreshSubscription(dispatch).catch(() => {})
    }
    function onFocus() {
      refreshSubscription(dispatch).catch(() => {})
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline)
      window.addEventListener('focus', onFocus)
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline)
        window.removeEventListener('focus', onFocus)
      }
    }
  }, [dispatch, isAuthenticated])
  return null
}

/**
 * Root (`/`) route redirector.
 *
 * The exact `/` route is a fallback — most authenticated traffic enters the
 * app via `/coach/dashboard`, `/owner/...`, `/parent/...` etc. (matched by
 * the `/*` DefaultLayout route). Anyone hitting `/` exactly is either:
 *   1. Unauthenticated — send to `/auth/login`.
 *   2. Authenticated but landed here via an external redirect that lost the
 *      hash fragment (most commonly the Razorpay payment return — see the
 *      pre-React shim in `index.html`). Send them to `/coach/dashboard`,
 *      which is role-aware via DefaultLayout + SubscriptionGuard.
 *
 * Never unconditionally bounce to login while authenticated — that strands
 * paying users on the login screen after returning from Razorpay if the
 * shim somehow missed the rewrite.
 */
function RootRedirect({ isRestored }) {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)
  if (!isRestored) return <CSpinner color="primary" />
  if (isAuthenticated) return <Navigate to="/coach/dashboard" replace />
  return <Navigate to="/auth/login" replace />
}

/**
 * Main Application Component
 *
 * Manages application-wide concerns:
 * - Theme initialization and persistence
 * - Client-side routing configuration
 * - Lazy loading with suspense fallbacks
 * - Theme detection from URL query parameters
 *
 * Theme priority:
 * 1. URL parameter (?theme=dark|light|auto)
 * 2. Saved preference (localStorage, see ONREP_COLOR_MODE_STORAGE_KEY)
 * 3. Redux `ui.theme` when nothing saved yet (defaults to light)
 *
 * @component
 * @returns {React.ReactElement} Application root with routing
 *
 * @example
 * // Standard usage in index.js
 * import App from './App'
 * ReactDOM.render(<App />, document.getElementById('root'))
 */
const App = () => {
  const { isColorModeSet, setColorMode } = useOnrepColorModes(ONREP_COLOR_MODE_STORAGE_KEY)
  const dispatch = useDispatch()
  const storedTheme = useSelector((state) => state.ui.theme)
  const isRestored = useSelector((state) => state.auth.isRestored)

  useEffect(() => {
    restorePublicHashRoute()
  }, [])

  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const raw = urlParams.get('theme')
    const theme = raw && raw.match(/^[A-Za-z0-9\s]+/)?.[0]
    if (theme) {
      setColorMode(theme)
      return
    }

    if (!isColorModeSet()) {
      setColorMode(storedTheme || 'light')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter>
      <SubscriptionPaywallBinder />
      <SubscriptionEventRefresher />
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          {publicRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={<route.element />} />
          ))}

          {/*
           * Subscription tree — MUST live OUTSIDE the DefaultLayout +
           * SubscriptionGuard tree. The paywall is a calm conversion screen,
           * not an admin dashboard. The processing page would self-redirect
           * if it were inside the guard.
           */}
          <Route path="/mobile-only" element={<MobileOnlyPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/auth/change-password" element={<ChangePasswordPage />} />
            <Route path="/subscription" element={<SubscriptionShell />}>
              <Route path="paywall" element={<SubscriptionPaywallPage />} />
              <Route path="payment-processing" element={<SubscriptionPaymentProcessingPage />} />
              <Route index element={<Navigate to="paywall" replace />} />
            </Route>
          </Route>

          {/* Dashboard tree — guarded by SubscriptionGuard (can_access_app). */}
          <Route element={<RequireAuth />}>
            <Route element={<SubscriptionGuard />}>
              <Route path="/*" element={<DefaultLayout />} />
            </Route>
          </Route>

          <Route path="/" element={<RootRedirect isRestored={isRestored} />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
