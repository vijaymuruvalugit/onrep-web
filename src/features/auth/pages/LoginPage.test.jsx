import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils/renderWithProviders'
import LoginPage from './LoginPage'

const { loginMock, navigateFn } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  navigateFn: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: loginMock,
    loading: false,
    error: null,
    isAuthenticated: false,
    user: null,
  }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => navigateFn,
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates email before calling login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email')
    await user.type(screen.getByLabelText(/^password$/i), 'secret12')
    await user.click(screen.getByRole('button', { name: /sign in to onrep/i }))
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('submits credentials and navigates on fulfilled login', async () => {
    const user = userEvent.setup()
    loginMock.mockResolvedValue({
      meta: { requestStatus: 'fulfilled' },
      payload: { user: { role: 'coach' } },
    })
    renderWithProviders(<LoginPage />)
    await user.type(screen.getByLabelText(/^email$/i), 'coach@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret12')
    await user.click(screen.getByRole('button', { name: /sign in to onrep/i }))
    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'coach@test.com', password: 'secret12' }),
    )
    expect(navigateFn).toHaveBeenCalled()
  })
})
