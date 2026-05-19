/**
 * Aligned with ezyplay-backend/src/domain/sessionRuns/activityRunDefinitions.js
 * Keep type keys and payloadVersion in sync (see activityRunDefinitions.sync.test.js).
 */

export const ACTIVITY_RUN_CATEGORIES = {
  SPORT_RACE: 'SPORT_RACE',
  SPORT_DRILL: 'SPORT_DRILL',
  YOGA_FLOW: 'YOGA_FLOW',
  YOGA_BREATH: 'YOGA_BREATH',
  DANCE_ROUTINE: 'DANCE_ROUTINE',
  MUSIC_EXERCISE: 'MUSIC_EXERCISE',
  ASSESSMENT: 'ASSESSMENT',
  WELLNESS: 'WELLNESS',
  GENERAL: 'GENERAL',
}

const PV = 1
const PV2 = 2

const PROGRESSION_DEFAULTS = {
  progression_config: {
    enabled: true,
    target_progress_count: 5,
    progression_mode: 'PACK',
    distance_label: null,
    locked: false,
  },
}

function cap(overrides) {
  return {
    timing: false,
    ranking: false,
    laps: false,
    progression: false,
    teams: false,
    scoring: false,
    penalties: false,
    notes: false,
    attempts: false,
    rounds: false,
    reaction: false,
    breathing: false,
    duration: false,
    participation: true,
    ...overrides,
  }
}

/** @type {import('./activityRunTypes').ActivityRunDefinition[]} */
const LIST = [
  {
    type: 'HEAT_RACE',
    label: 'Heat Race',
    category: 'SPORT_RACE',
    activityTypes: ['skating', 'swimming'],
    ui: { mode: 'HEAT' },
    capabilities: cap({ timing: true, ranking: true, progression: true }),
    measurementMode: 'TIME_AND_RANK',
    payloadVersion: PV2,
    progressionConfig: { enabled: true, defaultCount: 5, maxCount: 100 },
    progressionMode: 'PACK',
    progressionMetricProfile: ['timing'],
    progressionLabel: 'Lap',
    progressionPluralLabel: 'Laps',
    captureProgressLabel: 'Capture Lap',
    startActionLabel: 'Start Heat',
    completeActionLabel: 'Finish Heat',
    icon: 'trophy',
    color: 'primary',
  },
  {
    type: 'TIME_TRIAL',
    label: 'Time Trial',
    category: 'SPORT_RACE',
    activityTypes: ['skating', 'swimming'],
    ui: { mode: 'TIMER' },
    capabilities: cap({ timing: true, attempts: true }),
    measurementMode: 'TIME',
    payloadVersion: PV,
    icon: 'timer',
    color: 'info',
  },
  {
    type: 'SKILL_RACE',
    label: 'Skill Race',
    category: 'SPORT_DRILL',
    activityTypes: ['skating'],
    ui: { mode: 'TIMER' },
    capabilities: cap({ timing: true, penalties: true }),
    measurementMode: 'TIME',
    payloadVersion: PV,
    icon: 'cone',
    color: 'warning',
  },
  {
    type: 'RELAY_RACE',
    label: 'Relay Race',
    category: 'SPORT_RACE',
    activityTypes: ['skating', 'swimming'],
    ui: { mode: 'RELAY' },
    capabilities: cap({ timing: true, teams: true, penalties: true, progression: true }),
    measurementMode: 'TIME',
    payloadVersion: PV2,
    progressionConfig: { enabled: true, defaultCount: 4, maxCount: 50 },
    progressionMode: 'PER_TEAM',
    progressionMetricProfile: ['timing'],
    progressionLabel: 'Lap',
    progressionPluralLabel: 'Laps',
    captureProgressLabel: 'Capture Lap',
    startActionLabel: 'Start Relay',
    completeActionLabel: 'Finish Relay',
    icon: 'people',
    color: 'primary',
  },
  {
    type: 'ELIMINATION_RACE',
    label: 'Elimination',
    category: 'SPORT_RACE',
    activityTypes: ['skating'],
    ui: { mode: 'HEAT' },
    capabilities: cap({ timing: true, ranking: true, rounds: true }),
    measurementMode: 'HYBRID',
    payloadVersion: PV,
    icon: 'filter',
    color: 'danger',
  },
  {
    type: 'FLYING_LAP',
    label: 'Flying Lap',
    category: 'SPORT_DRILL',
    activityTypes: ['skating'],
    ui: { mode: 'TIMER' },
    capabilities: cap({ timing: true, progression: true }),
    measurementMode: 'TIME',
    payloadVersion: PV2,
    progressionConfig: { enabled: true, defaultCount: 1, maxCount: 20 },
    progressionMode: 'PER_PARTICIPANT',
    progressionMetricProfile: ['timing'],
    progressionLabel: 'Lap',
    progressionPluralLabel: 'Laps',
    captureProgressLabel: 'Capture Lap',
    startActionLabel: 'Start',
    completeActionLabel: 'Finish',
    icon: 'speed',
    color: 'info',
  },
  {
    type: 'REACTION_TIMING',
    label: 'Reaction',
    category: 'SPORT_DRILL',
    activityTypes: ['skating'],
    ui: { mode: 'TIMER' },
    capabilities: cap({ reaction: true, timing: true }),
    measurementMode: 'TIME',
    payloadVersion: PV,
    icon: 'bolt',
    color: 'warning',
  },
  {
    type: 'ENDURANCE_LAPS',
    label: 'Endurance',
    category: 'SPORT_DRILL',
    activityTypes: ['skating', 'swimming'],
    ui: { mode: 'TIMER' },
    capabilities: cap({ timing: true, progression: true }),
    measurementMode: 'TIME',
    payloadVersion: PV2,
    progressionConfig: { enabled: true, defaultCount: 10, maxCount: 100 },
    progressionMode: 'PER_PARTICIPANT',
    progressionMetricProfile: ['timing'],
    progressionLabel: 'Lap',
    progressionPluralLabel: 'Laps',
    captureProgressLabel: 'Capture Lap',
    startActionLabel: 'Start',
    completeActionLabel: 'Finish',
    icon: 'loop',
    color: 'success',
  },
  {
    type: 'ASSESSMENT',
    label: 'Assessment',
    category: 'ASSESSMENT',
    activityTypes: ['skating', 'yoga', 'dance', 'music', 'wellness'],
    ui: { mode: 'SCORING' },
    capabilities: cap({ scoring: true, notes: true }),
    measurementMode: 'SCORE',
    payloadVersion: PV,
    icon: 'clipboard',
    color: 'secondary',
  },
  {
    type: 'POSE_HOLD',
    label: 'Pose Hold',
    category: 'YOGA_FLOW',
    activityTypes: ['yoga'],
    ui: { mode: 'PARTICIPATION' },
    capabilities: cap({ duration: true }),
    measurementMode: 'DURATION',
    payloadVersion: PV,
    icon: 'pose',
    color: 'success',
  },
  {
    type: 'BREATH_CYCLE',
    label: 'Breath Cycle',
    category: 'YOGA_BREATH',
    activityTypes: ['yoga', 'wellness'],
    ui: { mode: 'TIMER' },
    capabilities: cap({ timing: true, rounds: true, breathing: true }),
    measurementMode: 'DURATION',
    payloadVersion: PV,
    icon: 'wind',
    color: 'info',
  },
  {
    type: 'MEDITATION_BLOCK',
    label: 'Meditation',
    category: 'WELLNESS',
    activityTypes: ['yoga', 'wellness'],
    ui: { mode: 'PARTICIPATION' },
    capabilities: cap({ duration: true }),
    measurementMode: 'COMPLETION',
    payloadVersion: PV,
    icon: 'peace',
    color: 'secondary',
  },
  {
    type: 'ROUTINE_RUN',
    label: 'Routine',
    category: 'DANCE_ROUTINE',
    activityTypes: ['dance'],
    ui: { mode: 'SCORING' },
    capabilities: cap({ scoring: true, notes: true }),
    measurementMode: 'SCORE',
    payloadVersion: PV,
    icon: 'music',
    color: 'primary',
  },
  {
    type: 'PRACTICE_RUN',
    label: 'Practice',
    category: 'MUSIC_EXERCISE',
    activityTypes: ['music'],
    ui: { mode: 'SCORING' },
    capabilities: cap({ duration: true, scoring: true, notes: true }),
    measurementMode: 'HYBRID',
    payloadVersion: PV,
    icon: 'note',
    color: 'info',
  },
]

export const ACTIVITY_RUN_TYPES = LIST.map((d) => d.type)

export const activityRunDefinitions = Object.freeze(
  Object.fromEntries(LIST.map((d) => [d.type, Object.freeze(d)])),
)

export function getActivityRunDefinition(runType) {
  if (!runType) return null
  return activityRunDefinitions[String(runType).toUpperCase()] || null
}

export function getDefinitionTypeKeys() {
  return ACTIVITY_RUN_TYPES.slice()
}

export function getDefinitionPayloadVersions() {
  return Object.fromEntries(LIST.map((d) => [d.type, d.payloadVersion]))
}

export function getProgressionDefaults(runType) {
  const def = getActivityRunDefinition(runType)
  if (!def?.capabilities?.progression) return null
  const mode = def.progressionMode || 'PACK'
  const count = def.progressionConfig?.defaultCount ?? 5
  return {
    payload_version: def.payloadVersion,
    progression_config: {
      ...PROGRESSION_DEFAULTS.progression_config,
      target_progress_count: count,
      progression_mode: mode,
    },
    results: [],
    teams: mode === 'PER_TEAM' ? [] : undefined,
  }
}
