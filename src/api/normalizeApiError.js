export function normalizeApiError(error) {
  const status = error?.response?.status || null
  const data = error?.response?.data
  const fallbackMessage = 'Something went wrong. Please try again.'

  const message =
    data?.message || data?.error?.message || data?.error || error?.message || fallbackMessage

  return {
    status,
    message: typeof message === 'string' ? message : fallbackMessage,
    code: data?.code || data?.errorCode || null,
    details: data?.details || null,
    raw: data || null,
  }
}

export default normalizeApiError
