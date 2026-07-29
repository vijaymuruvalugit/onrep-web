/**
 * Coach & staff navigation (roles: coach, admin).
 * Mirrors onrep: CoachTabs (Dashboard, Students, Payments, Skating) + CoachHomeStack + CoachAcademyMenuSheet.
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBasketball,
  cilCalendar,
  cilChartPie,
  cilCheckCircle,
  cilCreditCard,
  cilDollar,
  cilHome,
  cilLayers,
  cilLocationPin,
  cilNotes,
  cilPeople,
  cilPuzzle,
  cilSchool,
  cilSettings,
  cilSpeedometer,
  cilUser,
} from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'

export const coachNav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/coach/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Students',
    to: '/coach/students',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Payments',
    to: '/coach/payments',
    icon: <CIcon icon={cilDollar} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Sessions',
    to: '/coach/sessions',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Classes',
        to: '/coach/sessions',
      },
      {
        component: CNavItem,
        name: 'Create Class',
        to: '/coach/sessions/new',
      },
      {
        component: CNavItem,
        name: 'Session Detail',
        to: '/coach/sessions/detail',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Batches',
    to: '/coach/batches',
    icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Batch Schedules',
    to: '/coach/batches/recurring',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Attendance',
    to: '/coach/attendance/session',
    icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Session Attendance',
        to: '/coach/attendance/session',
      },
      {
        component: CNavItem,
        name: 'Attendance History',
        to: '/coach/attendance/history',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Training',
    to: '/coach/training',
    icon: <CIcon icon={cilSchool} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Skating',
    to: '/coach/skating',
    icon: <CIcon icon={cilBasketball} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Skating Hub',
        to: '/coach/skating',
      },
      {
        component: CNavItem,
        name: 'Skills',
        to: '/coach/skating/skills',
      },
      {
        component: CNavItem,
        name: 'Races',
        to: '/coach/skating/races',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Manage',
    to: '/coach/manage',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Coaches',
    to: '/coach/coaches',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Parents',
    to: '/coach/parents',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Activities',
    to: '/coach/activities',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Places',
    to: '/coach/places',
    icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Onboarding',
    to: '/coach/onboarding/getting-started',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Getting Started',
        to: '/coach/onboarding/getting-started',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Reports',
    to: '/coach/reports/revenue',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Revenue Overview',
        to: '/coach/reports/revenue',
      },
      {
        component: CNavItem,
        name: 'Operations Reports',
        to: '/coach/reports/operations',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Billing',
    to: '/coach/billing',
    icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Settings',
    to: '/coach/settings',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]
