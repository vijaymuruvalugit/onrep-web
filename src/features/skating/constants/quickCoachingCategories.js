/** Five quick coaching dimensions (1–5) — formal 9-KPI grid is separate. */
export const QUICK_COACHING_CATEGORIES = [
  { key: 'effort', label: 'Effort' },
  { key: 'focus', label: 'Focus' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'recovery', label: 'Recovery' },
]

export const QUICK_CATEGORY_KEYS = new Set(QUICK_COACHING_CATEGORIES.map((c) => c.key))
