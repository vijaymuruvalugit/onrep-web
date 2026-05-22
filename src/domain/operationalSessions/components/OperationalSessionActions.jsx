import React from 'react'
import { CButton, CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle } from '@coreui/react'
import { Link } from 'react-router-dom'
import { primaryActionForSession, primaryActionLabel } from '../helpers/sessionActions'
import { canMarkSessionAttendance } from '../helpers/attendanceEligibility'
import { liveSessionPath } from '../../../features/participation/utils/liveSessionPath'
import { COACH_PARTICIPATION_COPY } from '../../../core/productCopy'

/**
 * @param {{
 *   session: import('../types').OperationalSession,
 *   onPrimary: (session: import('../types').OperationalSession, action: string) => void,
 *   primaryBusy?: boolean,
 *   scheduleEditHref?: string|null,
 * }} props
 */
export default function OperationalSessionActions({
  session,
  onPrimary,
  primaryBusy = false,
  scheduleEditHref = null,
}) {
  const action = primaryActionForSession(session)
  const liveSessionHref = liveSessionPath(session?.id)

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 op-session-actions">
      <CButton
        color={action === 'view' ? 'primary' : 'success'}
        size="sm"
        disabled={primaryBusy}
        onClick={() => onPrimary(session, action)}
      >
        {primaryBusy ? '…' : primaryActionLabel(action)}
      </CButton>
      <CDropdown variant="btn-group">
        <CDropdownToggle color="light" size="sm" caret={false} className="px-2">
          More
        </CDropdownToggle>
        <CDropdownMenu>
          {canMarkSessionAttendance(session) ? (
            <CDropdownItem as={Link} to={liveSessionHref}>
              {COACH_PARTICIPATION_COPY.rosterCheckIn}
            </CDropdownItem>
          ) : null}
          {scheduleEditHref ? (
            <CDropdownItem as={Link} to={scheduleEditHref}>
              Edit on schedule
            </CDropdownItem>
          ) : null}
          {String(session?.state || '').toLowerCase() !== 'cancelled' &&
          !['completed', 'archived'].includes(String(session?.state || '').toLowerCase()) ? (
            <CDropdownItem className="text-danger" onClick={() => onPrimary(session, 'cancel')}>
              Cancel session
            </CDropdownItem>
          ) : null}
        </CDropdownMenu>
      </CDropdown>
    </div>
  )
}
