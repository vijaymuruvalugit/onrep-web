import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearAuthError, login, logout } from '../slices/authSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)

  return useMemo(
    () => ({
      ...auth,
      login: (payload) => dispatch(login(payload)),
      logout: () => dispatch(logout()),
      clearError: () => dispatch(clearAuthError()),
    }),
    [auth, dispatch],
  )
}

export default useAuth
