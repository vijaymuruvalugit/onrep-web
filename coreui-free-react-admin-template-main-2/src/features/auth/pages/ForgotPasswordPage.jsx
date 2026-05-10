import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { CAlert, CButton, CForm, CFormLabel, CFormInput, CSpinner } from '@coreui/react'
import { authApi } from '../api/authApi'
import { forgotPasswordSchema } from '../validations/forgotPasswordSchema'
import AuthShell from '../components/AuthShell'

const ForgotPasswordPage = () => {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values) => {
    setStatus('idle')
    setError('')
    try {
      await authApi.forgotPassword(values)
      setStatus('success')
    } catch (apiError) {
      setStatus('error')
      setError(apiError?.message || 'Unable to send reset instructions')
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We will send secure reset instructions to your registered email."
      badge="ACCOUNT RECOVERY"
    >
      <CForm onSubmit={handleSubmit(onSubmit)} noValidate className="onrep-auth-form">
        {status === 'success' ? (
          <CAlert color="success">If this email exists, reset instructions have been sent.</CAlert>
        ) : null}
        {status === 'error' ? <CAlert color="danger">{error}</CAlert> : null}
        <div className="mb-3">
          <CFormLabel htmlFor="forgot-email">Email</CFormLabel>
          <CFormInput
            id="forgot-email"
            placeholder="name@academy.com"
            invalid={Boolean(errors.email)}
            autoComplete="email"
            {...register('email')}
          />
          {errors.email ? (
            <small className="text-danger d-block mt-1">{errors.email.message}</small>
          ) : null}
        </div>
        <CButton
          type="submit"
          color="primary"
          disabled={isSubmitting}
          className="w-100 onrep-auth-cta"
        >
          {isSubmitting ? <CSpinner size="sm" className="me-2" /> : null}
          Send reset link
        </CButton>
        <Link to="/auth/login" className="btn btn-link px-0 mt-3">
          Back to login
        </Link>
      </CForm>
    </AuthShell>
  )
}

export default ForgotPasswordPage
