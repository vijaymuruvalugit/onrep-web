import React, { useState, useEffect } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CForm, CFormLabel, CFormInput, CFormSelect, CFormTextarea, CFormSwitch,
  CButton, CSpinner, CAlert, CRow, CCol,
} from '@coreui/react'

const CATEGORIES = [
  'COMPETITION', 'WORKSHOP', 'CAMP', 'ASSESSMENT', 'PERFORMANCE',
  'COMMUNITY', 'CEREMONY', 'TRAINING', 'OTHER',
]
const SCOPES = ['ACADEMY', 'BRANCH', 'GROUP', 'STUDENT']
const VISIBILITIES = ['PRIVATE', 'ACADEMY', 'PUBLIC']
const AUDIENCES = ['ALL_MEMBERS', 'SELECTED_GROUPS', 'SELECTED_STUDENTS']

function toDatetimeLocal(iso) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

function fromDatetimeLocal(v) {
  return v ? new Date(v).toISOString() : null
}

export default function EventFormModal({ visible, event, submitting, error, onClose, onSubmit }) {
  const isEdit = !!event

  const [form, setForm] = useState({
    name: '',
    category: 'COMPETITION',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    scope: 'ACADEMY',
    visibility: 'ACADEMY',
    target_audience: 'ALL_MEMBERS',
    registration_required: true,
    registration_open_date: '',
    registration_close_date: '',
    capacity: '',
    waitlist_enabled: false,
    fee_amount: '',
    fee_currency: 'INR',
  })

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name || '',
        category: event.category || 'COMPETITION',
        description: event.description || '',
        location: event.location || '',
        start_date: toDatetimeLocal(event.start_date),
        end_date: toDatetimeLocal(event.end_date),
        scope: event.scope || 'ACADEMY',
        visibility: event.visibility || 'ACADEMY',
        target_audience: event.target_audience || 'ALL_MEMBERS',
        registration_required: event.registration_required !== false,
        registration_open_date: toDatetimeLocal(event.registration_open_date),
        registration_close_date: toDatetimeLocal(event.registration_close_date),
        capacity: event.capacity || '',
        waitlist_enabled: !!event.waitlist_enabled,
        fee_amount: event.fee_amount || '',
        fee_currency: event.fee_currency || 'INR',
      })
    } else {
      setForm((f) => ({ ...f, name: '', description: '', location: '', start_date: '', end_date: '' }))
    }
  }, [event, visible])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setCheck = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      start_date: fromDatetimeLocal(form.start_date),
      end_date: fromDatetimeLocal(form.end_date),
      registration_open_date: fromDatetimeLocal(form.registration_open_date),
      registration_close_date: fromDatetimeLocal(form.registration_close_date),
      capacity: form.capacity ? Number(form.capacity) : null,
      fee_amount: form.fee_amount ? Number(form.fee_amount) : null,
    })
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg" backdrop="static" alignment="center" scrollable>
      <CModalHeader>
        <CModalTitle>{isEdit ? 'Edit Event' : 'New Event'}</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {error ? <CAlert color="danger" className="py-2">{error.message || 'Something went wrong'}</CAlert> : null}

          <div className="mb-3">
            <CFormLabel>Event Name *</CFormLabel>
            <CFormInput value={form.name} onChange={set('name')} required maxLength={200} />
          </div>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel>Category *</CFormLabel>
              <CFormSelect value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Visibility</CFormLabel>
              <CFormSelect value={form.visibility} onChange={set('visibility')}>
                {VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel>Start Date &amp; Time *</CFormLabel>
              <CFormInput type="datetime-local" value={form.start_date} onChange={set('start_date')} required />
            </CCol>
            <CCol md={6}>
              <CFormLabel>End Date &amp; Time</CFormLabel>
              <CFormInput type="datetime-local" value={form.end_date} onChange={set('end_date')} />
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel>Location</CFormLabel>
            <CFormInput value={form.location} onChange={set('location')} maxLength={300} />
          </div>

          <div className="mb-3">
            <CFormLabel>Description</CFormLabel>
            <CFormTextarea value={form.description} onChange={set('description')} rows={3} />
          </div>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel>Scope</CFormLabel>
              <CFormSelect value={form.scope} onChange={set('scope')}>
                {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Target Audience</CFormLabel>
              <CFormSelect value={form.target_audience} onChange={set('target_audience')}>
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </CFormSelect>
            </CCol>
          </CRow>

          <div className="mb-3 p-3 border rounded">
            <CFormSwitch
              label="Registration Required"
              checked={form.registration_required}
              onChange={setCheck('registration_required')}
              className="mb-2"
            />
            {form.registration_required && (
              <>
                <CRow className="mb-2">
                  <CCol md={6}>
                    <CFormLabel className="small">Registration Opens</CFormLabel>
                    <CFormInput type="datetime-local" value={form.registration_open_date} onChange={set('registration_open_date')} />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel className="small">Registration Closes</CFormLabel>
                    <CFormInput type="datetime-local" value={form.registration_close_date} onChange={set('registration_close_date')} />
                  </CCol>
                </CRow>
                <CRow>
                  <CCol md={6}>
                    <CFormLabel className="small">Capacity (blank = unlimited)</CFormLabel>
                    <CFormInput type="number" min={1} value={form.capacity} onChange={set('capacity')} />
                  </CCol>
                  <CCol md={6} className="d-flex align-items-end pb-1">
                    <CFormSwitch
                      label="Enable Waitlist"
                      checked={form.waitlist_enabled}
                      onChange={setCheck('waitlist_enabled')}
                    />
                  </CCol>
                </CRow>
              </>
            )}
          </div>

          <CRow className="mb-1">
            <CCol md={8}>
              <CFormLabel>Fee Amount (blank = free)</CFormLabel>
              <CFormInput type="number" min={0} step="0.01" value={form.fee_amount} onChange={set('fee_amount')} />
            </CCol>
            <CCol md={4}>
              <CFormLabel>Currency</CFormLabel>
              <CFormInput value={form.fee_currency} onChange={set('fee_currency')} maxLength={5} />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="light" variant="outline" onClick={onClose} disabled={submitting}>Cancel</CButton>
          <CButton type="submit" color="primary" disabled={submitting}>
            {submitting ? <><CSpinner size="sm" className="me-2" />Saving…</> : (isEdit ? 'Save Changes' : 'Create Event')}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
