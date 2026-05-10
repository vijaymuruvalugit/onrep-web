import React, { useEffect } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CListGroup,
  CListGroupItem,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'

import useParent from '../hooks/useParent'
import { formatShortDate } from '../utils/formatParentDate'

/**
 * List-only: backend does not expose read/unread on GET /parent/notifications in current contract.
 */
const ParentNotificationsPage = () => {
  const { notifications, notificationsLoading, notificationsError, loadNotifications } = useParent()

  useEffect(() => {
    loadNotifications({ limit: 100, offset: 0 })
  }, [loadNotifications])

  const retry = () => loadNotifications({ limit: 100, offset: 0 })

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="mb-0">Notifications</h2>
          <p className="text-body-secondary small mb-0">Academy announcements and notices.</p>
        </div>
        <CButton
          color="secondary"
          variant="outline"
          size="sm"
          onClick={retry}
          disabled={notificationsLoading}
        >
          <CIcon icon={cilReload} className="me-1" />
          Refresh
        </CButton>
      </div>

      {notificationsError ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center"
        >
          <span>{notificationsError.message || 'Unable to load notifications.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={retry}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      {notificationsLoading && !notifications.length ? (
        <div className="text-center py-4">
          <CSpinner />
        </div>
      ) : null}

      {!notificationsLoading && !notifications.length && !notificationsError ? (
        <CAlert color="info">No notifications yet.</CAlert>
      ) : null}

      <CCard>
        <CCardHeader>All</CCardHeader>
        <CCardBody className="p-0">
          <CListGroup flush>
            {notifications.map((n) => (
              <CListGroupItem key={n.id}>
                <div className="fw-semibold">{n.title || 'Notice'}</div>
                <div className="small text-body-secondary mb-1">{formatShortDate(n.createdAt)}</div>
                <div className="small">{n.message}</div>
              </CListGroupItem>
            ))}
          </CListGroup>
        </CCardBody>
      </CCard>
    </>
  )
}

export default ParentNotificationsPage
