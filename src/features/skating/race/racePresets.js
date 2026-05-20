/** Coach-facing race presets — maps to generic engine run types internally. */

export const VENUE_LABELS = {
  RINK: 'Rink',
  TRACK: 'Track',
  POOL: 'Pool',
}

export const RACE_PRESETS = [
  {
    id: '5_LAP',
    title: '5 Laps',
    targetProgressCount: 5,
    distanceLabel: null,
    venueType: 'RINK',
    runType: 'HEAT_RACE',
    progressionMode: 'PACK',
    requiresParticipantPick: false,
    requiresTeamSetup: false,
    flowMode: 'HEAT',
    context: { autoDistanceFromVenue: false, autoVenueLabel: true },
  },
  {
    id: '2_LAP_SPRINT',
    title: '2 Lap Sprint',
    targetProgressCount: 2,
    distanceLabel: '500 m',
    venueType: 'RINK',
    runType: 'HEAT_RACE',
    progressionMode: 'PACK',
    requiresParticipantPick: false,
    requiresTeamSetup: false,
    flowMode: 'HEAT',
    context: { autoDistanceFromVenue: false, autoVenueLabel: true },
  },
  {
    id: '10_LAP',
    title: '10 Laps',
    targetProgressCount: 10,
    distanceLabel: null,
    venueType: 'RINK',
    runType: 'ENDURANCE_LAPS',
    progressionMode: 'PER_PARTICIPANT',
    requiresParticipantPick: false,
    requiresTeamSetup: false,
    flowMode: 'TIMER',
    context: { autoDistanceFromVenue: false, autoVenueLabel: true },
  },
  {
    id: 'FLYING_LAP',
    title: 'Flying Lap',
    targetProgressCount: 1,
    distanceLabel: null,
    venueType: 'RINK',
    runType: 'FLYING_LAP',
    progressionMode: 'PER_PARTICIPANT',
    requiresParticipantPick: false,
    requiresTeamSetup: false,
    flowMode: 'TIMER',
    context: { autoDistanceFromVenue: false, autoVenueLabel: true },
  },
  {
    id: 'RELAY',
    title: 'Relay',
    targetProgressCount: 4,
    distanceLabel: null,
    venueType: 'RINK',
    runType: 'RELAY_RACE',
    progressionMode: 'PER_TEAM',
    requiresParticipantPick: true,
    requiresTeamSetup: true,
    flowMode: 'RELAY',
    context: { autoDistanceFromVenue: false, autoVenueLabel: true },
  },
  {
    id: 'ELIMINATION',
    title: 'Elimination',
    targetProgressCount: 1,
    distanceLabel: null,
    venueType: 'RINK',
    runType: 'ELIMINATION_RACE',
    progressionMode: 'PACK',
    requiresParticipantPick: false,
    requiresTeamSetup: false,
    flowMode: 'HEAT',
    context: { autoDistanceFromVenue: false, autoVenueLabel: true },
  },
  {
    id: 'ENDURANCE',
    title: 'Endurance',
    targetProgressCount: 20,
    distanceLabel: null,
    venueType: 'RINK',
    runType: 'ENDURANCE_LAPS',
    progressionMode: 'PER_PARTICIPANT',
    requiresParticipantPick: false,
    requiresTeamSetup: false,
    flowMode: 'TIMER',
    context: { autoDistanceFromVenue: false, autoVenueLabel: true },
  },
]

export const CUSTOM_PRESET = {
  id: 'CUSTOM',
  title: 'Custom',
  subtitle: 'Set laps and distance manually',
  isCustom: true,
}

/**
 * @param {object} preset
 * @param {object} [sessionContext]
 */
export function resolvePresetForSession(preset, sessionContext = {}) {
  if (!preset || preset.isCustom) return preset
  const resolved = { ...preset }
  if (preset.context?.autoDistanceFromVenue && sessionContext.venueDistanceLabel) {
    resolved.distanceLabel = sessionContext.venueDistanceLabel
  }
  resolved.subtitle = buildPresetSubtitle(resolved)
  return resolved
}

/**
 * @param {object} preset
 */
export function buildPresetSubtitle(preset) {
  if (preset.subtitle) return preset.subtitle
  const parts = []
  if (preset.targetProgressCount != null) {
    const n = preset.targetProgressCount
    parts.push(`${n} ${n === 1 ? 'lap' : 'laps'}`)
  }
  if (preset.distanceLabel) parts.push(preset.distanceLabel)
  if (preset.context?.autoVenueLabel !== false && preset.venueType) {
    parts.push(VENUE_LABELS[preset.venueType] || preset.venueType)
  }
  return parts.join(' • ')
}

export function resolvePreset(presetId) {
  if (presetId === 'CUSTOM') return CUSTOM_PRESET
  return RACE_PRESETS.find((p) => p.id === presetId) || null
}

export function listPickerPresets() {
  return RACE_PRESETS.map((p) => ({
    ...p,
    subtitle: buildPresetSubtitle(p),
  }))
}

/**
 * @param {object} preset
 * @param {object} opts
 */
export function buildPresetStartPatch(preset, opts = {}) {
  const {
    raceSequence = 1,
    participantIds = [],
    customLaps,
    customDistance,
  } = opts
  const laps = customLaps ?? preset.targetProgressCount ?? 5
  const distance = customDistance ?? preset.distanceLabel ?? null

  const patch = {
    heat_number: raceSequence,
    progression_config: {
      enabled: true,
      target_progress_count: laps,
      progression_mode: preset.progressionMode || 'PACK',
      distance_label: distance,
      locked: true,
    },
    race_meta: {
      status: 'active',
      presetId: preset.id,
      title: preset.title,
      startedAt: new Date().toISOString(),
      timerStartedAt: Date.now(),
      participantIds: participantIds.map(String),
      raceSequence,
      currentLap: 0,
      targetLaps: laps,
    },
  }

  if (preset.progressionMode === 'PER_TEAM') {
    patch.teams = []
  } else if (participantIds.length) {
    patch.results = participantIds.map((sid) => ({
      student_id: String(sid),
      participated: true,
      source: 'COACH_CONFIRMED',
      progress_events: [],
    }))
  }

  return patch
}

/**
 * @param {{ raceSequence?: number, currentLap?: number, targetLaps?: number, isLive?: boolean }} p
 */
export function buildRaceStatusLine({ raceSequence, currentLap, targetLaps, isLive = true }) {
  const parts = []
  if (isLive) parts.push('LIVE')
  if (raceSequence != null && raceSequence > 0) {
    parts.push(`Race ${raceSequence}`)
  }
  if (targetLaps != null && targetLaps > 0) {
    const lap = Math.min((currentLap ?? 0) + 1, targetLaps)
    parts.push(`Lap ${lap}/${targetLaps}`)
  }
  return parts.join(' • ')
}

export function athleteIdsFromSession(athletes = []) {
  return athletes
    .map((a) => String(a.studentId || a.id || ''))
    .filter(Boolean)
}
