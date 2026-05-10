import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CAlert, CButton, CSpinner } from '@coreui/react'
import { authApi } from '../api/authApi'
import AuthShell from '../components/AuthShell'

const VerifyEmailPage = () => {
  const [params] = useSearchParams()
  const routeParams = useParams()
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('Verifying your email...')
  const [resending, setResending] = useState(false)

  const token = useMemo(
    () => params.get('token') || params.get('code') || routeParams.token || '',
    [params, routeParams.token],
  )

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setState('failed')
        setMessage('Verification token is missing.')
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
          setMessage('Verification link expired.')
        } else if (error?.status === 409) {
          setState('already')
          setMessage('Your email is already verified.')
        } else {
          setState('failed')
          setMessage(error?.message || 'Unable to verify email.')
        }
      }
    }
    verify()
  }, [token])

  const resendVerification = async () => {
    setResending(true)
    try {
      await authApi.resendVerification({ token })
      setMessage('A new verification link has been sent.')
    } catch (error) {
      setMessage(error?.message || 'Unable to resend verification link.')
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
      <CAlert color={color}>
        {state === 'loading' ? <CSpinner size="sm" className="me-2" /> : null}
        {message}
      </CAlert>
      {(state === 'failed' || state === 'expired') && token ? (
        <CButton
          color="primary"
          onClick={resendVerification}
          disabled={resending}
          className="onrep-auth-cta"
        >
          {resending ? <CSpinner size="sm" className="me-2" /> : null}
          Resend verification
        </CButton>
      ) : null}
      <div className="mt-3">
        <Link to="/auth/login">Back to login</Link>
      </div>
    </AuthShell>
  )
}

export default VerifyEmailPage
