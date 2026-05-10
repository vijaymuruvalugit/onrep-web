/**
 * Student navigation — mirrors StudentTabs (Home, Schedule, Competitions, More).
 * Progress replaces parent-only Fees; notifications align with student More stack.
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalendar,
  cilChartLine,
  cilHome,
  cilList,
  cilStar,
  cilUser,
} from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'

export const studentNav = [
  {
    component: CNavItem,
    name: 'Home',
    to: '/student/home',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Schedule',
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
    name: 'Progress',
    to: '/student/progress',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Competitions',
    to: '/student/competitions',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Competitions',
        to: '/student/competitions',
      },
      {
        component: CNavItem,
        name: 'Leaderboard',
        to: '/student/competitions/leaderboard',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Notifications',
    to: '/student/notifications',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Profile',
    to: '/student/profile',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
]
