import React from 'react'
import { CCard, CCardBody, CCol, CContainer, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked } from '@coreui/icons'
import primaryLogo from '../../../assets/brand/primary-logo.png'

const DEFAULT_HERO_SUBHEAD =
  'Schedules, attendance, and skating progress — built for academies that take training seriously.'

const DEFAULT_HERO_CHIPS = ['Scheduling & attendance', 'Athlete progress', 'Operational clarity']

/**
 * Isolated auth canvas: optional split hero (desktop) + card panel.
 * Forces light theme locally so inputs stay premium/light regardless of app theme.
 */
const AuthShell = ({
  title,
  subtitle,
  children,
  trustText = 'Secure academy management platform for modern coaching businesses.',
  eyebrow,
  badge,
  heroHeadline,
  heroSubhead = DEFAULT_HERO_SUBHEAD,
  heroChips = DEFAULT_HERO_CHIPS,
  showHeroPanel = true,
}) => {
  const eyebrowText = eyebrow || badge

  const headline =
    heroHeadline ||
    (
      <>
        Train smarter.
        <br />
        Track progress.
        <br />
        Grow performance.
      </>
    )

  const heroPanel = (
    <div className="onrep-auth-hero-panel">
      <div className="onrep-auth-hero-panel__grid" aria-hidden />
      <div className="onrep-auth-hero-panel__glow onrep-auth-hero-panel__glow--coral" aria-hidden />
      <div className="onrep-auth-hero-panel__glow onrep-auth-hero-panel__glow--blue" aria-hidden />
      <div className="onrep-auth-hero-panel__content">
        <h2 className="onrep-auth-hero-headline">{headline}</h2>
        <p className="onrep-auth-hero-subhead">{heroSubhead}</p>
        {heroChips?.length ? (
          <ul className="onrep-auth-hero-chips">
            {heroChips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <p className="onrep-auth-hero-footnote">
          Trusted by coaches and academies across India. Built for skating, swimming, martial arts,
          and performance coaching.
        </p>
      </div>
    </div>
  )

  const heroMobile = (
    <div className="onrep-auth-hero-mobile d-lg-none">
      <p className="onrep-auth-hero-mobile__headline">Train smarter. Track progress.</p>
      <p className="onrep-auth-hero-mobile__sub">{DEFAULT_HERO_SUBHEAD}</p>
    </div>
  )

  return (
    <div
      className="onrep-auth-shell min-vh-100 d-flex align-items-stretch py-lg-4 py-3"
      data-coreui-theme="light"
    >
      <CContainer fluid="xxl" className="onrep-auth-container flex-grow-1 d-flex">
        <CRow className="onrep-auth-split onrep-auth-split--reverse flex-grow-1 g-0 align-items-stretch">
          <CCol lg={showHeroPanel ? 7 : 12} xl={showHeroPanel ? 6 : 12} className="onrep-auth-card-col">
            <div className="onrep-auth-main__inner">
              {showHeroPanel ? heroMobile : null}
              <CCard className="onrep-auth-card border-0 shadow-lg">
                <CCardBody className="onrep-auth-card-body p-4 p-md-5">
                  <div className="onrep-auth-brand-block">
                    <img src={primaryLogo} alt="OnRep" className="onrep-auth-card-logo" />
                    <p className="onrep-auth-tagline">Practice · Progress · Performance</p>
                  </div>
                  {eyebrowText ? (
                    <p className="onrep-auth-eyebrow">{eyebrowText}</p>
                  ) : null}
                  <h1 className="onrep-auth-title">{title}</h1>
                  {subtitle ? <p className="onrep-auth-subtitle">{subtitle}</p> : null}
                  <div className="onrep-auth-form-slot">{children}</div>
                  <div className="onrep-auth-trust">
                    <CIcon icon={cilLockLocked} size="sm" className="onrep-auth-trust-icon" />
                    <span>{trustText}</span>
                  </div>
                </CCardBody>
              </CCard>
            </div>
          </CCol>
          {showHeroPanel ? (
            <CCol lg={5} xl={6} className="onrep-auth-hero-col d-none d-lg-flex p-0">
              {heroPanel}
            </CCol>
          ) : null}
        </CRow>
      </CContainer>
    </div>
  )
}

export default AuthShell
