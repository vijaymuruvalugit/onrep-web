import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ExpiryOptions = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days (default)' },
  { value: 30, label: '30 days' },
]

/**
 * Inner form is mounted only while the modal is visible. This avoids the
 * set-state-in-effect pattern (we don't need an effect to clear fields when
 * the modal opens — a fresh mount gives fresh state).
 */
const E164_RE = /^\+[1-9]\d{6,14}$/

const InviteParentForm = ({ studentName, submitting, error, onCancel, onSubmit }) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(14)
  const [touched, setTouched] = useState(false)

  const trimmedEmail = email.trim().toLowerCase()
  const trimmedName = name.trim()
  const trimmedPhone = phone.trim()
  const emailValid = EMAIL_RE.test(trimmedEmail)
  const phoneValid = !trimmedPhone || E164_RE.test(trimmedPhone)
  const canSubmit = emailValid && phoneValid && !submitting

  const handleSubmit = (event) => {
    event.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    onSubmit({
      email: trimmedEmail,
      name: trimmedName,
      expiresInDays,
      phoneNumber: trimmedPhone || undefined,
    })
  }

  return (
    <CForm onSubmit={handleSubmit}>
      <CModalBody>
        <p className="text-body-secondary small mb-3">
          Invite a parent or guardian for <strong>{studentName}</strong>. They&rsquo;ll receive a
          link to create an account and see this child&rsquo;s payments, attendance, and updates.
        </p>

        {error?.message ? (
          <CAlert color="danger" className="py-2">
            {error.message}
          </CAlert>
        ) : null}

        <div className="mb-3">
          <CFormLabel htmlFor="invite-parent-email">Email</CFormLabel>
          <CFormInput
            id="invite-parent-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="parent@example.com"
            invalid={touched && !emailValid}
            required
          />
          {touched && !emailValid ? (
            <small className="text-danger">Enter a valid email address.</small>
          ) : null}
        </div>

        <div className="mb-3">
          <CFormLabel htmlFor="invite-parent-name">Name (optional)</CFormLabel>
          <CFormInput
            id="invite-parent-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            placeholder="e.g. Priya Sharma"
            maxLength={120}
          />
          <small className="text-body-secondary">
            Helps you tell multiple parents apart on this student.
          </small>
        </div>

        <div className="mb-3">
          <CFormLabel htmlFor="invite-parent-phone">
            Phone number <span className="text-body-secondary fw-normal">(optional — for phone sign in)</span>
          </CFormLabel>
          <CFormInput
            id="invite-parent-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(ev) => setPhone(ev.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="+919876543210"
            invalid={touched && !phoneValid}
          />
          {touched && !phoneValid ? (
            <small className="text-danger">Include country code, e.g. +919876543210</small>
          ) : (
            <small className="text-body-secondary">
              Lets the parent sign in with OTP instead of a password.
            </small>
          )}
        </div>

        <div className="mb-1">
          <CFormLabel htmlFor="invite-parent-expiry">Invite expires after</CFormLabel>
          <CFormSelect
            id="invite-parent-expiry"
            value={expiresInDays}
            onChange={(ev) => setExpiresInDays(Number(ev.target.value))}
          >
            {ExpiryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </CFormSelect>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="light" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </CButton>
        <CButton type="submit" color="primary" disabled={!canSubmit}>
          {submitting ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Sending…
            </>
          ) : (
            'Send invite'
          )}
        </CButton>
      </CModalFooter>
    </CForm>
  )
}

const InviteParentModal = ({ visible, studentName, submitting, error, onClose, onSubmit }) => {
  return (
    <CModal visible={visible} onClose={onClose} backdrop="static" alignment="center">
      <CModalHeader>
        <CModalTitle>Invite parent</CModalTitle>
      </CModalHeader>
      {visible ? (
        <InviteParentForm
          studentName={studentName || 'this student'}
          submitting={submitting}
          error={error}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </CModal>
  )
}

export default InviteParentModal
