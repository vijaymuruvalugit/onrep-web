/** Mode-scoped tag presets — must match backend quickCoaching.constants.js */
export const TAGS_BY_SESSION_MODE = {
  practice: [
    { key: 'fatigue', label: 'Fatigue' },
    { key: 'distracted', label: 'Distracted' },
    { key: 'focused', label: 'Focused' },
  ],
  competition: [
    { key: 'aggressive', label: 'Aggressive' },
    { key: 'weak_finish', label: 'Weak finish' },
    { key: 'false_start', label: 'False start' },
  ],
  assessment: [
    { key: 'unstable', label: 'Unstable' },
    { key: 'improving', label: 'Improving' },
    { key: 'inconsistent', label: 'Inconsistent' },
  ],
  recovery: [
    { key: 'soreness', label: 'Soreness' },
    { key: 'low_energy', label: 'Low energy' },
  ],
  testing: [
    { key: 'fatigue', label: 'Fatigue' },
    { key: 'distracted', label: 'Distracted' },
    { key: 'focused', label: 'Focused' },
  ],
}

export function tagsForSessionMode(mode) {
  const m = String(mode || 'practice').toLowerCase()
  return TAGS_BY_SESSION_MODE[m] || TAGS_BY_SESSION_MODE.practice
}

export const MARKER_OPTIONS = [
  { key: 'positive', label: 'Good', short: '+' },
  { key: 'concern', label: 'Watch', short: '!' },
  { key: 'highlight', label: 'Best', short: '★' },
]
