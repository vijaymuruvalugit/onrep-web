/** Coach-facing launch chips — emoji + short label (UX only, not API). */
export const RUN_LAUNCH_META = {
  HEAT_RACE: { emoji: '🏁', shortLabel: 'Heat', accent: 'heat' },
  TIME_TRIAL: { emoji: '⏱', shortLabel: 'Sprint', accent: 'sprint' },
  SKILL_RACE: { emoji: '🎯', shortLabel: 'Skill', accent: 'skill' },
  RELAY_RACE: { emoji: '🔄', shortLabel: 'Relay', accent: 'relay' },
  ELIMINATION_RACE: { emoji: '🔥', shortLabel: 'Elim', accent: 'elim' },
  FLYING_LAP: { emoji: '💨', shortLabel: 'Flying', accent: 'flying' },
  REACTION_TIMING: { emoji: '⚡', shortLabel: 'React', accent: 'react' },
  ENDURANCE_LAPS: { emoji: '🔁', shortLabel: 'Endure', accent: 'endure' },
  ASSESSMENT: { emoji: '📋', shortLabel: 'Assess', accent: 'assess' },
  POSE_HOLD: { emoji: '🧘', shortLabel: 'Pose', accent: 'pose' },
  BREATH_CYCLE: { emoji: '🌬', shortLabel: 'Breath', accent: 'breath' },
  MEDITATION_BLOCK: { emoji: '🧠', shortLabel: 'Calm', accent: 'calm' },
  ROUTINE_RUN: { emoji: '💃', shortLabel: 'Routine', accent: 'routine' },
  PRACTICE_RUN: { emoji: '🎵', shortLabel: 'Practice', accent: 'practice' },
}

export function getRunLaunchMeta(runType) {
  return RUN_LAUNCH_META[String(runType || '').toUpperCase()] || {
    emoji: '▶',
    shortLabel: 'Run',
    accent: 'default',
  }
}
