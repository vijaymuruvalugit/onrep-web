import React, { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useDispatch, useSelector } from 'react-redux'
import { CAlert, CButton, CForm, CFormLabel, CFormInput, CSpinner } from '@coreui/react'
import { authApi } from '../api/authApi'
import { completeParentInvite } from '../slices/authSlice'
import {
  parentInviteAcceptSchema,
  parentInvitePasswordAndNameSchema,
  parentInvitePasswordOnlySchema,
  parentInviteLinkAccountSchema,
} from '../validations/parentInviteAcceptSchema'
import { getRoleRedirectPath } from '../utils/roleRedirect'
import AuthShell from '../components/AuthShell'

function parentInviteErrorMessage(payload, isExistingAccount = false) {
  const code = payload?.code || payload?.error || payload?.message
  if (code === 'INVITE_EXPIRED') return 'This invite has expired. Ask the academy to send a new one.'
  if (code === 'INVITE_ALREADY_USED') return 'This invite was already used. Sign in with your account.'
  if (code === 'INVITE_REVOKED') return 'This invite is no longer valid.'
  if (code === 'EMAIL_ALREADY_EXISTS') return 'That email is already registered with a different role.'
  if (code === 'EMAIL_MISMATCH') return 'This invite is tied to a different email address.'
  if (isExistingAccount && (payload?.status === 401 || payload?.statusCode === 401))
    return 'Incorrect password. Enter the password for your existing parent account.'
  return payload?.message || 'Unable to accept this invite'
}

export function resolveInviteProfile(preview) {
  const inviteeEmail =
    preview?.inviteeEmail || preview?.parentEmail || preview?.inviteEmail || null
  const inviteeName = preview?.inviteeName || null
  const inviteePhone = preview?.inviteePhone || null
  return {
    inviteeEmail: inviteeEmail ? String(inviteeEmail).trim().toLowerCase() : '',
    inviteeName: inviteeName ? String(inviteeName).trim() : '',
    inviteePhone: inviteePhone ? String(inviteePhone).trim() : '',
  }
}

function ParentInviteAcceptForm({ code, inviteeEmail, inviteeName, isExistingAccount, onError }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const lockedEmail = Boolean(inviteeEmail)
  const lockedName = Boolean(inviteeName)

  const formSchema = useMemo(() => {
    if (isExistingAccount) return parentInviteLinkAccountSchema
    if (lockedEmail && lockedName) return parentInvitePasswordOnlySchema
    if (lockedEmail) return parentInvitePasswordAndNameSchema
    return parentInviteAcceptSchema
  }, [isExistingAccount, lockedEmail, lockedName])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(formSchema),
    defaultValues: {
      name: inviteeName,
      email: inviteeEmail,
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    onError('')
    const result = await dispatch(
      completeParentInvite({
        code,
        name: (inviteeName || values.name || '').trim(),
        email: (inviteeEmail || values.email || '').trim().toLowerCase(),
        password: values.password,
      }),
    )
    if (result?.meta?.requestStatus === 'fulfilled') {
      navigate(getRoleRedirectPath(result.payload?.user), { replace: true })
      return
    }
    onError(parentInviteErrorMessage(result?.payload, isExistingAccount))
  }

  if (isExistingAccount) {
    return (
      <CForm onSubmit={handleSubmit(onSubmit)} noValidate className="onrep-auth-form">
        <div className="mb-3 rounded border bg-light px-3 py-2 small">
          <span className="text-body-secondary">Email</span>
          <div className="fw-semibold">{inviteeEmail}</div>
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="parent-invite-password">Your existing password</CFormLabel>
          <CFormInput
            id="parent-invite-password"
            type="password"
            placeholder="Enter your existing password"
            autoComplete="current-password"
            invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? (
            <small className="text-danger d-block mt-1">{errors.password.message}</small>
          ) : null}
        </div>
        <CButton type="submit" color="primary" disabled={isSubmitting} className="w-100 onrep-auth-cta">
          {isSubmitting ? <CSpinner size="sm" className="me-2" /> : null}
          Link my account &amp; sign in
        </CButton>
      </CForm>
    )
  }

  return (
    <CForm onSubmit={handleSubmit(onSubmit)} noValidate className="onrep-auth-form">
      {lockedEmail || lockedName ? (
        <ParentInviteProfileSummary
          inviteeName={inviteeName}
          inviteeEmail={inviteeEmail}
          lockedName={lockedName}
          lockedEmail={lockedEmail}
        />
      ) : null}
      {!lockedName ? (
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
      ) : null}
      {!lockedEmail ? (
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
      ) : null}
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
      <CButton type="submit" color="primary" disabled={isSubmitting} className="w-100 onrep-auth-cta">
        {isSubmitting ? <CSpinner size="sm" className="me-2" /> : null}
        Create account &amp; sign in
      </CButton>
    </CForm>
  )
}

function ParentInviteProfileSummary({ inviteeName, inviteeEmail, lockedName, lockedEmail }) {
  return (
    <div className="mb-3 rounded border bg-light px-3 py-2 small">
      {lockedName ? (
        <div>
          <span className="text-body-secondary">Name</span>
          <div className="fw-semibold">{inviteeName}</div>
        </div>
      ) : null}
      {lockedEmail ? (
        <div className={lockedName ? 'mt-2' : ''}>
          <span className="text-body-secondary">Email</span>
          <div className="fw-semibold">{inviteeEmail}</div>
        </div>
      ) : null}
    </div>
  )
}

const AcceptParentInvitePage = () => {
  const [params] = useSearchParams()
  const [preview, setPreview] = useState(null)
  const [previewState, setPreviewState] = useState('loading')
  const [error, setError] = useState('')
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)
  const user = useSelector((s) => s.auth.user)

  const code = useMemo(() => String(params.get('code') || '').trim().toUpperCase(), [params])
  const profile = useMemo(() => resolveInviteProfile(preview), [preview])

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

  if (isAuthenticated) {
    return <Navigate to={getRoleRedirectPath(user)} replace />
  }

  const isExistingAccount = Boolean(preview?.existingAccount)

  const subtitle = isExistingAccount && preview?.studentName && preview?.academyName
    ? `You already have a parent account. Enter your password to link ${preview.studentName} at ${preview.academyName}.`
    : preview?.studentName && preview?.academyName
      ? `Follow ${preview.studentName} at ${preview.academyName}. Prefer the mobile app with phone OTP; web password is optional.`
      : 'Prefer the OnRep mobile app with phone OTP. Web password signup is optional.'

  const formKey = `${profile.inviteeEmail}|${profile.inviteeName}|${isExistingAccount}`

  return (
    <AuthShell title="Parent invite" subtitle={subtitle} badge="PARENT INVITE">
      <CAlert color="info" className="mb-3">
        {profile.inviteePhone ? (
          <>
            Install OnRep and sign in with phone OTP using <strong>{profile.inviteePhone}</strong>. That activates
            parent access without a password.
          </>
        ) : (
          <>
            Install OnRep and sign in with the phone number from your invite email (OTP). That is the primary way to
            access the parent app.
          </>
        )}
      </CAlert>
      {!code ? (
        <CAlert color="warning">This invite link is missing its code.</CAlert>
      ) : previewState === 'loading' ? (
        <div className="text-center py-3">
          <CSpinner color="primary" />
        </div>
      ) : previewState === 'failed' && !preview ? (
        <CAlert color="danger">{error || 'This invite link is invalid or expired.'}</CAlert>
      ) : (
        <>
          {error ? <CAlert color="danger" className="mb-3">{error}</CAlert> : null}
          <p className="small text-body-secondary mb-2">Optional — create a web password below if you need it.</p>
          <ParentInviteAcceptForm
            key={formKey}
            code={code}
            inviteeEmail={profile.inviteeEmail}
            inviteeName={profile.inviteeName}
            isExistingAccount={isExistingAccount}
            onError={setError}
          />
        </>
      )}
      <Link to="/auth/login" className="btn btn-link px-0 mt-3">
        Already have an account? Sign in
      </Link>
    </AuthShell>
  )
}

export default AcceptParentInvitePage
