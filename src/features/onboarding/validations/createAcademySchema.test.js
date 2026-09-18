import { describe, expect, it } from 'vitest'
import { createAcademySchema } from './createAcademySchema'

const valid = {
  academyName: 'Acme',
  name: 'Vijay',
  email: 'owner@example.com',
  phone: '9876543210',
  password: 'secret123',
  billing_choice: 'trial',
  activities: ['skating'],
}

describe('createAcademySchema', () => {
  it('accepts a 10-digit India mobile', async () => {
    await expect(createAcademySchema.validate(valid)).resolves.toMatchObject({
      phone: '9876543210',
    })
  })

  it('requires a phone number', async () => {
    await expect(createAcademySchema.validate({ ...valid, phone: '' })).rejects.toThrow(
      /phone number is required/i,
    )
  })

  it('rejects a short local number', async () => {
    await expect(createAcademySchema.validate({ ...valid, phone: '98765' })).rejects.toThrow(
      /10-digit mobile/i,
    )
  })
})
