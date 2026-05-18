import React, { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useDispatch, useSelector } from 'react-redux'
import { CAlert, CButton, CForm, CFormLabel, CFormInput, CSpinner } from '@coreui/react'
import { authApi } from '../api/authApi'
import { completeParentInvite } from '../slices/authSlice'
import { parentInviteAcceptSchema } from '../validations/parentInviteAcceptSchema'
import { getRoleRedirectPath } from '../utils/roleRedirect'
import AuthShell from '../components/AuthShell'

function parentInviteErrorMessage(payload) {
  const code = payload?.code || payload?.error || payload?.message
  if (code === 'INVITE_EXPIRED') return 'This invite has expired. Ask the academy to send a new one.'
  if (code === 'INVITE_ALREADY_USED') return 'This invite was already used. Sign in with your account.'
  if (code === 'INVITE_REVOKED') return 'This invite is no longer valid.'
  if (code === 'EMAIL_ALREADY_EXISTS') return 'That email is already registered with a different role.'
  return payload?.message || 'Unable to accept this invite'
}

const AcceptParentInvitePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [preview, setPreview] = useState(null)
  const [previewState, setPreviewState] = useState('loading')
  const [error, setError] = useState('')
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)
  const user = useSelector((s) => s.auth.user)

  const code = useMemo(() => String(params.get('code') || '').trim().toUpperCase(), [params])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(parentInviteAcceptSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!code) {
      setPreviewState('invalid')
      return
    }
    let cancelled = false
    const load = async () => {
      setPreviewState('loading')
      try {
        const { data } = await authApi.parentInvitePreview(code)
        if (cancelled) return
        setPreview(data)
        setPreviewState('ready')
      } catch (apiError) {
        if (cancelled) return
        setPreviewState('failed')
        setError(parentInviteErrorMessage(apiError))
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [code])

  const onSubmit = async (values) => {
    setError('')
    const result = await dispatch(
      completeParentInvite({
        code,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }),
    )
    if (result?.meta?.requestStatus === 'fulfilled') {
      navigate(getRoleRedirectPath(result.payload?.user), { replace: true })
      return
    }
    setError(parentInviteErrorMessage(result?.payload))
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleRedirectPath(user)} replace />
  }

  const subtitle =
    preview?.studentName && preview?.academyName
      ? `Create your parent account to follow ${preview.studentName} at ${preview.academyName}.`
      : 'Create your parent account to view schedules, attendance, and progress.'

  return (
    <AuthShell title="Parent invite" subtitle={subtitle} badge="PARENT INVITE">
      {!code ? (
        <CAlert color="warning">This invite link is missing its code.</CAlert>
      ) : previewState === 'loading' ? (
        <div className="text-center py-3">
          <CSpinner color="primary" />
        </div>
      ) : previewState === 'failed' && !preview ? (
        <CAlert color="danger">{error || 'This invite link is invalid or expired.'}</CAlert>
      ) : (
        <CForm onSubmit={handleSubmit(onSubmit)} noValidate className="onrep-auth-form">
          {error ? <CAlert color="danger">{error}</CAlert> : null}
          <div className="mb-3">
            <CFormLabel htmlFor="parent-invite-name">Your name</CFormLabel>
            <CFormInput
              id="parent-invite-name"
              placeholder="Full name"
              invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name ? (
              <small className="text-danger d-block mt-1">{errors.name.message}</small>
            ) : null}
          </div>
          <div className="mb-3">
            <CFormLabel htmlFor="parent-invite-email">Email</CFormLabel>
            <CFormInput
              id="parent-invite-email"
              type="email"
              placeholder="name@email.com"
              autoComplete="email"
              invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email ? (
              <small className="text-danger d-block mt-1">{errors.email.message}</small>
            ) : null}
          </div>
          <div className="mb-3">
            <CFormLabel htmlFor="parent-invite-password">Password</CFormLabel>
            <CFormInput
              id="parent-invite-password"
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
            <CFormLabel htmlFor="parent-invite-confirm">Confirm password</CFormLabel>
            <CFormInput
              id="parent-invite-confirm"
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
            disabled={isSubmitting || previewState !== 'ready'}
            className="w-100 onrep-auth-cta"
          >
            {isSubmitting ? <CSpinner size="sm" className="me-2" /> : null}
            Create account &amp; sign in
          </CButton>
        </CForm>
      )}
      <Link to="/auth/login" className="btn btn-link px-0 mt-3">
        Already have an account? Sign in
      </Link>
    </AuthShell>
  )
}

export default AcceptParentInvitePage
