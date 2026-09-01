import React from 'react'
import {
  cilChart,
  cilFlagAlt,
  cilLibrary,
  cilPeople,
  cilSpeedometer,
  cilStorage,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const icon = (name) => <CIcon icon={name} customClassName="nav-icon" />

export const superAdminNav = [
  {
    component: 'CNavItem',
    name: 'Overview',
    to: '/super-admin/overview',
    icon: icon(cilSpeedometer),
  },
  {
    component: 'CNavItem',
    name: 'Academies',
    to: '/super-admin/academies',
    icon: icon(cilLibrary),
  },
  { component: 'CNavItem', name: 'Users', to: '/super-admin/users', icon: icon(cilPeople) },
  {
    component: 'CNavItem',
    name: 'Subscriptions',
    to: '/super-admin/subscriptions',
    icon: icon(cilStorage),
  },
  { component: 'CNavItem', name: 'Analytics', to: '/super-admin/analytics', icon: icon(cilChart) },
  { component: 'CNavItem', name: 'Presets', to: '/super-admin/presets', icon: icon(cilFlagAlt) },
  { component: 'CNavItem', name: 'Support', to: '/super-admin/support', icon: icon(cilUser) },
  {
    component: 'CNavItem',
    name: 'Feature flags',
    to: '/super-admin/feature-flags',
    icon: icon(cilFlagAlt),
  },
  {
    component: 'CNavItem',
    name: 'System health',
    to: '/super-admin/system-health',
    icon: icon(cilSpeedometer),
  },
  {
    component: 'CNavItem',
    name: 'Audit logs',
    to: '/super-admin/audit-logs',
    icon: icon(cilStorage),
  },
  { component: 'CNavTitle', name: 'Payments ops' },
  { component: 'CNavItem', name: 'Ops · Webhooks', to: '/ops/webhooks', icon: icon(cilStorage) },
  {
    component: 'CNavItem',
    name: 'Ops · Collections',
    to: '/ops/collections',
    icon: icon(cilStorage),
  },
  {
    component: 'CNavItem',
    name: 'Ops · Settlements',
    to: '/ops/settlements',
    icon: icon(cilStorage),
  },
]
