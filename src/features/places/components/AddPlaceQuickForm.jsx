import React, { useState } from 'react'
import { CAlert, CButton, CFormInput, CFormLabel, CSpinner } from '@coreui/react'

/**
 * Minimal inline form to add a venue without leaving the current screen.
 * @param {{ onSubmit: (payload: { name: string, address?: string }) => Promise<void>, onCancel?: () => void, saving?: boolean, error?: string|null }} props
 */
export default function AddPlaceQuickForm({ onSubmit, onCancel, saving = false, error = null }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [localError, setLocalError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setLocalError('Venue name is required.')
      return
    }
    setLocalError(null)
    try {
      await onSubmit({
        name: trimmed,
        address: address.trim() || undefined,
      })
      setName('')
      setAddress('')
    } catch (err) {
      setLocalError(err?.message || 'Could not save venue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-3 bg-body-tertiary">
      {(error || localError) && (
        <CAlert color="danger" className="py-2 small mb-2">
          {error || localError}
        </CAlert>
      )}
      <CFormLabel htmlFor="quick-place-name" className="small mb-1">
        Venue name
      </CFormLabel>
      <CFormInput
        id="quick-place-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Main rink"
        disabled={saving}
        autoFocus
        className="mb-2"
      />
      <CFormLabel htmlFor="quick-place-address" className="small mb-1">
        Address <span className="text-body-secondary">(optional)</span>
      </CFormLabel>
      <CFormInput
        id="quick-place-address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Street, city"
        disabled={saving}
        className="mb-3"
      />
      <div className="d-flex flex-wrap gap-2 justify-content-end">
        {onCancel ? (
          <CButton type="button" color="secondary" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </CButton>
        ) : null}
        <CButton type="submit" color="primary" size="sm" disabled={saving}>
          {saving ? (
            <>
              <CSpinner size="sm" className="me-1" /> Saving…
            </>
          ) : (
            'Save venue'
          )}
        </CButton>
      </div>
    </form>
  )
}
