/** Slugs stored in training_sessions.session_type */
export const SESSION_TYPE_OPTIONS = [
  { value: '', label: 'Regular' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'private', label: 'Private' },
  { value: 'competition_prep', label: 'Competition prep' },
  { value: 'assessment', label: 'Assessment' },
]

export function sessionTypeLabel(slug) {
  if (!slug) return null
  const hit = SESSION_TYPE_OPTIONS.find((o) => o.value === slug)
  return hit?.label || slug.replace(/_/g, ' ')
}
