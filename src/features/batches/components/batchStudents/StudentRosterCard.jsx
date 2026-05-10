import React from 'react'
import { Link } from 'react-router-dom'
import { CButton } from '@coreui/react'
import { getStudentParent } from '../../../students/utils/studentMappers'

export default function StudentRosterCard({ student, onRequestRemove, removeDisabled }) {
  const studentId = student.id || student._id
  const name = student.full_name || student.name || 'Student'
  const parent = getStudentParent(student)
  const parentLine =
    parent && parent !== '—' ? `Parent: ${parent}` : null

  return (
    <article className="onrep-batch-roster-card">
      <div className="onrep-batch-roster-card__body">
        <Link
          to={`/coach/students/${encodeURIComponent(studentId)}`}
          className="onrep-batch-roster-card__name text-decoration-none"
        >
          {name}
        </Link>
        {parentLine ? (
          <div className="onrep-batch-roster-card__meta">{parentLine}</div>
        ) : null}
        {/* Reserved row for future: level badge, attendance %, last session */}
        <div className="onrep-batch-roster-card__future-slot" aria-hidden />
      </div>
      <div className="onrep-batch-roster-card__actions">
        <CButton
          color="link"
          className="onrep-batch-roster-card__remove px-2 text-body-secondary"
          disabled={removeDisabled}
          onClick={() => onRequestRemove(student)}
        >
          Remove
        </CButton>
      </div>
    </article>
  )
}
