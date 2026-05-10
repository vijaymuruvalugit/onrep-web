import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from '@coreui/react'
import { ACTIVITY_UI_OPTIONS } from '@onrep/contracts'
import {
  createActivity,
  deactivateActivity,
  listActivities,
} from '../../workspace/api/activitiesApi'
import { bootstrapWorkspace } from '../../workspace/slices/workspaceSlice'
import { getWorkspaceDisplay } from '../../../core/activityWorkspace/activityDisplay'
import { getRemoveActivityConsequenceMessage } from '../../../core/activityWorkspace/activityDisableWarnings'

export default function ManageActivitiesPage() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const role = String(user?.role || '').toLowerCase()
  const isOwner = role === 'academy_owner'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [addingType, setAddingType] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listActivities()
      setItems(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || 'Failed to load activities')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const enabledTypes = useMemo(
    () => new Set(items.map((a) => String(a.type || '').toLowerCase())),
    [items]
  )

  const availableOptions = useMemo(
    () => ACTIVITY_UI_OPTIONS.filter((o) => o.implemented && !enabledTypes.has(o.type)),
    [enabledTypes]
  )

  const onDeactivate = async (id, label, activityType) => {
    const consequence = getRemoveActivityConsequenceMessage(activityType)
    if (
      !window.confirm(
        `${consequence}\n\nRemove “${label}” from your academy?`
      )
    )
      return
    setBusyId(id)
    try {
      await deactivateActivity(id)
      await load()
      dispatch(bootstrapWorkspace())
    } catch (e) {
      window.alert(e?.message || 'Could not remove.')
    } finally {
      setBusyId(null)
    }
  }

  const onAdd = async (type) => {
    setAddingType(type)
    try {
      await createActivity({ type })
      await load()
      dispatch(bootstrapWorkspace())
    } catch (e) {
      window.alert(e?.message || 'Could not add activity.')
    } finally {
      setAddingType(null)
    }
  }

  if (!isOwner) {
    return (
      <CCard>
        <CCardBody>
          <p className="mb-0">
            Only the academy owner can change platform activities. Ask your owner to sign in and open{' '}
            <strong>Academy activities</strong>.
          </p>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <CRow>
      <CCol lg={10}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Academy activities</strong>
            <div className="small text-body-secondary">
              Platform-defined verticals — skating-first today. Enable what your academy runs; each activity is a
              separate workspace for schedules, places, and coaching data.
            </div>
          </CCardHeader>
          <CCardBody>
            {error ? <CAlert color="danger">{error}</CAlert> : null}
            {loading ? <CSpinner /> : null}
            {!loading ? (
              <>
                <div className="fw-semibold mb-2">Enabled</div>
                {!loading && items.length === 1 ? (
                  <p className="small text-body-secondary mb-2">
                    At least one activity must stay enabled — you can add another before removing this one.
                  </p>
                ) : null}
                {items.length === 0 ? (
                  <p className="text-body-secondary small">No activities enabled yet.</p>
                ) : (
                  items.map((a) => {
                    const { label, icon } = getWorkspaceDisplay(a)
                    return (
                      <div
                        key={a.id}
                        className="d-flex justify-content-between align-items-center border rounded p-3 mb-2"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold">
                            <span className="fs-5 me-1" aria-hidden>
                              {icon}
                            </span>
                            {label}
                          </span>
                        </div>
                        <CButton
                          color="secondary"
                          size="sm"
                          variant="outline"
                          disabled={busyId === a.id || items.length <= 1}
                          title={
                            items.length <= 1
                              ? 'Add another activity before you can remove this one.'
                              : undefined
                          }
                          onClick={() => onDeactivate(a.id, label, a.type)}
                        >
                          Remove
                        </CButton>
                      </div>
                    )
                  })
                )}

                <hr className="my-4" />
                <div className="fw-semibold mb-2">Available</div>
                {availableOptions.length === 0 ? (
                  <p className="text-body-secondary small mb-0">
                    All platform activities for this phase are already enabled.
                  </p>
                ) : (
                  availableOptions.map((o) => (
                    <div
                      key={o.type}
                      className="d-flex justify-content-between align-items-center border rounded p-3 mb-2"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-5" aria-hidden>
                          {o.icon}
                        </span>
                        <div>
                          <div className="fw-semibold">{o.label}</div>
                          <div className="small text-body-secondary">{o.description}</div>
                        </div>
                      </div>
                      <CButton
                        color="primary"
                        size="sm"
                        disabled={addingType === o.type}
                        onClick={() => onAdd(o.type)}
                      >
                        {addingType === o.type ? 'Adding…' : 'Add'}
                      </CButton>
                    </div>
                  ))
                )}
              </>
            ) : null}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
