/**
 * Shared Chart.js options aligned with CoreUI theme tokens.
 */
import { getStyle } from '@coreui/utils'

export function axisColors() {
  return {
    grid: getStyle('--cui-border-color-translucent'),
    ticks: getStyle('--cui-body-color'),
    border: getStyle('--cui-border-color-translucent'),
  }
}

export function lineChartOptions({ legend = false, max, min } = {}) {
  const c = axisColors()
  return {
    maintainAspectRatio: false,
    plugins: { legend: { display: legend } },
    scales: {
      x: {
        grid: { color: c.grid, drawOnChartArea: false },
        ticks: { color: c.ticks },
      },
      y: {
        beginAtZero: true,
        border: { color: c.border },
        grid: { color: c.grid },
        ticks: { color: c.ticks, maxTicksLimit: 6 },
        ...(max != null ? { max } : {}),
        ...(min != null ? { min } : {}),
      },
    },
    elements: {
      line: { tension: 0.35 },
      point: { radius: 0, hitRadius: 10, hoverRadius: 4 },
    },
  }
}

export function barChartOptions({ stacked = false, horizontal = false } = {}) {
  const c = axisColors()
  const indexAxis = horizontal ? 'y' : 'x'
  return {
    maintainAspectRatio: false,
    indexAxis,
    plugins: { legend: { display: stacked } },
    scales: {
      x: {
        stacked,
        grid: { color: c.grid, drawOnChartArea: false },
        ticks: { color: c.ticks },
      },
      y: {
        stacked,
        beginAtZero: true,
        border: { color: c.border },
        grid: { color: c.grid },
        ticks: { color: c.ticks, maxTicksLimit: 6 },
      },
    },
  }
}

export function doughnutOptions() {
  return {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
  }
}

export function radarOptions() {
  return {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      r: {
        angleLines: { color: axisColors().grid },
        grid: { color: axisColors().grid },
        pointLabels: { color: axisColors().ticks },
        ticks: { display: false, backdropColor: 'transparent' },
      },
    },
  }
}
