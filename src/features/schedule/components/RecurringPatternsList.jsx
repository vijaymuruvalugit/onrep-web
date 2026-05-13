import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CSpinner,
} from '@coreui/react'
import { apiDaysToUiLabels, UI_DAY_LABELS_ORDERED } from '../utils/daysOfWeek'
import { formatSessionClock } from '../../classes/utils/sessionDisplay'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'

function formatCadenceForCard(pattern) {
  const labels = apiDaysToUiLabels(pattern.daysOfWeek || [])
  const ordered = [...labels].sort(
    (a, b) => UI_DAY_LABELS_ORDERED.indexOf(a) - UI_DAY_LABELS_ORDERED.indexOf(b),
  )
  // Detect Tue–Sun / Mon–Fri / Sat–Sun shortcuts on the day order to match the
  // operational language ("Tue–Sun · 5:15–6:30 AM") in the design.
  const apiNums = (pattern.daysOfWeek || []).slice().sort()
  let dayPart = ordered.join(' · ')
  if (apiNums.length === 5 && [1, 2, 3, 4, 5].every((d) => apiNums.includes(d))) {
    dayPart = 'Mon–Fri'
  } else if (apiNums.length === 2 && apiNums[0] === 0 && apiNums[1] === 6) {
    dayPart = 'Sat–Sun'
  } else if (apiNums.length >= 3) {
    let run = true
    for (let i = 1; i < apiNums.length; i += 1) {
      if (apiNums[i] !== apiNums[i - 1] + 1) {
        run = false
        break
      }
    }
    if (run) {
      const lookup = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      dayPart = `${lookup[apiNums[0]]}–${lookup[apiNums[apiNums.length - 1]]}`
    }
  }
  const start = formatSessionClock(pattern.startTime)
  const end = formatSessionClock(pattern.endTime)
  const timePart = start !== '—' && end !== '—' ? `${start}–${end}` : start !== '—' ? start : ''
  return [dayPart, timePart].filter(Boolean).join(' · ')
}

function PatternCard({
  pattern,
  onEdit,
  onSkipNext,
  onAdjustNext,
  onGenerateMissing,
  onDeactivate,
  hasUpcomingForPattern,
}) {
  const name = pattern.name || pattern.slotName || 'Recurring session'
  const cadence = formatCadenceForCard(pattern)
  const meta = []
  if (pattern.placeName) meta.push(stripDemoSuffix(pattern.placeName))
  if (pattern.coachName) meta.push(`Coach ${pattern.coachName}`)
  if (pattern.sessionFocus) meta.push(pattern.sessionFocus)

  return (
    <CCard className="onrep-surface-b border-0 mb-2">
      <CCardBody className="py-3 px-3 px-md-4">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div className="min-w-0 flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-semibold">{name}</span>
              {!pattern.isActive ? (
                <span className="badge bg-secondary-subtle text-secondary-emphasis fw-normal">
                  Inactive
                </span>
              ) : null}
            </div>
            <div className="onrep-type-level2 mt-1">{cadence || 'Unset'}</div>
            {meta.length ? (
              <div className="onrep-type-muted small mt-1 text-break">{meta.join(' · ')}</div>
            ) : null}
            {pattern.effectiveUntil ? (
              <div className="small text-body-secondary mt-1">Ends {pattern.effectiveUntil}</div>
            ) : null}
          </div>
          <div className="d-flex flex-shrink-0 gap-2 align-items-center">
            <CButton
              size="sm"
              color="primary"
              variant="outline"
              onClick={() => onEdit(pattern)}
              disabled={!pattern.isActive}
            >
              Edit
            </CButton>
            <CDropdown variant="btn-group" placement="bottom-end">
              <CDropdownToggle
                size="sm"
                color="secondary"
                variant="outline"
                caret={false}
                aria-label="More actions"
              >
                ⋯
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem
                  onClick={() => onGenerateMissing(pattern)}
                  disabled={!pattern.isActive}
                >
                  Generate missing sessions
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => onSkipNext(pattern)}
                  disabled={!hasUpcomingForPattern}
                >
                  Skip next session
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => onAdjustNext(pattern)}
                  disabled={!hasUpcomingForPattern}
                >
                  Adjust next session time
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem
                  className="text-danger"
                  onClick={() => onDeactivate(pattern)}
                  disabled={!pattern.isActive}
                >
                  Disable schedule
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
        </div>
      </CCardBody>
    </CCard>
  )
}

/**
 * Render a list of recurring session patterns as cards, plus an "Add" button.
 * Each card has Edit + a per-pattern operations menu (Skip next / Adjust next
 * / Generate missing / Disable). The advanced-operations accordion is retired
 * in favor of this per-pattern menu.
 */
export default function RecurringPatternsList({
  patterns,
  loading,
  error,
  batchId,
  hasUpcomingByPatternId,
  onAdd,
  onEdit,
  onSkipNext,
  onAdjustNext,
  onGenerateMissing,
  onDeactivate,
  onRefresh,
  onGenerateBatchWide,
}) {
  const active = patterns.filter((p) => p.isActive)
  const [historyOpen, setHistoryOpen] = useState(false)
  const inactive = patterns.filter((p) => !p.isActive)

  return (
    <section className="schedule-page__section-weekly">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <div className="onrep-type-label">Recurring session patterns</div>
          <div className="small text-body-secondary mt-1">
            A batch can have multiple recurring patterns (morning, evening, weekend, etc.).
          </div>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          {batchId ? (
            <CButton
              size="sm"
              color="secondary"
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </CButton>
          ) : null}
          {batchId ? (
            <CButton
              size="sm"
              color="secondary"
              variant="outline"
              onClick={onGenerateBatchWide}
              disabled={loading || active.length === 0}
              title="Materialize upcoming sessions from every active pattern on this batch"
            >
              Generate missing for batch
            </CButton>
          ) : null}
          <CButton size="sm" color="primary" disabled={!batchId} onClick={onAdd}>
            + Add recurring session
          </CButton>
        </div>
      </div>

      {error ? (
        <CAlert color="danger" className="py-2">
          {error.message || 'Could not load patterns.'}
        </CAlert>
      ) : null}

      {loading && !patterns.length ? (
        <div className="text-body-secondary small py-3 d-flex align-items-center gap-2">
          <CSpinner size="sm" /> Loading recurring patterns…
        </div>
      ) : null}

      {!loading && !patterns.length && batchId ? (
        <CAlert color="info" className="mb-0 py-2 small">
          No recurring patterns yet — add one to start generating sessions.
        </CAlert>
      ) : null}
      {!loading && !batchId ? (
        <CAlert color="light" className="mb-0 py-2 small">
          Select a batch above to view its recurring patterns.
        </CAlert>
      ) : null}

      {active.map((p) => (
        <PatternCard
          key={p.id}
          pattern={p}
          onEdit={onEdit}
          onSkipNext={onSkipNext}
          onAdjustNext={onAdjustNext}
          onGenerateMissing={onGenerateMissing}
          onDeactivate={onDeactivate}
          hasUpcomingForPattern={Boolean(hasUpcomingByPatternId?.[p.id])}
        />
      ))}

      {inactive.length ? (
        <div className="mt-3">
          <CButton
            color="link"
            className="px-0 text-decoration-none"
            onClick={() => setHistoryOpen((v) => !v)}
          >
            {historyOpen
              ? `Hide history (${inactive.length})`
              : `View history (${inactive.length})`}
          </CButton>
          {historyOpen ? (
            <div className="mt-2">
              {inactive.map((p) => (
                <PatternCard
                  key={p.id}
                  pattern={p}
                  onEdit={() => {}}
                  onSkipNext={() => {}}
                  onAdjustNext={() => {}}
                  onGenerateMissing={() => {}}
                  onDeactivate={() => {}}
                  hasUpcomingForPattern={false}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
