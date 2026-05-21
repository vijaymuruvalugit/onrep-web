import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle } from '@coreui/react'
import { patchCurrentUser } from '../slices/authSlice'
import { getDefaultRouteForRole, membershipToNavRole } from '../utils/roleRedirect'

const LABELS = {
  coach: 'Coach',
  academy_admin: 'Academy admin',
  parent: 'Parent',
  student: 'Student',
  super_admin: 'Platform',
}

const PerspectiveSwitcher = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const roles = user?.roles || []
  const memberships = user?.memberships || []

  const available = roles.length ? roles : memberships.map((m) => m.role)
  if (available.length <= 1) return null

  const active = user?.activeRole || available[0]

  const onSelect = (role) => {
    const navRole = membershipToNavRole(role)
    dispatch(
      patchCurrentUser({
        activeRole: role,
        role: navRole,
      }),
    )
    navigate(getDefaultRouteForRole(navRole))
  }

  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle caret color="secondary" size="sm">
        {LABELS[active] || active}
      </CDropdownToggle>
      <CDropdownMenu>
        {available.map((r) => (
          <CDropdownItem key={r} active={r === active} onClick={() => onSelect(r)}>
            {LABELS[r] || r}
          </CDropdownItem>
        ))}
      </CDropdownMenu>
    </CDropdown>
  )
}

export default PerspectiveSwitcher
