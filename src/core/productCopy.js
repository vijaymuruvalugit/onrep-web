/**
 * Product language governance — internal terms mapped to role-facing copy.
 * @see plan: consistency language governance
 */

export const PRODUCT_TERMS = Object.freeze({
  module: 'tool',
  operationalSession: 'session',
  observationEntity: 'observation',
  presetMaterialization: 'session preset',
  skatingOps: 'Live sessions',
  dashboard: 'Home',
})

export const NAV_LABELS = Object.freeze({
  coachHome: 'Home',
  liveSessions: 'Live sessions',
  payments: 'Payments',
  parentOverview: 'Overview',
  parentParticipation: 'Participation',
  studentProgress: 'My progress',
  studentSessions: 'Sessions',
  studentParticipation: 'Participation',
})

/** Coach session execution — avoid standalone attendance product language. */
export const COACH_PARTICIPATION_COPY = Object.freeze({
  rosterCheckIn: 'Roster check-in',
  sessionParticipation: 'Session participation',
  activeAthletes: 'Active athletes',
  participationStatus: 'Participation status',
  participationPending: 'Participation pending',
  openLiveSession: 'Open live session',
  resumeSession: 'Resume session',
  startSession: 'Start session',
})

/** Family-facing participation history. */
export const FAMILY_PARTICIPATION_COPY = Object.freeze({
  pageTitle: 'Participation',
  pageSubtitle: 'Session participation and consistency for your athletes.',
  snapshotTitle: 'Participation snapshot',
  consistency: 'Consistency',
})
