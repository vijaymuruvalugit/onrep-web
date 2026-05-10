import React from 'react'
import { useSelector } from 'react-redux'
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react'

/**
 * Read-only profile from session user; no dedicated parent profile PATCH in this phase.
 */
const ParentProfilePage = () => {
  const user = useSelector((state) => state.auth.user)

  return (
    <>
      <h2 className="mb-3">Profile</h2>
      <CRow>
        <CCol md={8} lg={6}>
          <CCard>
            <CCardHeader>Account</CCardHeader>
            <CCardBody>
              {user ? (
                <dl className="row mb-0 small">
                  <dt className="col-sm-4">Name</dt>
                  <dd className="col-sm-8">{user.name || user.full_name || '—'}</dd>
                  <dt className="col-sm-4">Email</dt>
                  <dd className="col-sm-8">{user.email || '—'}</dd>
                  <dt className="col-sm-4">Role</dt>
                  <dd className="col-sm-8">{user.role || user.userRole || '—'}</dd>
                </dl>
              ) : (
                <p className="text-body-secondary small mb-0">Sign in to view your profile.</p>
              )}
              <p className="text-body-secondary small mt-3 mb-0">
                Linked students appear in your home and schedule when the academy has connected your
                account.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default ParentProfilePage
