import React from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormCheck,
  CProgress,
  CPlaceholder,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilChevronTop, cilWarning } from '@coreui/icons'

import './AcademySetupGuideCard.scss'

function SetupStepRow({ step, isNext }) {
  const statusLabel = step.complete ? 'Complete' : 'Action needed'
  return (
    <li
      className={[
        'academy-setup-guide__step',
        step.complete ? 'academy-setup-guide__step--complete' : '',
        isNext ? 'academy-setup-guide__step--next' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={`setup-step-${step.id}`}
      data-complete={step.complete ? 'true' : 'false'}
      data-next={isNext ? 'true' : 'false'}
    >
      <CFormCheck
        id={`setup-check-${step.id}`}
        className="academy-setup-guide__check mt-1"
        checked={step.complete}
        disabled
        readOnly
        onChange={() => {}}
        aria-label={`${step.title}: ${statusLabel}`}
      />
      <div className="flex-grow-1 min-w-0">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="fw-semibold">{step.title}</span>
          {isNext ? (
            <CBadge color="primary" data-testid="setup-next-badge">
              Next step
            </CBadge>
          ) : null}
          <CBadge color={step.complete ? 'success' : 'warning'} className="ms-auto">
            {statusLabel}
          </CBadge>
        </div>
        <p className="small text-body-secondary mb-0 mt-1">{step.haveReady}</p>
        {!step.complete ? (
          <CButton
            as={Link}
            to={step.to}
            color="primary"
            variant="outline"
            size="sm"
            className="mt-2"
          >
            {step.ctaLabel}
          </CButton>
        ) : null}
      </div>
    </li>
  )
}

export default function AcademySetupGuideCard({
  model,
  loading,
  error,
  collapsed,
  onToggleCollapsed,
  onRetry,
}) {
  if (loading && !model) {
    return (
      <CCard className="shadow-sm mb-3" data-testid="academy-setup-guide-loading">
        <CCardHeader>
          <span className="fw-semibold">Get your academy ready</span>
        </CCardHeader>
        <CCardBody>
          <CPlaceholder animation="glow" className="w-50 mb-3" />
          <CPlaceholder animation="glow" xs={12} className="mb-2" />
          <CPlaceholder animation="glow" xs={12} className="mb-2" />
          <CPlaceholder animation="glow" xs={8} />
        </CCardBody>
      </CCard>
    )
  }

  if (error && !model) {
    return (
      <CCard className="shadow-sm mb-3" data-testid="academy-setup-guide-error">
        <CCardHeader>
          <span className="fw-semibold">Get your academy ready</span>
        </CCardHeader>
        <CCardBody>
          <CAlert
            color="danger"
            className="d-flex flex-column flex-sm-row align-items-sm-center gap-2 mb-0"
          >
            <span>{error.message || 'Could not load academy setup status.'}</span>
            <CButton color="danger" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </CButton>
          </CAlert>
        </CCardBody>
      </CCard>
    )
  }

  if (!model) return null

  const progressPct =
    model.coreTotal > 0 ? Math.round((100 * model.coreCompleted) / model.coreTotal) : 0
  const progressLabel = `${model.coreCompleted} of ${model.coreTotal} core steps complete`

  if (collapsed) {
    return (
      <CCard className="shadow-sm mb-3" data-testid="academy-setup-guide-collapsed">
        <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <span className="fw-semibold">Get your academy ready</span>
            <span className="small text-body-secondary ms-2">{progressLabel}</span>
          </div>
          <CButton color="secondary" variant="outline" size="sm" onClick={onToggleCollapsed}>
            Show guide
          </CButton>
        </CCardHeader>
      </CCard>
    )
  }

  return (
    <CCard className="shadow-sm mb-3 academy-setup-guide" data-testid="academy-setup-guide">
      <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <span className="fw-semibold">Get your academy ready</span>
          <div className="small text-body-secondary">{progressLabel}</div>
        </div>
        <CButton
          color="secondary"
          variant="ghost"
          size="sm"
          onClick={onToggleCollapsed}
          aria-label="Hide setup guide"
        >
          Hide
          <CIcon icon={cilChevronTop} className="ms-1" />
        </CButton>
      </CCardHeader>
      <CCardBody>
        <CProgress
          className="mb-3"
          thin
          color={model.readyToRun ? 'success' : 'primary'}
          value={progressPct}
          aria-label={progressLabel}
        />

        {model.readyToRun ? (
          <CAlert
            color="success"
            className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2"
            data-testid="academy-setup-ready"
          >
            <span className="mb-0 d-flex align-items-center gap-2">
              <CIcon icon={cilCheckCircle} />
              Your academy is ready to run sessions
            </span>
            <CButton as={Link} to="/coach/schedule" color="success" size="sm">
              Open schedule
            </CButton>
          </CAlert>
        ) : null}

        {model.noEnabledActivity && !model.readyToRun ? (
          <CAlert
            color="info"
            className="d-flex align-items-start gap-2"
            data-testid="academy-setup-no-activity"
          >
            <CIcon icon={cilWarning} className="mt-1" />
            <div>
              <div className="fw-semibold">No activity enabled yet</div>
              <div className="small mb-2">
                Enable skating (or another supported activity) before you create batches and
                schedules.
              </div>
              <CButton as={Link} to="/coach/activities" color="primary" size="sm">
                Enable activity
              </CButton>
            </div>
          </CAlert>
        ) : null}

        <section className="mb-3" data-testid="setup-section-required">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="text-uppercase small fw-semibold text-body-secondary">Core setup</span>
            <CBadge color="danger">Required</CBadge>
          </div>
          <ol className="academy-setup-guide__list list-unstyled mb-0">
            {model.coreSteps.map((step) => (
              <SetupStepRow key={step.id} step={step} isNext={step.id === model.nextCoreId} />
            ))}
          </ol>
        </section>

        <section data-testid="setup-section-recommended">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="text-uppercase small fw-semibold text-body-secondary">
              Launch setup
            </span>
            <CBadge color="secondary">Recommended</CBadge>
          </div>
          <ol className="academy-setup-guide__list list-unstyled mb-0">
            {model.recommendedSteps.map((step) => (
              <SetupStepRow key={step.id} step={step} isNext={false} />
            ))}
          </ol>
        </section>
      </CCardBody>
    </CCard>
  )
}
