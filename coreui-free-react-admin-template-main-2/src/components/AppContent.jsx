/**
 * AppContent — role-aware default route at / (HashRouter).
 */

import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CContainer, CSpinner } from '@coreui/react'

import { routes } from '../routes'
import { getRoleRedirectPath } from '../features/auth/utils/roleRedirect'

function RoleHomeRedirect() {
  const user = useSelector((state) => state.auth.user)
  const to = getRoleRedirectPath(user)
  return <Navigate to={to} replace />
}

const AppContent = () => {
  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {routes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            )
          })}
          <Route path="/" element={<RoleHomeRedirect />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
