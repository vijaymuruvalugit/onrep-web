import React, { useEffect, useRef } from 'react'

import {
  CAvatar,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CWidgetStatsA,
} from '@coreui/react'
import { CChartBar, CChartDoughnut, CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import CIcon from '@coreui/icons-react'
import {
  cilArrowTop,
  cilBasketball,
  cilCalendar,
  cilPuzzle,
  cilSpeedometer,
} from '@coreui/icons'

import avatar2 from 'src/assets/images/avatars/2.jpg'
import avatar3 from 'src/assets/images/avatars/3.jpg'
import avatar4 from 'src/assets/images/avatars/4.jpg'

import { barChartOptions, doughnutOptions, lineChartOptions } from './chartOptions'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

function useChartColorSync(ref) {
  useEffect(() => {
    const onChange = () => {
      if (!ref.current) return
      const c = getStyle('--cui-border-color-translucent')
      const t = getStyle('--cui-body-color')
      const chart = ref.current
      if (chart.options?.scales?.x) {
        chart.options.scales.x.grid ??= {}
        chart.options.scales.x.ticks ??= {}
        chart.options.scales.x.grid.color = c
        chart.options.scales.x.ticks.color = t
      }
      if (chart.options?.scales?.y) {
        chart.options.scales.y.grid ??= {}
        chart.options.scales.y.ticks ??= {}
        chart.options.scales.y.border ??= {}
        chart.options.scales.y.grid.color = c
        chart.options.scales.y.ticks.color = t
        chart.options.scales.y.border.color = c
      }
      chart.update()
    }
    document.documentElement.addEventListener('ColorSchemeChange', onChange)
    return () => document.documentElement.removeEventListener('ColorSchemeChange', onChange)
  }, [ref])
}

const OwnerDashboard = () => {
  const revenueRef = useRef(null)
  const growthRef = useRef(null)
  useChartColorSync(revenueRef)
  useChartColorSync(growthRef)

  const coachRows = [
    { name: 'Priya N.', sessions: 42, att: 91, students: 28, avatar: avatar2 },
    { name: 'Marcus T.', sessions: 38, att: 88, students: 22, avatar: avatar3 },
    { name: 'Elena R.', sessions: 35, att: 94, students: 31, avatar: avatar4 },
  ]

  const revenueLineOptions = (() => {
    const base = lineChartOptions({ legend: true })
    return {
      ...base,
      scales: {
        ...base.scales,
        y: { ...base.scales.y, max: 110 },
      },
    }
  })()

  const events = [
    { date: 'May 12', title: 'Regional comp — qualifiers', type: 'Competition' },
    { date: 'May 18', title: 'Batch C — ice skills intensive', type: 'Workshop' },
    { date: 'May 22', title: 'Academy closed (holiday)', type: 'Holiday' },
    { date: 'Jun 2', title: 'Summer batch kickoff', type: 'Batch start' },
  ]

  return (
    <>
      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="primary"
            value={
              <>
                186{' '}
                <span className="fs-6 fw-normal text-white-50">
                  (+8 <CIcon icon={cilArrowTop} />)
                </span>
              </>
            }
            title="Active students"
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '70px' }}
                data={{
                  labels: MONTHS_SHORT,
                  datasets: [
                    {
                      label: 'Active',
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,.55)',
                      borderWidth: 2,
                      data: [162, 168, 171, 175, 180, 186],
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                  elements: {
                    line: { tension: 0.4, borderWidth: 2 },
                    point: { radius: 0 },
                  },
                }}
              />
            }
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="info"
            value={
              <>
                $48.2k{' '}
                <span className="fs-6 fw-normal text-white-50">MTD</span>
              </>
            }
            title="Collections this month"
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '70px' }}
                data={{
                  labels: MONTHS_SHORT,
                  datasets: [
                    {
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,.55)',
                      borderWidth: 2,
                      data: [32, 36, 38, 41, 44, 48.2],
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                  elements: { line: { tension: 0.4 }, point: { radius: 0 } },
                }}
              />
            }
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="warning"
            value={
              <>
                89%{' '}
                <span className="fs-6 fw-normal text-white-50">avg.</span>
              </>
            }
            title="Attendance health"
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '70px' }}
                data={{
                  labels: MONTHS_SHORT,
                  datasets: [
                    {
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,.55)',
                      borderWidth: 2,
                      data: [84, 86, 87, 88, 88, 89],
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                  elements: { line: { tension: 0.4 }, point: { radius: 0 } },
                }}
              />
            }
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="success"
            value={
              <>
                14{' '}
                <span className="fs-6 fw-normal text-white-50">batches</span>
              </>
            }
            title="Active batches"
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '70px' }}
                data={{
                  labels: MONTHS_SHORT,
                  datasets: [
                    {
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,.55)',
                      borderWidth: 2,
                      data: [12, 12, 13, 13, 14, 14],
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                  elements: { line: { tension: 0.4 }, point: { radius: 0 } },
                }}
              />
            }
          />
        </CCol>
      </CRow>

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol lg={7}>
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Revenue overview</strong>
                <div className="small text-body-secondary">
                  Total · MRR · Subscriptions · Manual payments
                </div>
              </div>
              <div className="text-end small">
                <div>
                  <strong>$124k</strong> trailing
                </div>
                <div className="text-body-secondary">MRR $31.4k · Manual $12.1k</div>
              </div>
            </CCardHeader>
            <CCardBody>
              <CChartLine
                ref={revenueRef}
                style={{ height: '260px' }}
                data={{
                  labels: MONTHS_SHORT,
                  datasets: [
                    {
                      label: 'Total revenue',
                      backgroundColor: `rgba(${getStyle('--cui-primary-rgb')}, .12)`,
                      borderColor: getStyle('--cui-primary'),
                      borderWidth: 2,
                      fill: true,
                      data: [72, 78, 81, 88, 92, 98],
                    },
                    {
                      label: 'Subscriptions',
                      backgroundColor: 'transparent',
                      borderColor: getStyle('--cui-info'),
                      borderWidth: 2,
                      data: [38, 40, 42, 44, 46, 48],
                    },
                    {
                      label: 'Manual payments',
                      backgroundColor: 'transparent',
                      borderColor: getStyle('--cui-warning'),
                      borderWidth: 2,
                      borderDash: [6, 4],
                      data: [22, 24, 25, 28, 30, 32],
                    },
                  ],
                }}
                options={revenueLineOptions}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={5}>
          <CCard className="h-100">
            <CCardHeader>
              <strong>Student growth</strong>
              <div className="small text-body-secondary">Active · New · Churn (net)</div>
            </CCardHeader>
            <CCardBody>
              <CChartLine
                ref={growthRef}
                style={{ height: '260px' }}
                data={{
                  labels: MONTHS_SHORT,
                  datasets: [
                    {
                      label: 'Net growth',
                      backgroundColor: `rgba(${getStyle('--cui-success-rgb')}, .25)`,
                      borderColor: getStyle('--cui-success'),
                      borderWidth: 2,
                      fill: true,
                      data: [12, 18, 15, 22, 19, 24],
                    },
                  ],
                }}
                options={lineChartOptions()}
              />
              <CRow className="text-center small mt-3 g-2">
                <CCol xs={4}>
                  <div className="text-body-secondary">New enrollments</div>
                  <div className="fs-6 fw-semibold">+34</div>
                </CCol>
                <CCol xs={4}>
                  <div className="text-body-secondary">Churn</div>
                  <div className="fs-6 fw-semibold text-danger">-10</div>
                </CCol>
                <CCol xs={4}>
                  <div className="text-body-secondary">Active</div>
                  <div className="fs-6 fw-semibold">186</div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol lg={6}>
          <CCard className="h-100">
            <CCardHeader>
              <strong>Attendance health</strong>
              <div className="small text-body-secondary">Weekly — present vs missed sessions</div>
            </CCardHeader>
            <CCardBody>
              <CChartBar
                style={{ height: '240px' }}
                data={{
                  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
                  datasets: [
                    {
                      label: 'Present',
                      backgroundColor: getStyle('--cui-success'),
                      data: [82, 85, 84, 88, 86, 89],
                      stack: 'a',
                    },
                    {
                      label: 'Missed',
                      backgroundColor: getStyle('--cui-danger'),
                      data: [18, 15, 16, 12, 14, 11],
                      stack: 'a',
                    },
                  ],
                }}
                options={barChartOptions({ stacked: true })}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6}>
          <CCard className="h-100">
            <CCardHeader>
              <strong>Batch utilization</strong>
              <div className="small text-body-secondary">Enrolled vs capacity</div>
            </CCardHeader>
            <CCardBody>
              <CChartBar
                style={{ height: '240px' }}
                data={{
                  labels: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Skills AM'],
                  datasets: [
                    {
                      label: 'Occupancy %',
                      backgroundColor: getStyle('--cui-info'),
                      data: [92, 78, 85, 64, 96],
                    },
                  ],
                }}
                options={barChartOptions({ horizontal: true })}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilDollar} className="me-2" />
              Payment collection
            </CCardHeader>
            <CCardBody>
              <CChartDoughnut
                style={{ height: '220px' }}
                data={{
                  labels: ['Paid', 'Pending', 'Overdue'],
                  datasets: [
                    {
                      backgroundColor: [
                        getStyle('--cui-success'),
                        getStyle('--cui-warning'),
                        getStyle('--cui-danger'),
                      ],
                      data: [68, 22, 10],
                    },
                  ],
                }}
                options={doughnutOptions()}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilBasketball} className="me-2" />
              Activity mix
            </CCardHeader>
            <CCardBody>
              <CChartDoughnut
                style={{ height: '220px' }}
                data={{
                  labels: ['Skating', 'Fitness', 'Yoga', 'Swimming', 'Other'],
                  datasets: [
                    {
                      backgroundColor: [
                        getStyle('--cui-primary'),
                        getStyle('--cui-info'),
                        getStyle('--cui-success'),
                        getStyle('--cui-warning'),
                        getStyle('--cui-secondary'),
                      ],
                      data: [38, 22, 15, 12, 13],
                    },
                  ],
                }}
                options={doughnutOptions()}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow xs={{ gutter: 4 }}>
        <CCol lg={7}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilSpeedometer} className="me-2" />
              Coach performance snapshot
            </CCardHeader>
            <CCardBody className="p-0">
              <CTable align="middle" className="mb-0" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">Coach</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">Sessions</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Avg. attendance</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">Students</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {coachRows.map((row) => (
                    <CTableRow key={row.name}>
                      <CTableDataCell>
                        <div className="d-flex align-items-center gap-2">
                          <CAvatar src={row.avatar} size="md" />
                          <span className="fw-semibold">{row.name}</span>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">{row.sessions}</CTableDataCell>
                      <CTableDataCell style={{ minWidth: '140px' }}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span>{row.att}%</span>
                        </div>
                        <CProgress thin color="success" value={row.att} />
                      </CTableDataCell>
                      <CTableDataCell className="text-center">{row.students}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={5}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilCalendar} className="me-2" />
              Upcoming events
            </CCardHeader>
            <CCardBody>
              <ul className="list-unstyled mb-0">
                {events.map((ev) => (
                  <li
                    key={ev.title}
                    className="d-flex gap-3 pb-3 mb-3 border-bottom border-secondary border-opacity-25"
                  >
                    <div className="text-center" style={{ minWidth: '52px' }}>
                      <CIcon icon={cilPuzzle} className="text-primary mb-1" size="lg" />
                      <div className="small fw-semibold">{ev.date}</div>
                    </div>
                    <div>
                      <div className="fw-semibold">{ev.title}</div>
                      <div className="small text-body-secondary">{ev.type}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default OwnerDashboard
