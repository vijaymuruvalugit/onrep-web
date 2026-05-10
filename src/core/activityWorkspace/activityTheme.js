/**
 * Maps API activity.type → stable UI theme keys for CSS (accent color, empty states).
 * Extend when new verticals ship in @onrep/contracts ACTIVITY_TYPES.
 */
export const ACTIVITY_THEME_KEYS = /** @type {const} */ ({
  skating: 'skating',
  music: 'music',
  yoga: 'yoga',
  default: 'default',
})

/**
 * @param {string | null | undefined} type
 * @returns {'skating' | 'music' | 'yoga' | 'default'}
 */
export function resolveActivityThemeKey(type) {
  const t = String(type || '')
    .toLowerCase()
    .trim()
  if (!t) return ACTIVITY_THEME_KEYS.default
  if (/(skate|ice)/i.test(t)) return ACTIVITY_THEME_KEYS.skating
  if (/(music|instrument|band|choir)/i.test(t)) return ACTIVITY_THEME_KEYS.music
  if (/(yoga|pilates|mindfulness|meditation)/i.test(t)) return ACTIVITY_THEME_KEYS.yoga
  return ACTIVITY_THEME_KEYS.default
}
