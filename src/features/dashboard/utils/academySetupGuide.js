/**
 * Launch-readiness checklist — frontend presentation + completion rules.
 * Backend returns facts only; routes live here.
 */

export const ACADEMY_SETUP_CORE_STEPS = Object.freeze([
  {
    id: 'academy_details',
    title: 'Complete academy details',
    haveReady: 'Have ready: academy name, primary contact, and academy timezone.',
    ctaLabel: 'Open academy settings',
    to: '/coach/account',
    required: true,
  },
  {
    id: 'enable_activity',
    title: 'Enable your activity',
    haveReady: 'Have ready: the activity your academy will operate (OnRep is skating-first).',
    ctaLabel: 'Enable activity',
    to: '/coach/activities',
    required: true,
  },
  {
    id: 'add_coaches',
    title: 'Add coaches',
    haveReady: 'Have ready: coach name, email or phone, and intended access.',
    ctaLabel: 'Open Coaches',
    to: '/coach/onboarding/coaches',
    required: true,
  },
  {
    id: 'create_batches',
    title: 'Create batches',
    haveReady: 'Have ready: batch name, activity, level/grouping, and capacity where supported.',
    ctaLabel: 'Open Batches',
    to: '/coach/batches',
    required: true,
  },
  {
    id: 'enrol_students',
    title: 'Add and enrol students',
    haveReady: 'Have ready: student details, guardian contact where available, and intended batch.',
    ctaLabel: 'Add students',
    to: '/coach/students/new',
    required: true,
  },
  {
    id: 'assign_coaches',
    title: 'Assign coaches',
    haveReady: 'Have ready: which coach runs each batch/session.',
    ctaLabel: 'Assign coaches',
    to: '/coach/batches',
    required: true,
  },
  {
    id: 'first_schedule',
    title: 'Create the first schedule',
    haveReady:
      'Have ready: batch, coach, venue/location, days, start time, academy timezone, recurrence, and start date.',
    ctaLabel: 'Open Schedule',
    to: '/coach/schedule',
    required: true,
  },
])

export const ACADEMY_SETUP_RECOMMENDED_STEPS = Object.freeze([
  {
    id: 'set_up_fees',
    title: 'Set up fees',
    haveReady: 'Have ready: amount, billing period, effective date, and due-date policy.',
    ctaLabel: 'Set up fees',
    to: '/coach/payments/settings',
    required: false,
  },
  {
    id: 'connect_guardians',
    title: 'Connect parents or guardians',
    haveReady:
      'Have ready: verified parent/guardian email or phone and the correct child relationship.',
    ctaLabel: 'Connect parents',
    to: '/coach/parents',
    required: false,
  },
])

export const ACADEMY_SETUP_ALL_STEPS = Object.freeze([
  ...ACADEMY_SETUP_CORE_STEPS,
  ...ACADEMY_SETUP_RECOMMENDED_STEPS,
])

export function isStepComplete(stepId, facts = {}) {
  switch (stepId) {
    case 'academy_details':
      return facts.academyProfileComplete === true
    case 'enable_activity':
      return Number(facts.enabledActivityCount || 0) >= 1
    case 'add_coaches':
      return Number(facts.activeCoachCount || 0) >= 1
    case 'create_batches':
      return Number(facts.activeBatchCount || 0) >= 1
    case 'enrol_students':
      return Number(facts.enrolledStudentCount || 0) >= 1
    case 'assign_coaches':
      return (
        Number(facts.activeBatchCount || 0) >= 1 && Number(facts.unstaffedBatchCount || 0) === 0
      )
    case 'first_schedule':
      return Number(facts.upcomingSessionCount || 0) >= 1
    case 'set_up_fees':
      return Number(facts.activeFeeAssignmentCount || 0) >= 1
    case 'connect_guardians':
      return Number(facts.approvedGuardianCount || 0) >= 1
    default:
      return false
  }
}

export function buildAcademySetupGuideModel(payload) {
  const facts = payload?.facts || {}
  const coreSteps = ACADEMY_SETUP_CORE_STEPS.map((step) => ({
    ...step,
    complete: isStepComplete(step.id, facts),
  }))
  const recommendedSteps = ACADEMY_SETUP_RECOMMENDED_STEPS.map((step) => ({
    ...step,
    complete: isStepComplete(step.id, facts),
  }))
  const coreCompleted = coreSteps.filter((s) => s.complete).length
  const coreTotal = coreSteps.length
  const nextCore = coreSteps.find((s) => !s.complete) || null
  const readyToRun = payload?.readyToRun === true || (coreCompleted === coreTotal && coreTotal > 0)
  const noEnabledActivity = Number(facts.enabledActivityCount || 0) === 0

  return {
    academyId: payload?.academyId || null,
    activityId: payload?.activityId || null,
    facts,
    coreSteps,
    recommendedSteps,
    coreCompleted,
    coreTotal,
    nextCoreId: nextCore?.id || null,
    readyToRun,
    noEnabledActivity,
    generatedAt: payload?.generatedAt || null,
  }
}
