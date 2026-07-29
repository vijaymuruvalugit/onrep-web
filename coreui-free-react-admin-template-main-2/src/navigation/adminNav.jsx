/**
 * Academy owner navigation (role: academy_owner).
 * Everything in coachNav plus owner-only items from onrep CoachAcademyMenuSheet (fee collection).
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilWallet } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

import { coachNav } from './coachNav'

const ownerItems = [
  {
    component: CNavTitle,
    name: 'Owner',
  },
  {
    component: CNavItem,
    name: 'Fee Collection',
    to: '/coach/onboarding/fee-collection',
    icon: <CIcon icon={cilWallet} customClassName="nav-icon" />,
  },
]

export const adminNav = [...coachNav.slice(0, -2), ...ownerItems, ...coachNav.slice(-2)]
