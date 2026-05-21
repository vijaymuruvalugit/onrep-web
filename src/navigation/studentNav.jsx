/**
 * Student navigation — motivational, lightweight.
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilDollar, cilHome, cilList } from '@coreui/icons'
import { CNavItem } from '@coreui/react'

export const studentNav = [
  {
    component: CNavItem,
    name: 'My progress',
    to: '/student/home',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Sessions',
    to: '/student/schedule',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Attendance',
    to: '/student/attendance',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Payments',
    to: '/student/payments',
    icon: <CIcon icon={cilDollar} customClassName="nav-icon" />,
  },
]
