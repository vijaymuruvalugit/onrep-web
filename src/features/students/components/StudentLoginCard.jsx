import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import IndiaPhoneField from '../../../components/IndiaPhoneField'
import { toE164India } from '../../../utils/indiaPhone'
import studentsApi from '../api/studentsApi'

export default function StudentLoginCard({ studentId, studentName }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [disabling, setDisabling] = useState(false)

  const loadStatus = useCallback(() => {
    setLoading(true)
    studentsApi
      .getLoginStatus(studentId)
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [studentId])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleEnable = async () => {
    const ph = toE164India(phone)
    if (!ph) {
      setError('Enter a 10-digit mobile number')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await studentsApi.enableLogin(studentId, ph)
      setModalOpen(false)
      setPhone('')
      loadStatus()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to enable login')
    } finally {
      setSaving(false)
    }
  }

  const handleDisable = async () => {
    if (!window.confirm(`Disable login for ${studentName}? They will no longer be able to sign in.`)) return
    setDisabling(true)
    try {
      await studentsApi.disableLogin(studentId)
      loadStatus()
    } catch {
      // ignore
    } finally {
      setDisabling(false)
    }
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex align-items-center justify-content-between">
          <strong>Student login</strong>
          {!loading && !status?.loginEnabled && (
            <CButton size="sm" color="primary" onClick={() => setModalOpen(true)}>
              Enable login
            </CButton>
          )}
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <CSpinner size="sm" />
          ) : status?.loginEnabled ? (
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <CBadge color="success" className="py-2 px-3">Login enabled</CBadge>
              {status.user?.phone && (
                <span className="text-body-secondary small">Phone: {status.user.phone}</span>
              )}
              <CButton
                size="sm"
                color="danger"
                variant="outline"
                disabled={disabling}
                onClick={handleDisable}
              >
                {disabling ? <CSpinner size="sm" /> : 'Disable login'}
              </CButton>
            </div>
          ) : (
            <div>
              <p className="text-body-secondary mb-2">
                This student cannot log in yet. Enable login so they can view their own
                schedule, attendance, and progress.
              </p>
              <CButton size="sm" color="primary" onClick={() => setModalOpen(true)}>
                Enable login
              </CButton>
            </div>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={modalOpen} onClose={() => { setModalOpen(false); setPhone(''); setError(null) }}>
        <CModalHeader>
          <CModalTitle>Enable login for {studentName}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="text-body-secondary mb-3">
            Enter the student's phone number. They will use this to sign in with OTP on the mobile app.
          </p>
          <IndiaPhoneField
            id="student-login-phone"
            value={phone}
            onChange={setPhone}
            className="mb-0"
          />
          {error && <CAlert color="danger" className="mt-3 mb-0">{error}</CAlert>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => { setModalOpen(false); setPhone(''); setError(null) }}>
            Cancel
          </CButton>
          <CButton color="primary" disabled={saving} onClick={handleEnable}>
            {saving ? <CSpinner size="sm" /> : 'Enable login'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}
