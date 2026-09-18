const STORAGE_PREFIX = 'onrep.academySetupGuide.collapsed'

export function academySetupGuideStorageKey(identityKey, academyId) {
  if (!identityKey || !academyId) return null
  return `${STORAGE_PREFIX}:${identityKey}:${academyId}`
}

/** @returns {boolean|null} true collapsed, false expanded, null no preference */
export function readAcademySetupGuideCollapsed(identityKey, academyId) {
  const key = academySetupGuideStorageKey(identityKey, academyId)
  if (!key || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === '1') return true
    if (raw === '0') return false
    return null
  } catch {
    return null
  }
}

export function writeAcademySetupGuideCollapsed(identityKey, academyId, collapsed) {
  const key = academySetupGuideStorageKey(identityKey, academyId)
  if (!key || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, collapsed ? '1' : '0')
  } catch {
    /* ignore quota / private mode */
  }
}
