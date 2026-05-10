import React from 'react'
import { CCard, CCardBody, CCol, CContainer, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked } from '@coreui/icons'
import primaryLogo from '../../../assets/brand/primary-logo.png'

const AuthShell = ({
  title,
  subtitle,
  children,
  trustText = 'Secure academy management platform trusted by coaches and academies.',
}) => {
  return (
    <div className="onrep-auth-shell min-vh-100 d-flex align-items-center py-4">
      <div className="onrep-auth-bg-orb onrep-auth-bg-orb--one" />
      <div className="onrep-auth-bg-orb onrep-auth-bg-orb--two" />
      <CContainer fluid="xxl">
        <CRow className="g-0 onrep-auth-frame overflow-hidden">
          <CCol lg={12} className="onrep-auth-main">
            <div className="onrep-auth-main__inner">
              <CCard className="onrep-auth-card border-0 shadow-lg">
                <CCardBody className="p-4 p-md-5">
                  <img
                    src={primaryLogo}
                    alt="OnRep logo"
                    className="onrep-auth-card-logo mb-4"
                  />
                  <h2 className="onrep-auth-title">{title}</h2>
                  {subtitle ? <p className="onrep-auth-subtitle">{subtitle}</p> : null}
                  {children}
                  <div className="onrep-auth-trust">
                    <CIcon icon={cilLockLocked} size="sm" />
                    <span>{trustText}</span>
                  </div>
                </CCardBody>
              </CCard>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default AuthShell
