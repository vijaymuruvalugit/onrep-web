import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CButton, CCard, CCardBody, CCardHeader, CFormSelect, CSpinner } from '@coreui/react'
import { setActiveWorkspace } from '../slices/workspaceSlice'
import { getWorkspaceDisplay } from '../../../core/activityWorkspace/activityDisplay'

export default function WorkspaceSelectionGate() {
  const dispatch = useDispatch()
  const { activities, status, error } = useSelector((state) => state.workspace)
  const [choice, setChoice] = React.useState('')

  const options = useMemo(() => activities || [], [activities])

  React.useEffect(() => {
    if (options.length === 1) {
      dispatch(setActiveWorkspace(options[0].id))
    }
  }, [options, dispatch])

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <CSpinner color="primary" />
        <p className="mt-3 text-body-secondary">Loading academy activities…</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <CCard className="mx-auto" style={{ maxWidth: 480 }}>
        <CCardHeader>
          <strong>Could not load activities</strong>
        </CCardHeader>
        <CCardBody>
          <p className="text-danger">{error?.message || 'Try again.'}</p>
        </CCardBody>
      </CCard>
    )
  }

  if (options.length === 0) {
    return (
      <CCard className="mx-auto" style={{ maxWidth: 520 }}>
        <CCardHeader>
          <strong>No activities enabled</strong>
        </CCardHeader>
        <CCardBody>
          <p className="mb-0">
            Your academy has no platform activities enabled yet. An owner can enable them under{' '}
            <strong>Academy activities</strong>.
          </p>
        </CCardBody>
      </CCard>
    )
  }

  if (options.length === 1) {
    return (
      <div className="d-flex flex-column align-items-center py-4">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <CCard className="mx-auto" style={{ maxWidth: 520 }}>
      <CCardHeader>
        <strong>Choose your workspace</strong>
      </CCardHeader>
      <CCardBody>
        <p className="text-body-secondary small">
          Select which academy activity you are working in (today this is usually skating). Schedules, attendance, and
          dashboards stay separate per activity workspace.
        </p>
        <CFormSelect
          aria-label="Activity workspace"
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
        >
          <option value="">Select an activity…</option>
          {options.map((a) => {
            const { label, icon } = getWorkspaceDisplay(a)
            return (
              <option key={a.id} value={a.id}>
                {icon} {label}
              </option>
            )
          })}
        </CFormSelect>
        <CButton
          color="primary"
          className="mt-3"
          disabled={!choice}
          onClick={() => dispatch(setActiveWorkspace(choice))}
        >
          Continue
        </CButton>
      </CCardBody>
    </CCard>
  )
}
