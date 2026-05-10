const AUTH_TOKEN_KEY = 'onrep.auth.token'
const AUTH_USER_KEY = 'onrep.auth.user'

function safeParse(rawValue, fallback = null) {
  if (!rawValue) return fallback
  try {
    return JSON.parse(rawValue)
  } catch {
    return fallback
  }
}

export const authStorage = {
  getToken() {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY)
    } catch {
      return null
    }
  },
  setToken(token) {
    try {
      if (!token) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        return
      }
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  },
  getUser() {
    try {
      return safeParse(localStorage.getItem(AUTH_USER_KEY))
    } catch {
      return null
    }
  },
  setUser(user) {
    try {
      if (!user) {
        localStorage.removeItem(AUTH_USER_KEY)
        return
      }
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
    } catch {
      /* ignore */
    }
  },
}
