import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { CAlert, CButton, CForm, CFormInput, CFormLabel, CSpinner } from '@coreui/react'
import { authApi } from '../api/authApi'
import { patchCurrentUser } from '../slices/authSlice'
import { getRoleRedirectPath } from '../utils/roleRedirect'
import AuthShell from '../components/AuthShell'

export default function ChangePasswordPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      dispatch(patchCurrentUser({ force_password_change: false, next_action: 'NONE' }))
      navigate(
        getRoleRedirectPath({ ...user, force_password_change: false, next_action: 'NONE' }),
        { replace: true },
      )
    } catch (e) {
      setError(e?.message || 'Unable to change password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Change your password"
      subtitle="This Super Admin account was issued with a temporary password."
      badge="REQUIRED"
    >
      <CForm onSubmit={onSubmit} noValidate className="onrep-auth-form">
        {error ? <CAlert color="danger">{error}</CAlert> : null}
        <div className="mb-3">
          <CFormLabel htmlFor="current-password">Temporary password</CFormLabel>
          <CFormInput
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="new-password">New password</CFormLabel>
          <CFormInput
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="confirm-password">Confirm new password</CFormLabel>
          <CFormInput
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <CButton type="submit" color="primary" className="w-100 onrep-auth-cta" disabled={busy}>
          {busy ? <CSpinner size="sm" className="me-2" /> : null}
          Change password
        </CButton>
      </CForm>
    </AuthShell>
  )
}
