import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CAlert, CButton } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { clearWorkspace, setWorkspaceFault } from '../slices/workspaceSlice'

export default function WorkspaceFaultBanner() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const fault = useSelector((state) => state.workspace.workspaceFault)

  if (!fault?.message) return null

  return (
    <CAlert
      color="danger"
      className="mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2"
    >
      <div>
        <strong>Workspace issue.</strong> {fault.message}
      </div>
      <div className="d-flex gap-2">
        <CButton
          color="light"
          size="sm"
          onClick={() => {
            dispatch(setWorkspaceFault(null))
            dispatch(clearWorkspace())
            navigate('/coach/dashboard', { replace: true })
          }}
        >
          Choose workspace
        </CButton>
      </div>
    </CAlert>
  )
}
