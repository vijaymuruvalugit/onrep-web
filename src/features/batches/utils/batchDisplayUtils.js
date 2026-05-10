/**
 * Strip internal/demo markers from strings shown in the product UI.
 * Never surface words like "seed" to coaches or parents.
 */
export function stripDemoSuffix(value) {
  if (value == null || value === '') return value
  let s = String(value)
  s = s.replace(/\s*[·•]\s*seed\b/gi, '')
  s = s.replace(/\s*—\s*seed\b/gi, '')
  s = s.replace(/\s*\(\s*seed\s*[^)]*\)/gi, '')
  s = s.replace(/\s+\bseed\b\s*$/gi, '')
  s = s.replace(/\s{2,}/g, ' ')
  return s.trim()
}

/** Notes field may contain internal enrollment markers — never show them in the UI. */
export function sanitizeStudentNotesForDisplay(value) {
  if (value == null || value === '') return '—'
  let s = stripDemoSuffix(String(value))
  s = s.replace(/__ONREP_SEED_V2__/gi, '').replace(/\s{2,}/g, ' ').trim()
  return s || '—'
}
