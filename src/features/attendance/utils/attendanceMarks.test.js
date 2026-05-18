import { describe, expect, it } from 'vitest'
import { draftMarksToApiPayload, toggleAttendanceStatus } from './attendanceMarks'

describe('attendanceMarks', () => {
  it('toggleAttendanceStatus clears when same target tapped', () => {
    expect(toggleAttendanceStatus('present', 'present')).toBe(null)
    expect(toggleAttendanceStatus('absent', 'absent')).toBe(null)
    expect(toggleAttendanceStatus('present', null)).toBe('present')
    expect(toggleAttendanceStatus('absent', 'present')).toBe('absent')
  })

  it('draftMarksToApiPayload maps unmark and present', () => {
    const payload = draftMarksToApiPayload({
      a: { studentId: 'a', status: null },
      b: { studentId: 'b', status: 'present' },
      c: { studentId: 'c', status: 'absent' },
    })
    expect(payload).toContainEqual({ studentId: 'a', unmark: true })
    expect(payload).toContainEqual({ studentId: 'b', present: true })
    expect(payload).toContainEqual({ studentId: 'c', present: false })
  })
})
