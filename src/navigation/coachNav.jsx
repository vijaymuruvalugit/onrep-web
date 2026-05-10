import React from 'react'
import CIcon from '@coreui/icons-react'
import { CNavItem } from '@coreui/react'

import { COACH_NAV_REGISTRATION } from './coachNavRegistration'

export const coachNav = COACH_NAV_REGISTRATION.map((item) => ({
  component: CNavItem,
  name: item.name,
  to: item.to,
  icon: <CIcon icon={item.icon} customClassName="nav-icon" />,
}))
