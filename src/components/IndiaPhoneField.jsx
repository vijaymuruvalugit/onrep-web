import React from 'react'
import { CFormInput, CFormLabel } from '@coreui/react'
import {
  DEFAULT_INDIA_COUNTRY_CODE,
  normalizeIndiaLocalDigits,
} from '../utils/indiaPhone'

/**
 * India-first phone input: country code shown separately (default +91, read-only for now)
 * and a local 10-digit number field.
 */
export default function IndiaPhoneField({
  id,
  label = 'Phone number',
  value = '',
  onChange,
  countryCode = DEFAULT_INDIA_COUNTRY_CODE,
  invalid = false,
  required = false,
  autoComplete = 'tel-national',
  hint = null,
  errorHint = 'Enter a 10-digit mobile number.',
  className = 'mb-3',
}) {
  return (
    <div className={className}>
      {label ? (
        <CFormLabel htmlFor={id}>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </CFormLabel>
      ) : null}
      <div className="d-flex gap-2 align-items-start">
        <CFormInput
          style={{ maxWidth: '5.25rem', flexShrink: 0 }}
          value={countryCode}
          readOnly
          tabIndex={-1}
          aria-label="Country code"
          className="bg-body-secondary text-center"
        />
        <div className="flex-grow-1">
          <CFormInput
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete={autoComplete}
            value={value}
            onChange={(ev) => onChange?.(normalizeIndiaLocalDigits(ev.target.value))}
            placeholder="9876543210"
            invalid={invalid}
            required={required}
            maxLength={10}
          />
        </div>
      </div>
      {invalid ? (
        <small className="text-danger">{errorHint}</small>
      ) : hint ? (
        <small className="text-body-secondary">{hint}</small>
      ) : null}
    </div>
  )
}
