import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils/renderWithProviders'
import CreateAcademyPage from './CreateAcademyPage'

const { signupMock } = vi.hoisted(() => ({
  signupMock: vi.fn(),
}))

vi.mock('../../auth/api/authApi', () => ({
  authApi: {
    signup: (...args) => signupMock(...args),
  },
}))

async function fillOwnerFields(user, { phone } = {}) {
  await user.type(screen.getByLabelText(/^academy name$/i), 'Acme Rink')
  await user.type(screen.getByLabelText(/^your name$/i), 'Vijay')
  await user.type(screen.getByLabelText(/^email$/i), 'owner@example.com')
  await user.type(screen.getByLabelText(/^password$/i), 'secret123')
  if (phone) {
    await user.type(screen.getByLabelText(/phone number/i), phone)
  }
}

describe('CreateAcademyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks submit without a phone number', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateAcademyPage />)
    await fillOwnerFields(user)
    await user.click(screen.getByRole('button', { name: /create academy/i }))
    expect(await screen.findByText(/phone number is required/i)).toBeInTheDocument()
    expect(signupMock).not.toHaveBeenCalled()
  })

  it('sends E.164 phone_number on signup', async () => {
    const user = userEvent.setup()
    signupMock.mockResolvedValue({
      data: { needs_email_verification: true, billing_choice: 'trial' },
    })
    renderWithProviders(<CreateAcademyPage />)
    await fillOwnerFields(user, { phone: '9876543210' })
    await user.click(screen.getByRole('button', { name: /create academy/i }))
    expect(signupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@example.com',
        name: 'Vijay',
        academyName: 'Acme Rink',
        phone_number: '+919876543210',
      }),
    )
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
  })
})
