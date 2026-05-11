import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  CAlert,
  CButton,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'

import { authApi } from '../../auth/api/authApi'
import AuthShell from '../../auth/components/AuthShell'
import normalizeApiError from '../../../api/normalizeApiError'
import { createAcademySchema } from '../validations/createAcademySchema'
import { ACTIVITY_UI_OPTIONS, getDefaultSignupActivityType } from '@onrep/contracts'

const SIGNUP_ACTIVITY_OPTIONS = ACTIVITY_UI_OPTIONS.filter((o) => o.implemented)

/**
 * Canonical academy creation — POST /auth/signup only (no extra persisted fields).
 */
const CreateAcademyPage = () => {
  const [done, setDone] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createAcademySchema),
    defaultValues: {
      academyName: '',
      name: '',
      email: '',
      password: '',
      billing_choice: 'trial',
      discount_code: '',
      activities: [getDefaultSignupActivityType()],
    },
  })

  const billingChoice = useWatch({ control, name: 'billing_choice', defaultValue: 'trial' })

  const onSubmit = async (values) => {
    setSubmitError(null)
    try {
      const body = {
        email: values.email.trim(),
        password: values.password,
        name: values.name.trim(),
        academyName: values.academyName.trim(),
        billing_choice: values.billing_choice,
        activities: values.activities || [],
      }
      if (values.discount_code?.trim()) {
        body.discount_code = values.discount_code.trim()
      }
      const { data } = await authApi.signup(body)
      const needsVerify =
        data?.needs_email_verification === true || data?.needsEmailVerification === true
      // NOTE: deliberately NOT capturing `payment_url` here.
      //
      // Funnel doctrine (CONTEXT/05): post-signup MUST be
      //   signup → verify email → login → SubscriptionGuard
      // The guard sends `billing_choice === 'subscribe'` owners with
      // `can_access_app === false` straight to `/subscription/paywall`.
      // A separate "Continue to payment" CTA here would create a parallel
      // funnel that drifts from the canonical one. If signup still returns
      // `payment_url` in the API for back-compat, we ignore it.
      setDone({
        needsVerify,
        billingChoice: data?.billing_choice || values.billing_choice,
      })
    } catch (e) {
      const n = normalizeApiError(e)
      setSubmitError(n.message || 'Could not create academy.')
    }
  }

  if (done) {
    return (
      <AuthShell
        title={done.needsVerify ? 'Check your email' : 'Account created'}
        subtitle={
          done.needsVerify
            ? 'We sent a verification link. Confirm your email, then sign in to continue.'
            : 'You can sign in to continue.'
        }
      >
        <CAlert color={done.needsVerify ? 'info' : 'success'}>
          {done.needsVerify
            ? 'Open the email we sent and tap verify. Once verified, sign in — if you chose Subscribe, we’ll take you straight to the payment page.'
            : 'Your academy is ready. Sign in to continue.'}
        </CAlert>
        <CButton color="primary" className="w-100 mb-2" as={Link} to="/auth/login">
          Go to login
        </CButton>
        <div className="text-center small">
          <Link to="/onboarding">Back to onboarding home</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your academy"
      subtitle="One account for you as owner. You can invite coaches after you sign in."
    >
      <CForm onSubmit={handleSubmit(onSubmit)} noValidate className="onrep-auth-form">
        {submitError ? <CAlert color="danger">{submitError}</CAlert> : null}

        <div className="mb-3">
          <CFormLabel htmlFor="academyName">Academy name</CFormLabel>
          <CFormInput
            id="academyName"
            invalid={Boolean(errors.academyName)}
            {...register('academyName')}
          />
          {errors.academyName ? (
            <div className="small text-danger mt-1">{errors.academyName.message}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <CFormLabel htmlFor="ownerName">Your name</CFormLabel>
          <CFormInput id="ownerName" invalid={Boolean(errors.name)} {...register('name')} />
          {errors.name ? <div className="small text-danger mt-1">{errors.name.message}</div> : null}
        </div>

        <div className="mb-3">
          <CFormLabel htmlFor="signup-email">Email</CFormLabel>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilUser} />
            </CInputGroupText>
            <CFormInput
              id="signup-email"
              type="email"
              autoComplete="email"
              invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </CInputGroup>
          {errors.email ? (
            <div className="small text-danger mt-1">{errors.email.message}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <CFormLabel htmlFor="signup-password">Password</CFormLabel>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilLockLocked} />
            </CInputGroupText>
            <CFormInput
              id="signup-password"
              type="password"
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </CInputGroup>
          {errors.password ? (
            <div className="small text-danger mt-1">{errors.password.message}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <CFormLabel htmlFor="billing">Platform billing</CFormLabel>
          <CFormSelect
            id="billing"
            invalid={Boolean(errors.billing_choice)}
            {...register('billing_choice')}
          >
            <option value="trial">Start with trial</option>
            <option value="subscribe">Subscribe now</option>
          </CFormSelect>
          <div className="small text-body-secondary mt-1">
            Trial lets you explore; subscribe when you are ready (payment flow may open after email
            verification).
          </div>
          {errors.billing_choice ? (
            <div className="small text-danger mt-1">{errors.billing_choice.message}</div>
          ) : null}
        </div>

        {billingChoice === 'subscribe' ? (
          <div className="mb-3">
            <CFormLabel htmlFor="discount">Discount code (optional)</CFormLabel>
            <CFormInput
              id="discount"
              {...register('discount_code')}
              placeholder="If you have one"
            />
          </div>
        ) : null}

        <div className="mb-3">
          <CFormLabel>Activities</CFormLabel>
          <Controller
            name="activities"
            control={control}
            render={({ field }) => (
              <div className="d-flex flex-column gap-2">
                {SIGNUP_ACTIVITY_OPTIONS.map((opt) => (
                  <CFormCheck
                    key={opt.type}
                    id={`act-${opt.type}`}
                    label={`${opt.icon ? `${opt.icon} ` : ''}${opt.label}`}
                    checked={Boolean(field.value?.includes(opt.type))}
                    onChange={(e) => {
                      const next = new Set(field.value || [])
                      if (e.target.checked) next.add(opt.type)
                      else next.delete(opt.type)
                      if (next.size === 0) next.add(getDefaultSignupActivityType())
                      field.onChange([...next])
                    }}
                  />
                ))}
              </div>
            )}
          />
          {errors.activities ? (
            <div className="small text-danger mt-1">{errors.activities.message}</div>
          ) : (
            <div className="small text-body-secondary mt-1">
              Platform-defined activities only — pick what you run today (more types ship over
              time).
            </div>
          )}
        </div>

        <CButton color="primary" className="w-100 mb-2" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <CSpinner size="sm" /> : null}
          {isSubmitting ? ' Creating…' : ' Create academy'}
        </CButton>
        <div className="text-center">
          <Link to="/auth/login">Already registered? Sign in</Link>
        </div>
      </CForm>
    </AuthShell>
  )
}

export default CreateAcademyPage
