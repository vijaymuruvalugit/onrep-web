import {
  isActivityContextUserError,
  WORKSPACE_PICK_MESSAGE,
} from '../core/activityWorkspace/apiActivityContext'

export function normalizeApiError(error) {
  const status = error?.response?.status || null
  const data = error?.response?.data
  const fallbackMessage = 'Something went wrong. Please try again.'

  const rawMessage =
    data?.message || data?.error?.message || data?.error || error?.message || fallbackMessage
  const code = data?.code || data?.errorCode || error?.code || null
  let message = typeof rawMessage === 'string' ? rawMessage : fallbackMessage

  if (isActivityContextUserError({ message, code })) {
    message = WORKSPACE_PICK_MESSAGE
  }

  return {
    status,
    message,
    code,
    details: data?.details || null,
    raw: data || null,
  }
}

export default normalizeApiError
