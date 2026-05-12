import React from 'react'
import {
  CAlert,
  CButton,
  CFormInput,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
} from '@coreui/react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'

/** Inline side capture — coach intent + stubs; lap/observation stays in main column to avoid duplicate forms. */
export default function AthleteCaptureDrawer({
  visible,
  studentName,
  focusText,
  onChangeFocus,
  onSaveFocus,
  saving,
  saveMessage,
  onClose,
}) {
  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} backdrop="static">
      <COffcanvasHeader>
        <COffcanvasTitle>{SESSION_OPS_COPY.captureDrawerTitle}</COffcanvasTitle>
        <CButton type="button" color="light" size="sm" onClick={onClose}>
          Close
        </CButton>
      </COffcanvasHeader>
      <COffcanvasBody className="d-flex flex-column gap-3">
        <div>
          <div className="small text-body-secondary mb-1">Athlete</div>
          <div className="fw-semibold">{studentName || '—'}</div>
        </div>
        <CAlert color="secondary" className="py-2 small mb-0">
          {SESSION_OPS_COPY.markPresentSoon}
        </CAlert>
        <div>
          <label className="form-label small text-body-secondary">{SESSION_OPS_COPY.focusPlaceholder}</label>
          <CFormInput
            value={focusText}
            onChange={(e) => onChangeFocus(e.target.value)}
            placeholder="e.g. Quicker crossovers on corners"
          />
          <div className="d-flex gap-2 mt-2 align-items-center flex-wrap">
            <CButton type="button" color="primary" size="sm" disabled={saving} onClick={onSaveFocus}>
              {saving ? 'Saving…' : SESSION_OPS_COPY.focusSave}
            </CButton>
            {saveMessage ? <span className="small text-success">{saveMessage}</span> : null}
          </div>
        </div>
        <p className="small text-body-secondary mb-0">{SESSION_OPS_COPY.openInlineCapture}</p>
      </COffcanvasBody>
    </COffcanvas>
  )
}
