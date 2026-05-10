import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CCollapse,
  CForm,
  CFormInput,
  CFormLabel,
  CFormText,
  CFormTextarea,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilSave, cilSearch } from '@coreui/icons'
import placesApi from '../api/placesApi'
import placeSchema from '../validations/placeSchema'

const defaultValues = {
  name: '',
  address: '',
  notes: '',
  sortOrder: '',
  latitude: '',
  longitude: '',
  googlePlaceId: '',
}

function toPayload(values) {
  const payload = {
    name: values.name.trim(),
    address: values.address?.trim() || null,
    notes: values.notes?.trim() || null,
  }
  if (values.sortOrder !== '' && values.sortOrder != null) {
    const n = Number(values.sortOrder)
    if (!Number.isNaN(n)) payload.sortOrder = n
  }
  if (values.latitude !== '' && values.latitude != null) {
    const n = Number(values.latitude)
    if (!Number.isNaN(n)) payload.latitude = n
  }
  if (values.longitude !== '' && values.longitude != null) {
    const n = Number(values.longitude)
    if (!Number.isNaN(n)) payload.longitude = n
  }
  if (values.googlePlaceId?.trim()) payload.googlePlaceId = values.googlePlaceId.trim()
  return payload
}

const PlaceForm = ({ title, subtitle, submitLabel, initialValues, saving, error, onSubmit }) => {
  const navigate = useNavigate()
  const { register, handleSubmit, formState, reset, setValue, getValues } = useForm({
    resolver: yupResolver(placeSchema),
    defaultValues,
  })
  const { errors, isDirty } = formState
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [predictions, setPredictions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimer = useRef(null)

  useEffect(() => {
    if (initialValues) {
      reset({
        ...defaultValues,
        name: initialValues.name || '',
        address: initialValues.address || '',
        notes: initialValues.notes || '',
        sortOrder: initialValues.sortOrder != null ? String(initialValues.sortOrder) : '',
        latitude: initialValues.latitude != null ? String(initialValues.latitude) : '',
        longitude: initialValues.longitude != null ? String(initialValues.longitude) : '',
        googlePlaceId: initialValues.googlePlaceId || '',
      })
    }
  }, [initialValues, reset])

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [isDirty])

  const runAddressSearch = async (q) => {
    if (!q || q.trim().length < 2) {
      setPredictions([])
      return
    }
    setSearchLoading(true)
    try {
      const data = await placesApi.autocomplete(q.trim())
      setPredictions(data.predictions || [])
    } catch {
      setPredictions([])
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => runAddressSearch(searchQ), 300)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchQ])

  const applyPrediction = async (pred) => {
    const pid = pred.placeId || pred.place_id
    if (!pid) return
    try {
      const details = await placesApi.getPlaceDetails(pid)
      if (details?.address) setValue('address', details.address, { shouldDirty: true })
      if (details?.name) setValue('name', getValues('name') || details.name, { shouldDirty: true })
      if (details?.lat != null) setValue('latitude', String(details.lat), { shouldDirty: true })
      if (details?.lng != null) setValue('longitude', String(details.lng), { shouldDirty: true })
      if (details?.placeId) setValue('googlePlaceId', details.placeId, { shouldDirty: true })
      setPredictions([])
      setSearchQ('')
    } catch {
      setPredictions([])
    }
  }

  const handleCancel = () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return
    navigate(-1)
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center py-2">
        <div>
          <strong>{title}</strong>
          {subtitle ? <div className="small text-body-secondary">{subtitle}</div> : null}
        </div>
        <CButton color="secondary" variant="outline" size="sm" onClick={handleCancel}>
          <CIcon icon={cilArrowLeft} className="me-1" />
          Back
        </CButton>
      </CCardHeader>
      <CCardBody className="py-3">
        {error ? <CAlert color="danger">{error.message}</CAlert> : null}
        <CForm onSubmit={handleSubmit((vals) => onSubmit(toPayload(vals)))}>
          <CRow className="g-2">
            <CCol md={6}>
              <CFormLabel className="mb-0 small">Name</CFormLabel>
              <CFormInput
                className="form-control-sm"
                invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name ? (
                <div className="invalid-feedback d-block">{errors.name.message}</div>
              ) : null}
            </CCol>
            <CCol md={6}>
              <CFormLabel className="mb-0 small">Sort order</CFormLabel>
              <CFormInput className="form-control-sm" type="number" {...register('sortOrder')} />
            </CCol>
            <CCol xs={12}>
              <CFormLabel className="mb-0 small">Find address (search)</CFormLabel>
              <div className="input-group input-group-sm">
                <span className="input-group-text">
                  <CIcon icon={cilSearch} />
                </span>
                <CFormInput
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Type to search — fills address fields only, no map"
                />
                {searchLoading ? (
                  <CSpinner size="sm" className="position-absolute end-0 me-2 mt-1" />
                ) : null}
              </div>
              {predictions.length ? (
                <CListGroup className="mt-1 shadow-sm" style={{ maxHeight: 180, overflow: 'auto' }}>
                  {predictions.map((p, idx) => (
                    <CListGroupItem
                      key={p.placeId || p.place_id || idx}
                      role="button"
                      className="py-1 small"
                      onClick={() => applyPrediction(p)}
                    >
                      {p.description || p.name || 'Place'}
                    </CListGroupItem>
                  ))}
                </CListGroup>
              ) : null}
            </CCol>
            <CCol xs={12}>
              <CFormLabel className="mb-0 small">Address</CFormLabel>
              <CFormTextarea rows={2} className="form-control-sm" {...register('address')} />
            </CCol>
            <CCol xs={12}>
              <CFormLabel className="mb-0 small">Notes</CFormLabel>
              <CFormTextarea rows={2} className="form-control-sm" {...register('notes')} />
            </CCol>
          </CRow>

          <CButton
            color="link"
            size="sm"
            className="px-0 mt-2"
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            {advancedOpen ? 'Hide' : 'Show'} advanced fields
          </CButton>
          <CCollapse visible={advancedOpen}>
            <CRow className="g-2 mt-1">
              <CCol md={4}>
                <CFormLabel className="mb-0 small">Latitude</CFormLabel>
                <CFormInput className="form-control-sm" {...register('latitude')} />
              </CCol>
              <CCol md={4}>
                <CFormLabel className="mb-0 small">Longitude</CFormLabel>
                <CFormInput className="form-control-sm" {...register('longitude')} />
              </CCol>
              <CCol md={4}>
                <CFormLabel className="mb-0 small">Google place ID</CFormLabel>
                <CFormInput className="form-control-sm" {...register('googlePlaceId')} />
              </CCol>
            </CRow>
          </CCollapse>

          <div className="d-flex gap-2 mt-3">
            <CButton type="submit" color="primary" size="sm" disabled={saving}>
              {saving ? <CSpinner size="sm" /> : <CIcon icon={cilSave} className="me-1" />}
              {submitLabel}
            </CButton>
            <CButton
              type="button"
              color="secondary"
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default PlaceForm
