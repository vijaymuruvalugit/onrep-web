import React, { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  CAlert,
  CButton,
  CForm,
  CFormCheck,
  CFormLabel,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { useAuth } from '../hooks/useAuth'
import { loginSchema } from '../validations/loginSchema'
import { getRoleRedirectPath } from '../utils/roleRedirect'
import AuthShell from '../components/AuthShell'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, error, isAuthenticated, user } = useAuth()

  const redirectTo = useMemo(() => {
    if (location.state?.from?.pathname) return location.state.from.pathname
    return getRoleRedirectPath(user)
  }, [location.state, user])

  const { register, handleSubmit, formState } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  })

  const submitting = loading || formState.isSubmitting

  const onSubmit = async (values) => {
    const result = await login(values)
    if (result?.meta?.requestStatus === 'fulfilled') {
      const target = location.state?.from?.pathname || getRoleRedirectPath(result.payload?.user)
      navigate(target, { replace: true })
    }
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <AuthShell title="Welcome back">
      <CForm onSubmit={handleSubmit(onSubmit)} noValidate className="onrep-auth-form">
        {error?.message ? <CAlert color="danger">{error.message}</CAlert> : null}
        <div className="mb-3">
          <CFormLabel htmlFor="login-email">Email</CFormLabel>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilUser} />
            </CInputGroupText>
            <CFormInput
              id="login-email"
              placeholder="name@academy.com"
              autoComplete="username"
              invalid={Boolean(formState.errors.email)}
              {...register('email')}
            />
          </CInputGroup>
          {formState.errors.email ? (
            <small className="text-danger d-block mt-1">{formState.errors.email.message}</small>
          ) : null}
        </div>

        <div className="mb-2">
          <CFormLabel htmlFor="login-password">Password</CFormLabel>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilLockLocked} />
            </CInputGroupText>
            <CFormInput
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              invalid={Boolean(formState.errors.password)}
              {...register('password')}
            />
            <CButton
              color="light"
              variant="outline"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </CButton>
          </CInputGroup>
          {formState.errors.password ? (
            <small className="text-danger d-block mt-1">{formState.errors.password.message}</small>
          ) : null}
        </div>

        <div className="d-flex justify-content-between align-items-center my-3">
          <CFormCheck id="remember-me" label="Remember me" {...register('rememberMe')} />
          <Link to="/auth/forgot-password" className="text-decoration-none fw-semibold">
            Forgot password?
          </Link>
        </div>

        <CButton
          color="primary"
          className="w-100 onrep-auth-cta"
          type="submit"
          disabled={submitting}
        >
          {submitting ? <CSpinner size="sm" className="me-2" /> : null}
          Sign in to OnRep
        </CButton>
      </CForm>
    </AuthShell>
  )
}

export default LoginPage
