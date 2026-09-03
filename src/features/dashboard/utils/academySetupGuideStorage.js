const STORAGE_PREFIX = 'onrep.academySetupGuide.collapsed'

export function academySetupGuideStorageKey(identityKey, academyId) {
  if (!identityKey || !academyId) return null
  return `${STORAGE_PREFIX}:${identityKey}:${academyId}`
}

export function readAcademySetupGuideCollapsed(identityKey, academyId) {
  const key = academySetupGuideStorageKey(identityKey, academyId)
  if (!key || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export function writeAcademySetupGuideCollapsed(identityKey, academyId, collapsed) {
  const key = academySetupGuideStorageKey(identityKey, academyId)
  if (!key || typeof window === 'undefined') return
  try {
    if (collapsed) window.localStorage.setItem(key, '1')
    else window.localStorage.removeItem(key)
  } catch {
    /* ignore quota / private mode */
  }
}
