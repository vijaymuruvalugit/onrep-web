/**
 * Rapid Observation — canonical nine dimensions (1–5). Server accepts up to nine scores per capture;
 * legacy payloads still map on read. Labels are coach-facing shorthand.
 */
export const DEFAULT_RAPID_KPIS = [
  { key: 'speed', label: 'Speed' },
  { key: 'recovery', label: 'Recovery' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'technique', label: 'Technique' },
  { key: 'consistency', label: 'Consist.' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'focus', label: 'Focus' },
  { key: 'effort', label: 'Effort' },
  { key: 'discipline', label: 'Discipline' },
]
