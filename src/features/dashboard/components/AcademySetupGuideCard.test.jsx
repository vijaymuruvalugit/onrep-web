import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/test-utils/renderWithProviders'
import AcademySetupGuideCard from './AcademySetupGuideCard'
import { buildAcademySetupGuideModel } from '../utils/academySetupGuide'

function partialModel() {
  return buildAcademySetupGuideModel({
    academyId: 'a1',
    readyToRun: false,
    facts: {
      academyProfileComplete: true,
      enabledActivityCount: 1,
      activePlaceCount: 0,
      activeCoachCount: 0,
      activeStudentCount: 0,
      activeBatchCount: 0,
      enrolledStudentCount: 0,
      unstaffedBatchCount: 0,
      upcomingSessionCount: 0,
      activeFeeAssignmentCount: 0,
      approvedGuardianCount: 0,
    },
  })
}

describe('AcademySetupGuideCard', () => {
  it('shows a loading skeleton without unchecked steps', () => {
    renderWithProviders(
      <AcademySetupGuideCard loading model={null} error={null} collapsed={false} />,
    )
    expect(screen.getByTestId('academy-setup-guide-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('setup-step-academy_details')).not.toBeInTheDocument()
  })

  it('shows an error state with Retry and no fake incomplete checklist', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    renderWithProviders(
      <AcademySetupGuideCard
        loading={false}
        model={null}
        error={{ message: 'Failed to load academy setup status.' }}
        collapsed={false}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByTestId('academy-setup-guide-error')).toBeInTheDocument()
    expect(screen.queryByTestId('setup-step-add_coaches')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders required and recommended sections in order with Next step on the first gap', () => {
    renderWithProviders(
      <AcademySetupGuideCard loading={false} model={partialModel()} collapsed={false} />,
    )
    const required = screen.getByTestId('setup-section-required')
    const recommended = screen.getByTestId('setup-section-recommended')
    expect(required).toBeInTheDocument()
    expect(recommended).toBeInTheDocument()
    expect(
      required.compareDocumentPosition(recommended) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    const steps = screen.getAllByTestId(/setup-step-/)
    expect(steps.map((el) => el.getAttribute('data-testid'))).toEqual([
      'setup-step-academy_details',
      'setup-step-enable_activity',
      'setup-step-create_places',
      'setup-step-add_coaches',
      'setup-step-add_students',
      'setup-step-create_batches',
      'setup-step-enrol_students',
      'setup-step-assign_coaches',
      'setup-step-first_schedule',
      'setup-step-set_up_fees',
      'setup-step-connect_guardians',
    ])
    expect(screen.getByTestId('setup-step-create_places')).toHaveAttribute('data-next', 'true')
    expect(screen.getByTestId('setup-next-badge')).toHaveTextContent('Next step')
    expect(screen.getByTestId('setup-step-academy_details')).toHaveAttribute(
      'data-complete',
      'true',
    )
    expect(screen.getByText('2 of 9 core steps complete')).toBeInTheDocument()
  })

  it('uses registered routes for incomplete CTAs', () => {
    renderWithProviders(
      <AcademySetupGuideCard loading={false} model={partialModel()} collapsed={false} />,
    )
    expect(screen.getByRole('link', { name: /add a venue/i })).toHaveAttribute(
      'href',
      '/coach/places',
    )
    expect(screen.getByRole('link', { name: /open coaches/i })).toHaveAttribute(
      'href',
      '/coach/onboarding/coaches',
    )
    expect(screen.getByRole('link', { name: /open batches/i })).toHaveAttribute(
      'href',
      '/coach/batches',
    )
    expect(screen.getByRole('link', { name: /^add students$/i })).toHaveAttribute(
      'href',
      '/coach/students/new',
    )
    expect(screen.getByRole('link', { name: /enrol in batches/i })).toHaveAttribute(
      'href',
      '/coach/batches',
    )
    expect(screen.getByRole('link', { name: /open schedule/i })).toHaveAttribute(
      'href',
      '/coach/schedule',
    )
    expect(screen.getByRole('link', { name: /set up fees/i })).toHaveAttribute(
      'href',
      '/coach/payments/settings',
    )
    expect(screen.getByRole('link', { name: /connect parents/i })).toHaveAttribute(
      'href',
      '/coach/parents',
    )
  })

  it('renders the ready message and Open schedule when core setup is complete', () => {
    const model = buildAcademySetupGuideModel({
      readyToRun: true,
      facts: {
        academyProfileComplete: true,
        enabledActivityCount: 1,
        activePlaceCount: 1,
        activeCoachCount: 1,
        activeStudentCount: 1,
        activeBatchCount: 1,
        enrolledStudentCount: 1,
        unstaffedBatchCount: 0,
        upcomingSessionCount: 1,
        activeFeeAssignmentCount: 0,
        approvedGuardianCount: 0,
      },
    })
    renderWithProviders(<AcademySetupGuideCard loading={false} model={model} collapsed={false} />)
    expect(screen.getByTestId('academy-setup-ready')).toHaveTextContent(
      'Your academy is ready to run sessions',
    )
    expect(screen.getByRole('link', { name: /open schedule/i })).toHaveAttribute(
      'href',
      '/coach/schedule',
    )
    expect(screen.queryByTestId('setup-next-badge')).not.toBeInTheDocument()
  })

  it('shows a distinct no-activity state', () => {
    const model = buildAcademySetupGuideModel({
      facts: { academyProfileComplete: true, enabledActivityCount: 0 },
    })
    renderWithProviders(<AcademySetupGuideCard loading={false} model={model} collapsed={false} />)
    expect(screen.getByTestId('academy-setup-no-activity')).toBeInTheDocument()
    const enableLinks = screen.getAllByRole('link', { name: /enable activity/i })
    expect(enableLinks.length).toBeGreaterThanOrEqual(1)
    expect(enableLinks.every((el) => el.getAttribute('href') === '/coach/activities')).toBe(true)
  })

  it('can collapse and reopen', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const { rerender } = renderWithProviders(
      <AcademySetupGuideCard
        loading={false}
        model={partialModel()}
        collapsed={false}
        onToggleCollapsed={onToggle}
      />,
    )
    await user.click(screen.getByRole('button', { name: /hide setup guide/i }))
    expect(onToggle).toHaveBeenCalled()
    rerender(
      <AcademySetupGuideCard
        loading={false}
        model={partialModel()}
        collapsed
        onToggleCollapsed={onToggle}
      />,
    )
    expect(screen.getByTestId('academy-setup-guide-collapsed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /show guide/i }))
    expect(onToggle).toHaveBeenCalledTimes(2)
  })
})
