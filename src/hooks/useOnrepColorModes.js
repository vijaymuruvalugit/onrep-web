import { useEffect, useState } from 'react'

/** Bumped key so legacy `onrep-admin-theme` dark prefs do not override the light template default. */
export const ONREP_COLOR_MODE_STORAGE_KEY = 'onrep-admin-color-scheme'

const getStoredTheme = (key) => typeof window !== 'undefined' && localStorage.getItem(key)

const setStoredTheme = (key, colorMode) => localStorage.setItem(key, colorMode)

/**
 * CoreUI `useColorModes` follows OS dark mode when nothing is stored.
 * OnRep defaults the shell to light at the template level unless the user chooses otherwise.
 */
const getPreferredColorScheme = (key) => {
  if (typeof window === 'undefined') return 'light'
  const storedTheme = getStoredTheme(key)
  if (storedTheme) return storedTheme
  return 'light'
}

const applyDocumentTheme = (colorMode) => {
  document.documentElement.dataset.coreuiTheme =
    colorMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : colorMode
  document.documentElement.dispatchEvent(new Event('ColorSchemeChange'))
}

export function useOnrepColorModes(localStorageItemName = ONREP_COLOR_MODE_STORAGE_KEY) {
  const [colorMode, setColorMode] = useState(() => getPreferredColorScheme(localStorageItemName))

  useEffect(() => {
    if (colorMode) {
      setStoredTheme(localStorageItemName, colorMode)
      applyDocumentTheme(colorMode)
    }
  }, [colorMode, localStorageItemName])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const storedTheme = getStoredTheme(localStorageItemName)
      if (storedTheme !== 'light' && storedTheme !== 'dark' && colorMode) {
        applyDocumentTheme(colorMode)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [colorMode, localStorageItemName])

  return {
    colorMode,
    isColorModeSet: () => Boolean(getStoredTheme(localStorageItemName)),
    setColorMode,
  }
}
