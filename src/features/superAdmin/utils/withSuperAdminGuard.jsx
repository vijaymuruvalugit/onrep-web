import React from 'react'
import RequireSuperAdmin from '../guards/RequireSuperAdmin'

export function withSuperAdminGuard(LazyPage) {
  function GuardedPage(props) {
    return (
      <RequireSuperAdmin>
        <LazyPage {...props} />
      </RequireSuperAdmin>
    )
  }
  GuardedPage.displayName = `SuperAdmin(${LazyPage.displayName || LazyPage.name || 'Page'})`
  return GuardedPage
}
