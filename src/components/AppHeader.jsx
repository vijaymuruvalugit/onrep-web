/**
 * AppHeader — CoreUI header with onRep workspace / perspective controls.
 */

import React, { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu } from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'

import { getRoleRedirectPath } from '../features/auth/utils/roleRedirect'
import { setSidebarShow } from '../features/ui/uiSlice'
import ActivityWorkspaceSwitcher from '../features/workspace/components/ActivityWorkspaceSwitcher'
import { useCoachLikeRole } from '../features/workspace/hooks/useCoachLikeRole'
import PerspectiveSwitcher from '../features/auth/components/PerspectiveSwitcher'

const AppHeader = () => {
  const headerRef = useRef()

  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.ui.sidebarShow)
  const user = useSelector((state) => state.auth.user)
  const coachLike = useCoachLikeRole(user)

  const homeTo = getRoleRedirectPath(user)

  useEffect(() => {
    const handleScroll = () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    }

    document.addEventListener('scroll', handleScroll)
    return () => document.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch(setSidebarShow(!sidebarShow))}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderNav className="d-none d-md-flex align-items-center gap-2">
          <CNavItem>
            <CNavLink to={homeTo} as={NavLink}>
              Home
            </CNavLink>
          </CNavItem>
          <CNavItem className="ms-2 d-flex align-items-center">
            <PerspectiveSwitcher />
          </CNavItem>
          {coachLike ? (
            <CNavItem className="ms-3 d-flex align-items-center">
              <ActivityWorkspaceSwitcher />
            </CNavItem>
          ) : null}
        </CHeaderNav>
        <CHeaderNav className="ms-auto align-items-center gap-1">
          {coachLike ? (
            <CNavItem className="d-flex d-md-none align-items-center me-2">
              <ActivityWorkspaceSwitcher />
            </CNavItem>
          ) : null}
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>
      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
