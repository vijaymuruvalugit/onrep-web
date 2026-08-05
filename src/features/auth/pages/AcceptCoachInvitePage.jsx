import React, { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useDispatch, useSelector } from 'react-redux'
import { CAlert, CButton, CForm, CFormLabel, CFormInput, CSpinner } from '@coreui/react'
import { completeCoachInvite } from '../slices/authSlice'
import { resetPasswordSchema } from '../validations/resetPasswordSchema'
import { getRoleRedirectPath } from '../utils/roleRedirect'
import AuthShell from '../components/AuthShell'
import { readStrandedAuthToken } from '../../../utils/restorePublicHashRoute'

function inviteErrorMessage(payload) {
  const code = payload?.code || payload?.error || payload?.message
  if (code === 'INVITE_EXPIRED') return 'This invite has expired. Ask your academy owner to resend it.'
  if (code === 'INVALID_INVITE') return 'This invite link is invalid or already used.'
  return payload?.message || 'Unable to accept this invite'
}

const AcceptCoachInvitePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const routeParams = useParams()
  const [error, setError] = useState('')
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)
  const user = useSelector((s) => s.auth.user)

  const token = useMemo(() => {
    const fromHash =
      params.get('token') || params.get('code') || routeParams.token || ''
    if (fromHash) return fromHash
    return readStrandedAuthToken()
  }, [params, routeParams.token])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    setError('')
    const result = await dispatch(
      completeCoachInvite({ token, password: values.password }),
    )
    if (result?.meta?.requestStatus === 'fulfilled') {
      navigate(getRoleRedirectPath(result.payload?.user), { replace: true })
      return
    }
    setError(inviteErrorMessage(result?.payload))
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleRedirectPath(user)} replace />
  }

  return (
    <AuthShell
      title="Join your academy"
      subtitle="Use the OnRep mobile app with your invited phone number (OTP). Set a password here only if you also need web access."
      badge="COACH INVITE"
    >
      <CAlert color="info" className="mb-3">
        Day-to-day coaching is on the <strong>mobile app</strong>: install OnRep → Sign in with phone → use the
        number from your invite email. This page is optional for web/admin password access.
      </CAlert>
      {!token ? (
        <CAlert color="warning">
          This invite link is missing its token. Ask your academy owner to resend the invite.
        </CAlert>
      ) : (
        <CForm onSubmit={handleSubmit(onSubmit)} noValidate className="onrep-auth-form">
          {error ? <CAlert color="danger">{error}</CAlert> : null}
          <div className="mb-3">
            <CFormLabel htmlFor="invite-password">Password (web access)</CFormLabel>
            <CFormInput
              id="invite-password"
              type="password"
              placeholder="Choose a password (min 8 characters)"
              invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password ? (
              <small className="text-danger d-block mt-1">{errors.password.message}</small>
            ) : null}
          </div>
          <div className="mb-3">
            <CFormLabel htmlFor="invite-confirm-password">Confirm password</CFormLabel>
            <CFormInput
              id="invite-confirm-password"
              type="password"
              placeholder="Confirm your password"
              invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <small className="text-danger d-block mt-1">{errors.confirmPassword.message}</small>
            ) : null}
          </div>
          <CButton
            type="submit"
            color="primary"
            disabled={isSubmitting}
            className="w-100 onrep-auth-cta"
          >
            {isSubmitting ? <CSpinner size="sm" className="me-2" /> : null}
            Set password &amp; continue on web
          </CButton>
        </CForm>
      )}
      <Link to="/auth/login" className="btn btn-link px-0 mt-3">
        Already have an account? Sign in
      </Link>
    </AuthShell>
  )
}

export default AcceptCoachInvitePage
