/** Five quick coaching dimensions (1–5) — formal nine-dimension grid is separate. */
export const QUICK_COACHING_CATEGORIES = [
  { key: 'effort', label: 'Effort' },
  { key: 'focus', label: 'Focus' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'recovery', label: 'Recovery' },
]

/** Live session display labels (≤2 words). */
export const QUICK_COACHING_LIVE_LABELS = Object.freeze({
  effort: 'Effort',
  focus: 'Focus',
  confidence: 'Mind',
  discipline: 'Control',
  recovery: 'Recover',
})

export function quickCategoryLiveLabel(key) {
  return QUICK_COACHING_LIVE_LABELS[key] || key
}

export const QUICK_CATEGORY_KEYS = new Set(QUICK_COACHING_CATEGORIES.map((c) => c.key))
