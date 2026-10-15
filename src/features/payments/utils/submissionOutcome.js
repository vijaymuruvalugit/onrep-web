/**
 * How a collection submit should be retried.
 * uncertain: the server may have committed. Resend the original key and payload.
 * mismatch: that key is already bound to a different payload. Do not allocate a new key
 * until the operator explicitly starts another collection.
 * rejected: the server refused the request and recorded no payment. The same key can be edited.
 */
export function classifyCollectionResult({ status, code } = {}) {
  if (code === 'MUTATION_PAYLOAD_MISMATCH' || code === 'MUTATION_RESULT_PENDING') return 'mismatch'
  if (status == null || status === 0 || status >= 500) return 'uncertain'
  if (status >= 400) return 'rejected'
  return 'accepted'
}
