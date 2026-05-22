import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle } from '@coreui/react'
import { switchPerspective } from '../slices/authSlice'
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
  const [switching, setSwitching] = useState(false)
  const roles = user?.roles || []
  const memberships = user?.memberships || []

  const available = roles.length ? roles : memberships.map((m) => m.role)
  if (available.length <= 1) return null

  const active = user?.activeRole || available[0]

  const onSelect = async (role) => {
    if (role === active || switching) return
    setSwitching(true)
    try {
      const result = await dispatch(switchPerspective(role))
      if (switchPerspective.fulfilled.match(result)) {
        const navRole = membershipToNavRole(role)
        navigate(getDefaultRouteForRole(navRole, result.payload.user))
      }
    } finally {
      setSwitching(false)
    }
  }

  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle caret color="secondary" size="sm" disabled={switching}>
        {LABELS[active] || active}
      </CDropdownToggle>
      <CDropdownMenu>
        {available.map((r) => (
          <CDropdownItem key={r} active={r === active} disabled={switching} onClick={() => onSelect(r)}>
            {LABELS[r] || r}
          </CDropdownItem>
        ))}
      </CDropdownMenu>
    </CDropdown>
  )
}

export default PerspectiveSwitcher
