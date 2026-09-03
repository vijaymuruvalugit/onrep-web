import React from 'react'
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils/renderWithProviders'
import TrialConvertBanner from './TrialConvertBanner'

describe('TrialConvertBanner', () => {
  it('links academy admins to billing checkout', () => {
    renderWithProviders(
      <TrialConvertBanner trialEndsAt="2026-09-05T05:02:59.240Z" planPriceInr={1} />,
    )
    expect(screen.getByTestId('trial-convert-banner')).toHaveTextContent('05-09-2026')
    expect(screen.getByTestId('trial-convert-banner')).toHaveTextContent('₹1/month')
    const cta = screen.getByRole('link', { name: /subscribe now/i })
    expect(cta).toHaveAttribute('href', '/coach/billing')
  })
})
