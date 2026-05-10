/**
 * Parent navigation — mirrors ParentTabs + ParentStack (Home, Schedule, Competitions, More).
 * More stack: Attendance, Notifications, Fees; stack screens: Payment history, Profile.
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilCalendar, cilDollar, cilHome, cilList, cilStar, cilUser } from '@coreui/icons'
import { CNavItem } from '@coreui/react'

export const parentNav = [
  {
    component: CNavItem,
    name: 'Home',
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
    name: 'Attendance',
    to: '/parent/attendance',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Fees',
    to: '/parent/fees',
    icon: <CIcon icon={cilDollar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Competitions',
    to: '/parent/competitions',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Notifications',
    to: '/parent/notifications',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Payment History',
    to: '/parent/payments/history',
    icon: <CIcon icon={cilDollar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Profile',
    to: '/parent/profile',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
]
