import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ImportSummaryCard from './ImportSummaryCard'

describe('ImportSummaryCard', () => {
  it('renders dry-run counts prominently', () => {
    render(
      <ImportSummaryCard
        title="Dry-run summary"
        fileName="roster.xlsx"
        summary={{
          total_rows: 124,
          ready_to_import: 112,
          warning_count: 8,
          rows_with_errors: 4,
        }}
      />,
    )

    expect(screen.getByText('Dry-run summary')).toBeInTheDocument()
    expect(screen.getByText('124')).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument()
    expect(screen.getByText('Rows uploaded')).toBeInTheDocument()
    expect(screen.getByText('Ready to import')).toBeInTheDocument()
  })
})
