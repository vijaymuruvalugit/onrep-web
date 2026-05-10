import React from 'react'
import StudentRosterCard from './StudentRosterCard'

export default function BatchStudentsRoster({ students, onRequestRemove, mutationLoading }) {
  return (
    <section className="onrep-batch-roster" aria-label="Students in this batch">
      <div className="onrep-type-label mb-3">Current students</div>
      <div className="onrep-batch-roster-list">
        {students.map((student) => (
          <StudentRosterCard
            key={student.id || student._id}
            student={student}
            onRequestRemove={onRequestRemove}
            removeDisabled={mutationLoading}
          />
        ))}
      </div>
    </section>
  )
}
