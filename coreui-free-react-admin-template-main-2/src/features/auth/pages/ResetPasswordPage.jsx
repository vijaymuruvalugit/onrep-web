import React, { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { CAlert, CButton, CForm, CFormLabel, CFormInput, CSpinner } from '@coreui/react'
import { authApi } from '../api/authApi'
import { resetPasswordSchema } from '../validations/resetPasswordSchema'
import AuthShell from '../components/AuthShell'

const ResetPasswordPage = () => {
  const [params] = useSearchParams()
  const routeParams = useParams()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const token = useMemo(
    () => params.get('token') || params.get('code') || routeParams.token || '',
    [params, routeParams.token],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    setStatus('idle')
    setError('')
    try {
      await authApi.resetPassword({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
      setStatus('success')
    } catch (apiError) {
      setStatus('error')
      setError(apiError?.message || 'Unable to reset password')
    }
  }

  return (
    <AuthShell
      title="Create a new password"
      subtitle="Use a strong password to keep your athlete and academy data secure."
      badge="PASSWORD RESET"
    >
      {!token ? (
        <CAlert color="warning">Reset link is invalid or expired.</CAlert>
      ) : (
        <CForm onSubmit={handleSubmit(onSubmit)} noValidate className="onrep-auth-form">
          {status === 'success' ? (
            <CAlert color="success">
              Password reset successful. You can now sign in with your new password.
            </CAlert>
          ) : null}
          {status === 'error' ? <CAlert color="danger">{error}</CAlert> : null}
          <div className="mb-3">
            <CFormLabel htmlFor="reset-password">New password</CFormLabel>
            <CFormInput
              id="reset-password"
              type="password"
              placeholder="Enter new password"
              invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password ? (
              <small className="text-danger d-block mt-1">{errors.password.message}</small>
            ) : null}
          </div>
          <div className="mb-3">
            <CFormLabel htmlFor="reset-confirm-password">Confirm password</CFormLabel>
            <CFormInput
              id="reset-confirm-password"
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
            Reset password
          </CButton>
        </CForm>
      )}
      <Link to="/auth/login" className="btn btn-link px-0 mt-3">
        Go to login
      </Link>
    </AuthShell>
  )
}

export default ResetPasswordPage
