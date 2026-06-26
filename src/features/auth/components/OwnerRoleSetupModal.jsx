import React, { useState } from 'react'
import {
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CButton,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilSettings, cilStar } from '@coreui/icons'

const CHOICES = [
  {
    id: 'coach',
    icon: cilPeople,
    label: 'Coach',
    description: 'Run sessions, track athletes, capture observations. Best if you are on the ice.',
  },
  {
    id: 'admin',
    icon: cilSettings,
    label: 'Administrator',
    description: 'Manage payments, enrolments, and academy settings. Best if you run the office.',
  },
  {
    id: 'both',
    icon: cilStar,
    label: 'Both',
    description: 'Full access — coach and admin. Typical for solo-operator academies.',
  },
]

export default function OwnerRoleSetupModal({ visible, onConfirm, loading }) {
  const [selected, setSelected] = useState('both')

  return (
    <CModal visible={visible} backdrop="static" keyboard={false} alignment="center" size="lg">
      <CModalHeader className="border-0 pb-0">
        <CModalTitle className="fs-5 fw-semibold">Set up your role</CModalTitle>
      </CModalHeader>
      <CModalBody className="px-4 pb-4">
        <p className="text-medium-emphasis mb-4">
          You created this academy. How will you use OnRep day-to-day? You can change this later in
          Settings.
        </p>

        <div className="d-flex flex-column gap-3 mb-4">
          {CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => setSelected(choice.id)}
              className="text-start border rounded-3 p-3 d-flex align-items-start gap-3 bg-white"
              style={{
                cursor: 'pointer',
                borderColor: selected === choice.id ? 'var(--cui-primary)' : 'var(--cui-border-color)',
                boxShadow: selected === choice.id ? '0 0 0 2px var(--cui-primary)' : 'none',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
            >
              <div
                className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  background: selected === choice.id ? 'var(--cui-primary)' : 'var(--cui-light)',
                }}
              >
                <CIcon
                  icon={choice.icon}
                  size="lg"
                  style={{ color: selected === choice.id ? '#fff' : 'var(--cui-body-color)' }}
                />
              </div>
              <div>
                <div className="fw-semibold">{choice.label}</div>
                <div className="text-medium-emphasis small mt-1">{choice.description}</div>
              </div>
            </button>
          ))}
        </div>

        <CButton
          color="primary"
          className="w-100"
          disabled={loading}
          onClick={() => onConfirm(selected)}
        >
          {loading ? <CSpinner size="sm" className="me-2" /> : null}
          Continue as {CHOICES.find((c) => c.id === selected)?.label}
        </CButton>
      </CModalBody>
    </CModal>
  )
}
