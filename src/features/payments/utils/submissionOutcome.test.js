import { classifyCollectionResult } from './submissionOutcome'

describe('classifyCollectionResult', () => {
  it('treats a missing response as uncertain', () => {
    expect(classifyCollectionResult({ status: null })).toBe('uncertain')
    expect(classifyCollectionResult({ status: 0 })).toBe('uncertain')
    expect(classifyCollectionResult({ status: 503 })).toBe('uncertain')
  })

  it('keeps a payload mismatch on the original key', () => {
    expect(classifyCollectionResult({ status: 409, code: 'MUTATION_PAYLOAD_MISMATCH' })).toBe('mismatch')
  })

  it('treats a validation refusal as having no financial effect', () => {
    expect(classifyCollectionResult({ status: 400, code: 'OVERPAYMENT_REJECTED' })).toBe('rejected')
  })
})
