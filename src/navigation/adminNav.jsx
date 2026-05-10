/**
 * Academy owner navigation (role: academy_owner).
 * Everything in coachNav plus owner-only items.
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilPeople } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

import { coachNav } from './coachNav'

const ownerItems = [
  {
    component: CNavTitle,
    name: 'Owner',
  },
  {
    component: CNavItem,
    name: 'Coaches',
    to: '/coach/onboarding/coaches',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
]

export const adminNav = [...coachNav.slice(0, -2), ...ownerItems, ...coachNav.slice(-2)]
