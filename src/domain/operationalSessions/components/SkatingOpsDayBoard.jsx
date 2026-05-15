import React, { useMemo } from 'react'
import {
  CAlert,
  CButton,
  CCol,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from '@coreui/react'
import { SKATING_OPS_COPY } from '../../../features/skating/constants/skatingOpsCopy'
import { sortDayBoardSessions } from '../helpers/sortDayBoardSessions'
import { isLiveSession } from '../helpers/sessionActions'
import OperationalSessionCard from './OperationalSessionCard'
import DayBoardEmptyState from './DayBoardEmptyState'
import '../operational-sessions-board.css'

/**
 * @param {{
 *   dateYmd: string,
 *   onDateChange: (ymd: string) => void,
 *   sessions: import('../types').OperationalSession[],
 *   loading: boolean,
 *   error: string|null,
 *   selectedSessionId?: string,
 *   cardActionBusyId?: string|null,
 *   onRefresh: () => void,
 *   onAdHoc: () => void,
 *   onCardPrimary: (session: import('../types').OperationalSession, action: string) => void,
 *   onSelectSession: (id: string) => void,
 *   emptyVariant?: 'default'|'no_workspace'|'wrong_capability',
 *   workspaceName?: string|null,
 * }} props
 */
export default function SkatingOpsDayBoard({
  dateYmd,
  onDateChange,
  sessions,
  loading,
  error,
  selectedSessionId = '',
  cardActionBusyId = null,
  onRefresh,
  onAdHoc,
  onCardPrimary,
  onSelectSession,
  emptyVariant = 'default',
  workspaceName = null,
}) {
  const sorted = useMemo(() => sortDayBoardSessions(sessions), [sessions])
  const liveId = useMemo(() => sorted.find((s) => isLiveSession(s))?.id ?? null, [sorted])

  return (
    <div className="skating-ops-day-board" data-testid="skating-ops-day-board">
      <header className="op-day-board-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h4 fw-semibold mb-1">{SKATING_OPS_COPY.pageTitle}</h1>
          <p className="text-body-secondary small mb-1">{SKATING_OPS_COPY.pageSubtitle}</p>
          <p className="small text-body-secondary opacity-75 mb-0 fst-italic">
            {SKATING_OPS_COPY.planVsExecuteNote}
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <CFormLabel className="mb-0 small text-nowrap">{SKATING_OPS_COPY.dayLabel}</CFormLabel>
          <CFormInput
            type="date"
            value={dateYmd}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-auto"
            aria-label="Session day"
          />
          <CButton color="secondary" size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
            {SKATING_OPS_COPY.refresh}
          </CButton>
          <CButton color="light" size="sm" variant="outline" onClick={onAdHoc}>
            {SKATING_OPS_COPY.adHocCta}
          </CButton>
        </div>
      </header>

      {error ? <CAlert color="danger">{error}</CAlert> : null}

      {loading && !sorted.length ? (
        <div className="text-center py-5">
          <CSpinner />
        </div>
      ) : null}

      {!loading && sorted.length === 0 ? (
        <DayBoardEmptyState
          onAdHoc={onAdHoc}
          variant={emptyVariant}
          workspaceName={workspaceName}
          dateYmd={dateYmd}
        />
      ) : null}

      {sorted.length > 0 ? (
        <CRow className="g-3 g-lg-4">
          {sorted.map((s) => (
            <CCol key={s.id} xs={12} md={6} xl={4}>
              <OperationalSessionCard
                session={s}
                selected={String(s.id) === String(selectedSessionId)}
                pinned={liveId != null && String(s.id) === String(liveId)}
                primaryBusy={cardActionBusyId === String(s.id)}
                onPrimary={onCardPrimary}
                onSelect={onSelectSession}
              />
            </CCol>
          ))}
        </CRow>
      ) : null}
    </div>
  )
}
