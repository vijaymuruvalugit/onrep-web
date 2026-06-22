/**
 * Parent navigation — small, calm visibility surface.
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilCalendarCheck, cilChartLine, cilDollar, cilHome, cilList } from '@coreui/icons'
import { CNavItem } from '@coreui/react'

export const parentNav = [
  {
    component: CNavItem,
    name: 'Overview',
    to: '/parent/home',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Schedule',
    to: '/parent/schedule',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Participation',
    to: '/parent/attendance',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Progress',
    to: '/parent/progress',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Events',
    to: '/parent/events',
    icon: <CIcon icon={cilCalendarCheck} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Payments',
    to: '/parent/payments',
    icon: <CIcon icon={cilDollar} customClassName="nav-icon" />,
  },
]
