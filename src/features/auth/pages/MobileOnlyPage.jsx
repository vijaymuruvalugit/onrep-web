import React from 'react'
import { useDispatch } from 'react-redux'
import { CButton, CCard, CCardBody, CContainer } from '@coreui/react'
import { logout } from '../slices/authSlice'

const MobileOnlyPage = () => {
  const dispatch = useDispatch()

  return (
    <CContainer className="d-flex justify-content-center align-items-center min-vh-100">
      <CCard style={{ maxWidth: 440 }} className="w-100 shadow-sm">
        <CCardBody className="p-4 text-center">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
          <h4 className="mb-2">Use the OnRep mobile app</h4>
          <p className="text-body-secondary mb-4">
            Your account is for parents and students. Please download the OnRep app to access your
            account.
          </p>
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={() => dispatch(logout())}
          >
            Sign out
          </CButton>
        </CCardBody>
      </CCard>
    </CContainer>
  )
}

export default MobileOnlyPage
