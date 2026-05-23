import React from 'react'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import { CChartBar, CChartDoughnut, CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'

const palette = {
  primary: () => getStyle('--cui-primary') || '#321fdb',
  info: () => getStyle('--cui-info') || '#39f',
  success: () => getStyle('--cui-success') || '#2eb85c',
  warning: () => getStyle('--cui-warning') || '#f9b115',
  danger: () => getStyle('--cui-danger') || '#e55353',
  secondary: () => getStyle('--cui-secondary') || '#9da5b1',
  border: () => getStyle('--cui-border-color-translucent') || 'rgba(0,0,21,.125)',
  body: () => getStyle('--cui-body-color') || '#212529',
}

function axisOptions({ horizontal = false, max = null, legend = false } = {}) {
  const indexAxis = horizontal ? 'y' : 'x'
  return {
    maintainAspectRatio: false,
    indexAxis,
    plugins: { legend: { display: legend } },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: palette.border(), drawOnChartArea: horizontal },
        ticks: { color: palette.body(), precision: 0 },
        ...(horizontal ? {} : max != null ? { max } : {}),
      },
      y: {
        beginAtZero: !horizontal,
        border: { color: palette.border() },
        grid: { color: palette.border(), drawOnChartArea: !horizontal },
        ticks: { color: palette.body(), precision: 0 },
        ...(horizontal && max != null ? { max } : {}),
      },
    },
  }
}

function doughnutOptions() {
  return {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, color: palette.body() },
      },
    },
  }
}

function hasData(values) {
  return (values || []).some((v) => Number(v || 0) > 0)
}

export function InsightChartCard({ title, subtitle, children, height = 240 }) {
  return (
    <CCard className="shadow-sm h-100">
      <CCardHeader>
        <div className="fw-semibold">{title}</div>
        {subtitle ? <div className="small text-body-secondary">{subtitle}</div> : null}
      </CCardHeader>
      <CCardBody>
        <div style={{ height }}>{children}</div>
      </CCardBody>
    </CCard>
  )
}

export function EmptyChart({ message = 'No chart data yet.' }) {
  return (
    <div className="h-100 d-flex align-items-center justify-content-center text-body-secondary small">
      {message}
    </div>
  )
}

export function InsightLineChart({ labels, datasets, max = null }) {
  const safeDatasets = (datasets || []).map((dataset, index) => {
    const color = dataset.color || [palette.primary(), palette.info(), palette.success()][index % 3]
    return {
      borderColor: color,
      backgroundColor: color,
      pointBackgroundColor: color,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 4,
      ...dataset,
    }
  })

  if (!labels?.length || !safeDatasets.some((d) => hasData(d.data))) return <EmptyChart />

  return (
    <CChartLine
      data={{ labels, datasets: safeDatasets }}
      options={axisOptions({ max, legend: safeDatasets.length > 1 })}
    />
  )
}

export function InsightBarChart({ labels, values, label, horizontal = true, color }) {
  if (!labels?.length || !hasData(values)) return <EmptyChart />
  const barColor = color || palette.primary()

  return (
    <CChartBar
      data={{
        labels,
        datasets: [
          {
            label,
            backgroundColor: barColor,
            borderColor: barColor,
            data: values,
          },
        ],
      }}
      options={axisOptions({ horizontal })}
    />
  )
}

export function InsightDoughnutChart({ labels, values }) {
  if (!labels?.length || !hasData(values)) return <EmptyChart />

  return (
    <CChartDoughnut
      data={{
        labels,
        datasets: [
          {
            backgroundColor: [
              palette.success(),
              palette.warning(),
              palette.info(),
              palette.secondary(),
              palette.danger(),
            ],
            data: values,
          },
        ],
      }}
      options={doughnutOptions()}
    />
  )
}
