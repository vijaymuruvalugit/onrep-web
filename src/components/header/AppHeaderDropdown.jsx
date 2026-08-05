import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilAccountLogout } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import { logout } from '../../features/auth/slices/authSlice'

function initialsFromUser(user) {
  const name = String(user?.name || '').trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  const email = String(user?.email || '').trim()
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

const AppHeaderDropdown = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  const initials = useMemo(() => initialsFromUser(user), [user])
  const email = user?.email || null
  const phone = user?.phone_number || user?.phone || null

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/auth/login', { replace: true })
  }

  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar color="primary" textColor="white" size="md" title={user?.name || email || 'Account'}>
          {initials}
        </CAvatar>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" style={{ minWidth: '16rem' }}>
        <div className="px-3 py-3">
          <div className="small text-body-secondary mb-1">Email</div>
          <div className="fw-semibold text-break">{email || '—'}</div>
          <div className="small text-body-secondary mt-2 mb-1">Phone</div>
          <div className="fw-semibold text-break">{phone || '—'}</div>
        </div>
        <CDropdownDivider className="m-0" />
        <CDropdownItem as="button" type="button" onClick={handleLogout} className="py-2">
          <CIcon icon={cilAccountLogout} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
