import { describe, expect, it } from 'vitest'
import {
  ACADEMY_SETUP_ALL_STEPS,
  ACADEMY_SETUP_CORE_STEPS,
  ACADEMY_SETUP_RECOMMENDED_STEPS,
  buildAcademySetupGuideModel,
  isStepComplete,
} from './academySetupGuide'
import { DASHBOARD_PAGES } from '../../../routes/dashboardPagesRegistration'

const CORE_IDS = [
  'academy_details',
  'enable_activity',
  'create_places',
  'add_coaches',
  'add_students',
  'create_batches',
  'enrol_students',
  'assign_coaches',
  'first_schedule',
]

describe('academySetupGuide', () => {
  it('renders core then recommended steps in the defined order', () => {
    expect(ACADEMY_SETUP_CORE_STEPS.map((s) => s.id)).toEqual(CORE_IDS)
    expect(ACADEMY_SETUP_RECOMMENDED_STEPS.map((s) => s.id)).toEqual([
      'set_up_fees',
      'connect_guardians',
    ])
    expect(ACADEMY_SETUP_ALL_STEPS.map((s) => s.id)).toEqual([
      ...CORE_IDS,
      'set_up_fees',
      'connect_guardians',
    ])
  })

  it('keeps required and recommended sections distinct', () => {
    expect(ACADEMY_SETUP_CORE_STEPS.every((s) => s.required)).toBe(true)
    expect(ACADEMY_SETUP_RECOMMENDED_STEPS.every((s) => s.required === false)).toBe(true)
  })

  it('CTA hrefs use registered dashboard routes', () => {
    for (const step of ACADEMY_SETUP_ALL_STEPS) {
      expect(DASHBOARD_PAGES[step.to], `missing page for ${step.to}`).toBeDefined()
    }
    expect(DASHBOARD_PAGES['/coach/schedule']).toBeDefined()
    expect(DASHBOARD_PAGES['/coach/places']).toBeDefined()
    expect(DASHBOARD_PAGES['/coach/students/new']).toBeDefined()
  })

  it('marks the first incomplete required step as next', () => {
    const model = buildAcademySetupGuideModel({
      readyToRun: false,
      facts: {
        academyProfileComplete: true,
        enabledActivityCount: 1,
        activePlaceCount: 0,
        activeCoachCount: 0,
        activeStudentCount: 0,
        activeBatchCount: 0,
        enrolledStudentCount: 0,
        unstaffedBatchCount: 0,
        upcomingSessionCount: 0,
        activeFeeAssignmentCount: 0,
        approvedGuardianCount: 0,
      },
    })
    expect(model.coreCompleted).toBe(2)
    expect(model.coreTotal).toBe(9)
    expect(model.nextCoreId).toBe('create_places')
    expect(model.coreSteps.find((s) => s.id === 'academy_details').complete).toBe(true)
    expect(model.coreSteps.find((s) => s.id === 'create_places').complete).toBe(false)
  })

  it('does not treat an owner without coach membership as add-coaches complete', () => {
    expect(isStepComplete('add_coaches', { activeCoachCount: 0 })).toBe(false)
    expect(isStepComplete('add_coaches', { activeCoachCount: 1 })).toBe(true)
  })

  it('marks add-students complete from standalone students, not batch enrolment', () => {
    expect(isStepComplete('add_students', { activeStudentCount: 0, enrolledStudentCount: 1 })).toBe(
      false,
    )
    expect(isStepComplete('add_students', { activeStudentCount: 1, enrolledStudentCount: 0 })).toBe(
      true,
    )
  })

  it('requires enrolment in a batch after students and batches exist', () => {
    expect(isStepComplete('enrol_students', { enrolledStudentCount: 0 })).toBe(false)
    expect(isStepComplete('enrol_students', { enrolledStudentCount: 1 })).toBe(true)
  })

  it('assign-coaches stays incomplete until every batch is staffed', () => {
    expect(isStepComplete('assign_coaches', { activeBatchCount: 0, unstaffedBatchCount: 0 })).toBe(
      false,
    )
    expect(isStepComplete('assign_coaches', { activeBatchCount: 2, unstaffedBatchCount: 1 })).toBe(
      false,
    )
    expect(isStepComplete('assign_coaches', { activeBatchCount: 2, unstaffedBatchCount: 0 })).toBe(
      true,
    )
  })

  it('core completion yields the ready flag even when recommended steps are open', () => {
    const model = buildAcademySetupGuideModel({
      readyToRun: true,
      facts: {
        academyProfileComplete: true,
        enabledActivityCount: 1,
        activePlaceCount: 1,
        activeCoachCount: 2,
        activeStudentCount: 4,
        activeBatchCount: 1,
        enrolledStudentCount: 4,
        unstaffedBatchCount: 0,
        upcomingSessionCount: 3,
        activeFeeAssignmentCount: 0,
        approvedGuardianCount: 0,
      },
    })
    expect(model.readyToRun).toBe(true)
    expect(model.coreCompleted).toBe(9)
    expect(model.nextCoreId).toBeNull()
    expect(model.recommendedSteps.every((s) => !s.complete)).toBe(true)
  })

  it('flags no enabled activity without treating it as fully unconfigured', () => {
    const model = buildAcademySetupGuideModel({
      facts: {
        academyProfileComplete: true,
        enabledActivityCount: 0,
      },
    })
    expect(model.noEnabledActivity).toBe(true)
    expect(model.coreSteps[0].complete).toBe(true)
    expect(model.nextCoreId).toBe('enable_activity')
  })
})
