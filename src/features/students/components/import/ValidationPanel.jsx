import React, { useMemo } from 'react'
import { CAlert, CBadge } from '@coreui/react'

const SEVERITY_COLOR = {
  error: 'danger',
  warning: 'warning',
  info: 'info',
}

const ValidationPanel = ({ rows }) => {
  const issues = useMemo(() => {
    const list = []
    for (const row of rows || []) {
      for (const issue of row.issues || []) {
        list.push({ ...issue, source_row_number: row.source_row_number })
      }
    }
    const order = { error: 0, warning: 1, info: 2 }
    return list.sort((a, b) => {
      const sa = order[a.severity] ?? 9
      const sb = order[b.severity] ?? 9
      if (sa !== sb) return sa - sb
      return (a.source_row_number || 0) - (b.source_row_number || 0)
    })
  }, [rows])

  if (!issues.length) {
    return (
      <CAlert color="success" className="mb-0">
        No issues found. You can import all rows.
      </CAlert>
    )
  }

  const show = issues.slice(0, 40)
  const more = issues.length - show.length

  return (
    <div>
      <ul className="list-unstyled mb-0">
        {show.map((issue, idx) => (
          <li key={`${issue.code}-${issue.source_row_number}-${idx}`} className="mb-2 d-flex gap-2">
            <CBadge color={SEVERITY_COLOR[issue.severity] || 'secondary'} className="text-uppercase">
              {issue.severity}
            </CBadge>
            <span className="small">{issue.message}</span>
          </li>
        ))}
      </ul>
      {more > 0 ? (
        <div className="small text-body-secondary mt-2">+ {more} more issue(s) in the table below</div>
      ) : null}
      <CAlert color="light" className="mt-3 mb-0 small">
        Fix issues in your spreadsheet, then upload again. Inline editing is not supported here.
      </CAlert>
    </div>
  )
}

export default ValidationPanel
