import { describe, it, expect } from 'vitest'
import {
  athleteInitials,
  shortAthleteLabel,
  cohortNamesFromAthletes,
} from './athleteDisplayName.js'

describe('shortAthleteLabel', () => {
  it('uses first name when it is unique', () => {
    const names = ['Aarav Desai', 'Aditi Gupta']
    expect(shortAthleteLabel('Aarav Desai', names)).toBe('Aarav')
    expect(shortAthleteLabel('Aditi Gupta', names)).toBe('Aditi')
  })

  it('adds last initial when first names collide', () => {
    const names = [
      'Aarav Desai',
      'Aarav Gupta',
      'Aarav Kapoor',
      'Aarav Singh',
      'Aarav Verma',
      'Aditi Gupta',
    ]
    expect(shortAthleteLabel('Aarav Desai', names)).toBe('Aarav D.')
    expect(shortAthleteLabel('Aarav Gupta', names)).toBe('Aarav G.')
    expect(shortAthleteLabel('Aditi Gupta', names)).toBe('Aditi')
  })

  it('initials use first and last', () => {
    expect(athleteInitials('Aarav Desai')).toBe('AD')
    expect(athleteInitials('Aditi Gupta')).toBe('AG')
  })

  it('reads names from mixed athlete shapes', () => {
    expect(
      cohortNamesFromAthletes([
        { student_full_name: 'Aarav Desai' },
        { fullName: 'Aarav Gupta' },
      ]),
    ).toEqual(['Aarav Desai', 'Aarav Gupta'])
  })
})
