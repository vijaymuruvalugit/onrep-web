import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CAlert, CButton, CFormInput, CFormLabel, CSpinner } from '@coreui/react'
import { authApi } from '../api/authApi'
import AuthShell from '../components/AuthShell'

const VerifyEmailPage = () => {
  const [params] = useSearchParams()
  const routeParams = useParams()
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('Verifying your email...')
  const [resending, setResending] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendPassword, setResendPassword] = useState('')

  const token = useMemo(
    () => params.get('token') || params.get('code') || routeParams.token || '',
    [params, routeParams.token],
  )

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setState('failed')
        setMessage(
          'This verification link is missing its token. Request a new email from the login screen.',
        )
        return
      }
      try {
        const response = await authApi.verifyEmail({ token })
        const status = response?.data?.status || 'success'
        if (status === 'already_verified') {
          setState('already')
          setMessage('Your email is already verified.')
        } else {
          setState('success')
          setMessage('Email verified successfully.')
        }
      } catch (error) {
        if (error?.status === 410) {
          setState('expired')
          setMessage('This verification link has expired. Send yourself a new one below.')
        } else if (error?.status === 409) {
          setState('already')
          setMessage('Your email is already verified. You can sign in.')
        } else {
          setState('failed')
          setMessage(
            error?.message || 'We could not verify this link. Try again or request a new email.',
          )
        }
      }
    }
    verify()
  }, [token])

  const resendVerification = async () => {
    const email = resendEmail.trim().toLowerCase()
    if (!email || !resendPassword) {
      setMessage('Enter the email and password you used at signup so we can send a new link.')
      return
    }
    setResending(true)
    try {
      await authApi.resendVerification({ email, password: resendPassword })
      setMessage(
        'If this account exists and still needs verification, we sent a new link to your inbox.',
      )
      setState('expired')
    } catch (error) {
      setMessage(error?.message || 'Unable to send a new link. Try again later.')
    } finally {
      setResending(false)
    }
  }

  const color =
    state === 'success'
      ? 'success'
      : state === 'already'
        ? 'info'
        : state === 'loading'
          ? 'primary'
          : 'danger'

  return (
    <AuthShell
      title="Verifying your email"
      subtitle="We are validating your secure access so you can continue to OnRep."
      badge="EMAIL VERIFICATION"
    >
      <div className="onrep-auth-form">
        <CAlert color={color}>
          {state === 'loading' ? <CSpinner size="sm" className="me-2" /> : null}
          {message}
        </CAlert>
        {state === 'failed' || state === 'expired' ? (
          <div className="mt-3">
            <p className="small text-body-secondary mb-2">
              Enter the email and password for your academy account. We&apos;ll send a fresh
              verification link if the account still needs it.
            </p>
            <div className="mb-2">
              <CFormLabel htmlFor="resend-email">Email</CFormLabel>
              <CFormInput
                id="resend-email"
                type="email"
                autoComplete="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="resend-password">Password</CFormLabel>
              <CFormInput
                id="resend-password"
                type="password"
                autoComplete="current-password"
                value={resendPassword}
                onChange={(e) => setResendPassword(e.target.value)}
              />
            </div>
            <CButton
              color="primary"
              onClick={resendVerification}
              disabled={resending}
              className="onrep-auth-cta"
            >
              {resending ? <CSpinner size="sm" className="me-2" /> : null}
              Send new verification email
            </CButton>
          </div>
        ) : null}
        <div className="mt-3">
          <Link to="/auth/login">Back to login</Link>
        </div>
      </div>
    </AuthShell>
  )
}

export default VerifyEmailPage
