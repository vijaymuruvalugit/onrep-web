/**
 * AppSidebar — CoreUI sidebar; items come from role-based navigation config (onrep structure).
 */

import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'

import { AppSidebarNav } from './AppSidebarNav'

import primaryLogo from '../assets/brand/primary-logo.png'
import brandMark from '../assets/brand/mark.png'

import { getNavigationForRole } from '../navigation'
import { isSuperAdminUser } from '../features/superAdmin/utils/superAdminAccess'
import { setSidebarShow, setSidebarUnfoldable } from '../features/ui/uiSlice'
import { resolveUserRole } from '../features/auth/utils/roleRedirect'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.ui.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.ui.sidebarShow)
  const user = useSelector((state) => state.auth.user)
  const activeRole = useSelector((state) => resolveUserRole(user))

  const navigation = useMemo(() => getNavigationForRole(activeRole, user), [activeRole, user])
  const brandTo = isSuperAdminUser(user)
    ? '/super-admin/overview'
    : activeRole === 'parent'
      ? '/parent/home'
      : activeRole === 'student'
        ? '/student/home'
        : '/coach/dashboard'

  return (
    <CSidebar
      className="border-end onrep-sidebar-light"
      colorScheme="light"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch(setSidebarShow(visible))
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to={brandTo}>
          <img
            src={primaryLogo}
            alt="OnRep"
            className="sidebar-brand-full onrep-sidebar-brand-primary"
          />
          <img
            src={brandMark}
            alt="OnRep"
            className="sidebar-brand-narrow onrep-sidebar-brand-primary onrep-sidebar-brand-primary--narrow"
          />
        </CSidebarBrand>
        <CCloseButton className="d-lg-none" onClick={() => dispatch(setSidebarShow(false))} />
      </CSidebarHeader>
      <AppSidebarNav items={navigation} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler onClick={() => dispatch(setSidebarUnfoldable(!unfoldable))} />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
