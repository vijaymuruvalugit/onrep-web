import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CAlert,
  CSpinner,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilSettings, cilStar } from '@coreui/icons'
import { authApi } from '../api/authApi'
import { authStorage } from '../../../api/authStorage'
import { patchCurrentUser } from '../slices/authSlice'

const CHOICES = [
  {
    id: 'coach',
    icon: cilPeople,
    label: 'Coach',
    description: 'Run sessions, track athletes, capture observations.',
  },
  {
    id: 'admin',
    icon: cilSettings,
    label: 'Administrator',
    description: 'Manage payments, enrolments, and academy settings.',
  },
  {
    id: 'both',
    icon: cilStar,
    label: 'Both',
    description: 'Full access — coach and admin.',
  },
]

function roleLabel(memberships = []) {
  const roles = memberships.map((m) => m.role)
  if (roles.includes('coach') && roles.includes('academy_admin')) return 'Coach + Administrator'
  if (roles.includes('coach')) return 'Coach'
  if (roles.includes('academy_admin')) return 'Administrator'
  return 'None assigned'
}

export default function AccountSettingsPage() {
  const dispatch = useDispatch()
  const user = useSelector((s) => s.auth.user)
  const [selected, setSelected] = useState('both')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const memberships = user?.memberships || []
  const isOwner = user?.is_legal_owner === true
  const current = roleLabel(memberships)

  const handleSave = async () => {
    setLoading(true)
    setSuccess(false)
    setError(null)
    try {
      const { data } = await authApi.setupOwnerRoles(selected)
      if (data?.token) authStorage.setToken(data.token)
      if (data?.user) dispatch(patchCurrentUser(data.user))
      setSuccess(true)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update roles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4" style={{ maxWidth: 600 }}>
      <h4 className="mb-4">Account Settings</h4>

      <CCard className="mb-4">
        <CCardHeader className="fw-semibold">Your Details</CCardHeader>
        <CCardBody>
          <div className="mb-2">
            <span className="text-medium-emphasis me-2">Name:</span>
            <strong>{user?.name || '—'}</strong>
          </div>
          <div className="mb-2">
            <span className="text-medium-emphasis me-2">Email:</span>
            <strong>{user?.email || '—'}</strong>
          </div>
          <div>
            <span className="text-medium-emphasis me-2">Current role:</span>
            <CBadge color="primary">{current}</CBadge>
            {isOwner && (
              <CBadge color="warning" className="ms-2 text-dark">
                Academy Owner
              </CBadge>
            )}
          </div>
        </CCardBody>
      </CCard>

      {isOwner && (
        <CCard>
          <CCardHeader className="fw-semibold">My Role</CCardHeader>
          <CCardBody>
            <p className="text-medium-emphasis mb-4">
              Choose how you use OnRep day-to-day. This controls which tools appear in your sidebar.
            </p>

            {success && (
              <CAlert color="success" dismissible onClose={() => setSuccess(false)}>
                Role updated successfully.
              </CAlert>
            )}
            {error && (
              <CAlert color="danger" dismissible onClose={() => setError(null)}>
                {error}
              </CAlert>
            )}

            <div className="d-flex flex-column gap-3 mb-4">
              {CHOICES.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setSelected(choice.id)}
                  className="text-start border rounded-3 p-3 d-flex align-items-start gap-3 bg-white"
                  style={{
                    cursor: 'pointer',
                    borderColor:
                      selected === choice.id ? 'var(--cui-primary)' : 'var(--cui-border-color)',
                    boxShadow:
                      selected === choice.id ? '0 0 0 2px var(--cui-primary)' : 'none',
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                  }}
                >
                  <div
                    className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      background:
                        selected === choice.id ? 'var(--cui-primary)' : 'var(--cui-light)',
                    }}
                  >
                    <CIcon
                      icon={choice.icon}
                      size="lg"
                      style={{
                        color: selected === choice.id ? '#fff' : 'var(--cui-body-color)',
                      }}
                    />
                  </div>
                  <div>
                    <div className="fw-semibold">{choice.label}</div>
                    <div className="text-medium-emphasis small mt-1">{choice.description}</div>
                  </div>
                </button>
              ))}
            </div>

            <CButton color="primary" disabled={loading} onClick={handleSave}>
              {loading && <CSpinner size="sm" className="me-2" />}
              Save as {CHOICES.find((c) => c.id === selected)?.label}
            </CButton>
          </CCardBody>
        </CCard>
      )}
    </div>
  )
}
