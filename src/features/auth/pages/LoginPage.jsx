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
      const target =
        result.payload?.user?.force_password_change === true ||
        result.payload?.user?.next_action === 'FORCE_PASSWORD_CHANGE'
          ? '/auth/change-password'
          : location.state?.from?.pathname || getRoleRedirectPath(result.payload?.user)
      navigate(target, { replace: true })
    }
  }

  if (isAuthenticated) {
    if (user?.force_password_change === true || user?.next_action === 'FORCE_PASSWORD_CHANGE') {
      return <Navigate to="/auth/change-password" replace />
    }
    return <Navigate to={redirectTo} replace />
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to run schedules, attendance, and athlete progress in one place."
    >
      <>
        <CForm onSubmit={handleSubmit(onSubmit)} noValidate className="onrep-auth-form">
          <div className="onrep-auth-alert-slot mb-3">
            {error?.message ? (
              <CAlert color="danger" className="mb-0">
                {error.message}
              </CAlert>
            ) : null}
          </div>

          <div className="mb-4">
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

          <div className="mb-3">
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
                type="button"
                variant="outline"
                color="light"
                className="onrep-auth-input-addon-btn"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </CButton>
            </CInputGroup>
            {formState.errors.password ? (
              <small className="text-danger d-block mt-1">{formState.errors.password.message}</small>
            ) : null}
          </div>

          <div className="onrep-auth-remember-row d-flex justify-content-between align-items-center flex-wrap gap-2">
            <CFormCheck
              id="remember-me"
              className="mb-0"
              label="Remember me"
              {...register('rememberMe')}
            />
            <Link to="/auth/forgot-password" className="onrep-auth-forgot-link text-decoration-none">
              Forgot password?
            </Link>
          </div>

          <CButton
            color="primary"
            className="w-100 onrep-auth-cta text-white mt-4"
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <CSpinner size="sm" className="me-2" aria-hidden />
                Signing in…
              </>
            ) : (
              'Sign in to OnRep'
            )}
          </CButton>
        </CForm>

        <div className="d-grid gap-2 mt-3">
          <Link
            to="/onboarding/create-academy"
            className="onrep-auth-secondary-cta w-100 text-center text-decoration-none"
          >
            Create Academy
          </Link>
        </div>

        <div className="onrep-auth-social-proof">
          <p>Trusted by coaches and academies across India.</p>
          <p>Built for skating, swimming, martial arts, and performance coaching.</p>
        </div>
      </>
    </AuthShell>
  )
}

export default LoginPage
