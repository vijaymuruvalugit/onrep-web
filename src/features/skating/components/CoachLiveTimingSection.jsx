import React from 'react'
import {
  CAlert,
  CButton,
  CButtonGroup,
  CFormInput,
  CFormSelect,
  CSpinner,
} from '@coreui/react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'
import { liveLabel } from '../constants/coachLiveLabels'

/**
 * Collapsed timing / lap entry for live coaching workspace.
 */
export default function CoachLiveTimingSection({
  bundle,
  lapStudentId,
  rosterForSession,
  lapRaceId,
  setLapRaceId,
  lapSeconds,
  setLapSeconds,
  lapSecondsRef,
  lapSubmitting,
  lapError,
  duplicateWarn,
  uiPaused,
  opsState,
  activeEffortSkillId,
  setActiveEffortSkillId,
  setActiveEffortName,
  skillsCatalog,
  selectedSessionId,
  writeActiveEffort,
  focusLapInput,
  submitLap,
  submitDuplicateAnyway,
  retryAfterLapFailure,
  onFormKeyDown,
  addTimingLane,
  undoOffer,
  undoSecondsLeft,
  undoBusy,
  undoLastLap,
  lastEffortPhrase,
}) {
  return (
    <div className="coach-live-timing-inner">
      {(bundle.races || []).length > 1 ? (
        <div className="mb-3">
          <div className="small text-body-secondary mb-1">{SESSION_OPS_COPY.timingLaneColumn}</div>
          <CButtonGroup vertical role="group" className="w-100">
            {(bundle.races || []).map((rc) => (
              <CButton
                key={rc.id}
                color={String(lapRaceId) === String(rc.id) ? 'primary' : 'light'}
                size="sm"
                className="text-start"
                disabled={lapSubmitting}
                onClick={() => {
                  setLapRaceId(rc.id)
                  focusLapInput()
                }}
              >
                {(rc.label || rc.groupName || 'Lane').slice(0, 48)}
              </CButton>
            ))}
          </CButtonGroup>
        </div>
      ) : (bundle.races || []).length === 1 ? (
        <div className="mb-3">
          <CButton size="sm" color="light" variant="outline" type="button" onClick={() => void addTimingLane()}>
            {SESSION_OPS_COPY.addTimingLane}
          </CButton>
        </div>
      ) : null}
      <form
        aria-busy={lapSubmitting ? 'true' : 'false'}
        onSubmit={(e) => {
          e.preventDefault()
          submitLap(e)
        }}
        onKeyDown={onFormKeyDown}
      >
        {lapSubmitting ? (
          <div className="small text-warning mb-1 d-flex align-items-center gap-2">
            <CSpinner size="sm" />
            Saving…
          </div>
        ) : null}
        <CFormSelect
          className="mb-2"
          aria-label="Effort tag"
          value={activeEffortSkillId}
          disabled={lapSubmitting || uiPaused || opsState === 'ended'}
          onChange={(e) => {
            const id = e.target.value
            const sk = id ? skillsCatalog.find((r) => String(r.id) === String(id)) : null
            setActiveEffortSkillId(id)
            setActiveEffortName(sk?.name || '')
            writeActiveEffort(selectedSessionId, lapStudentId, id, sk?.name || '')
            focusLapInput()
          }}
        >
          <option value="">Effort tag</option>
          {skillsCatalog.map((s) => (
            <option key={s.id} value={s.id}>
              {(s.name || 'Effort').slice(0, 56)}
            </option>
          ))}
        </CFormSelect>
        <CFormInput
          ref={lapSecondsRef}
          name="lapSeconds"
          className="mb-2"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="Seconds"
          value={lapSeconds}
          disabled={lapSubmitting || uiPaused || opsState === 'ended' || !lapStudentId}
          onChange={(e) => setLapSeconds(e.target.value)}
          autoComplete="off"
        />
        {duplicateWarn ? (
          <CAlert color="warning" className="py-2">
            {duplicateWarn}{' '}
            <CButton type="button" size="sm" color="warning" onClick={submitDuplicateAnyway}>
              Submit anyway
            </CButton>
          </CAlert>
        ) : null}
        {lapError ? (
          <CAlert color="danger" className="py-2 d-flex flex-wrap gap-2 justify-content-between">
            <span>{lapError}</span>
            <CButton type="button" size="sm" color="danger" variant="outline" onClick={retryAfterLapFailure}>
              Retry
            </CButton>
          </CAlert>
        ) : null}
        <CButton
          type="submit"
          color="primary"
          disabled={lapSubmitting || uiPaused || opsState === 'ended' || !lapStudentId}
        >
          {lapSubmitting ? <CSpinner size="sm" /> : liveLabel('track')}
        </CButton>
        {undoOffer && undoSecondsLeft > 0 ? (
          <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
            <CButton
              type="button"
              size="sm"
              color="warning"
              variant="outline"
              disabled={undoBusy || lapSubmitting}
              onClick={undoLastLap}
            >
              {undoBusy ? <CSpinner size="sm" /> : `Undo (${undoSecondsLeft}s)`}
            </CButton>
            <span className="small text-body-secondary">{undoOffer.label}</span>
          </div>
        ) : null}
        {lastEffortPhrase ? (
          <p className="small text-body-secondary mt-2 mb-0" aria-live="polite">
            {lastEffortPhrase}
          </p>
        ) : null}
      </form>
    </div>
  )
}
