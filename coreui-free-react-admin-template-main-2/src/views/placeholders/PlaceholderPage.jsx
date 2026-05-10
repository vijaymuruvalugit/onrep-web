import React from 'react'
import { useLocation } from 'react-router-dom'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'

import { ONREP_ROUTE_DEFS } from '../../routePaths'

const PlaceholderPage = () => {
  const { pathname } = useLocation()
  const meta = ONREP_ROUTE_DEFS.find((d) => d.path === pathname)
  const title = meta?.name || 'Page'

  return (
    <CCard className="mb-4">
      <CCardHeader>{title}</CCardHeader>
      <CCardBody>
        <p className="text-body-secondary mb-1">
          Placeholder — feature UI will be migrated in a later phase.
        </p>
        <code className="small text-muted">{pathname}</code>
      </CCardBody>
    </CCard>
  )
}

export default PlaceholderPage
