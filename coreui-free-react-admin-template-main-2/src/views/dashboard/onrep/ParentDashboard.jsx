import React, { useEffect, useRef } from 'react'

import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CWidgetStatsA,
} from '@coreui/react'
import { CChartDoughnut, CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import CIcon from '@coreui/icons-react'
import {
  cilArrowTop,
  cilCalendar,
  cilChild,
  cilDollar,
  cilHeart,
  cilNotes,
  cilStar,
} from '@coreui/icons'

import { doughnutOptions, lineChartOptions } from './chartOptions'

const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6']

function useChartColorSync(ref) {
  useEffect(() => {
    const onChange = () => {
      if (!ref.current) return
      const c = getStyle('--cui-border-color-translucent')
      const t = getStyle('--cui-body-color')
      const chart = ref.current
      ;['x', 'y'].forEach((k) => {
        if (chart.options?.scales?.[k]) {
          chart.options.scales[k].grid && (chart.options.scales[k].grid.color = c)
          chart.options.scales[k].ticks && (chart.options.scales[k].ticks.color = t)
          chart.options.scales[k].border && (chart.options.scales[k].border.color = c)
        }
      })
      chart.update()
    }
    document.documentElement.addEventListener('ColorSchemeChange', onChange)
    return () => document.documentElement.removeEventListener('ColorSchemeChange', onChange)
  }, [ref])
}

const ParentDashboard = () => {
  const lineRef = useRef(null)
  useChartColorSync(lineRef)

  const weekSessions = [
    { day: 'Mon', time: '16:30', label: 'Skating — Gamma', place: 'Rink A' },
    { day: 'Wed', time: '17:00', label: 'Off-ice fitness', place: 'Studio 1' },
    { day: 'Sat', time: '09:00', label: 'Skills lab', place: 'Rink B' },
  ]

  const events = [
    { title: 'Club showcase', date: 'May 24', badge: 'Competition' },
    { title: 'Parent info night', date: 'Jun 4', badge: 'Workshop' },
  ]

  return (
    <>
      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol md={4}>
          <CCard className="h-100 text-center">
            <CCardHeader>
              <CIcon icon={cilChild} className="me-2" />
              Child attendance
            </CCardHeader>
            <CCardBody>
              <CChartDoughnut
                style={{ height: '180px' }}
                data={{
                  labels: ['Present', 'Absent', 'Excused'],
                  datasets: [
                    {
                      backgroundColor: [
                        getStyle('--cui-success'),
                        getStyle('--cui-danger'),
                        getStyle('--cui-secondary'),
                      ],
                      data: [78, 12, 10],
                    },
                  ],
                }}
                options={doughnutOptions()}
              />
              <div className="mt-3">
                <div className="text-body-secondary small">Last 30 days</div>
                <div className="fs-4 fw-bold text-success">92% attendance</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilCalendar} className="me-2" />
              Upcoming sessions
            </CCardHeader>
            <CCardBody>
              <div className="small text-body-secondary mb-2">This week for Alex</div>
              <ul className="list-unstyled mb-0">
                {weekSessions.map((s) => (
                  <li key={s.day + s.time} className="mb-3 pb-3 border-bottom border-light">
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold">
                        {s.day} · {s.time}
                      </span>
                      <CBadge color="light" textColor="dark">
                        {s.place}
                      </CBadge>
                    </div>
                    <div className="text-body-secondary small">{s.label}</div>
                  </li>
                ))}
              </ul>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CWidgetStatsA
            color="success"
            value={
              <>
                Clear{' '}
                <span className="fs-6 fw-normal text-white-50">through Jun 1</span>
              </>
            }
            title="Fee status"
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '70px' }}
                data={{
                  labels: WEEKS,
                  datasets: [
                    {
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,.55)',
                      borderWidth: 2,
                      data: [100, 100, 100, 100, 100, 100],
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { display: false }, y: { display: false } },
                  elements: { line: { tension: 0.4 }, point: { radius: 0 } },
                }}
              />
            }
          />
          <CCard className="mt-3 mb-0">
            <CCardBody className="py-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <CIcon icon={cilDollar} size="lg" className="text-success" />
                <div>
                  <div className="small text-body-secondary">Next billing</div>
                  <div className="fw-semibold">Jun 1 · $240</div>
                </div>
              </div>
              <CProgress thin color="success" value={100} className="mb-1" />
              <div className="small text-body-secondary">Installment 4 of 6 — paid</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol lg={7}>
          <CCard className="h-100">
            <CCardHeader>
              <strong>Monthly participation</strong>
              <div className="small text-body-secondary">Sessions attended vs offered</div>
            </CCardHeader>
            <CCardBody>
              <CChartLine
                ref={lineRef}
                style={{ height: '240px' }}
                data={{
                  labels: WEEKS,
                  datasets: [
                    {
                      label: 'Attended',
                      backgroundColor: `rgba(${getStyle('--cui-primary-rgb')}, .12)`,
                      borderColor: getStyle('--cui-primary'),
                      borderWidth: 2,
                      fill: true,
                      data: [4, 5, 4, 5, 5, 6],
                    },
                    {
                      label: 'Offered',
                      backgroundColor: 'transparent',
                      borderColor: getStyle('--cui-secondary'),
                      borderWidth: 1,
                      borderDash: [5, 3],
                      data: [6, 6, 6, 6, 6, 6],
                    },
                  ],
                }}
                options={lineChartOptions({ legend: true })}
              />
              <div className="d-flex justify-content-between small text-body-secondary mt-2">
                <span>
                  Consistency score{' '}
                  <strong className="text-body">
                    88% <CIcon icon={cilArrowTop} className="text-success" />
                  </strong>
                </span>
                <span>Goal: 85%</span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={5}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilStar} className="me-2" />
              Progress snapshot
            </CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span>Single toe loop</span>
                  <span className="text-body-secondary">Milestone</span>
                </div>
                <CProgress height={10} color="success" value={85} />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span>Spin combo L2</span>
                  <span className="text-body-secondary">In progress</span>
                </div>
                <CProgress height={10} color="info" value={62} />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span>Program pattern ice</span>
                  <span className="text-body-secondary">Starting</span>
                </div>
                <CProgress height={10} color="warning" value={28} />
              </div>
              <div className="rounded bg-body-tertiary p-3 small">
                <div className="fw-semibold mb-1">Coach remark</div>
                <div className="text-body-secondary fst-italic">
                  “Alex is carrying speed into entries — keep reinforcing head position on landing.”
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow xs={{ gutter: 4 }}>
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilNotes} className="me-2" />
              Latest coach feedback
            </CCardHeader>
            <CCardBody>
              <div className="border-start border-4 border-primary ps-3 mb-3">
                <div className="small text-body-secondary">May 5 — Skills session</div>
                <p className="mb-0">
                  Great focus today. Next step: repeat the half-loop entry three times per session for muscle
                  memory.
                </p>
              </div>
              <div className="border-start border-4 border-info ps-3">
                <div className="small text-body-secondary">Apr 28 — Off-ice</div>
                <p className="mb-0">Core engagement improved — keep the same plank series twice weekly.</p>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilStar} className="me-2" />
              Competitions &amp; events
            </CCardHeader>
            <CCardBody>
              <ul className="list-unstyled mb-0">
                {events.map((ev) => (
                  <li key={ev.title} className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <div className="fw-semibold">{ev.title}</div>
                      <div className="small text-body-secondary">{ev.date}</div>
                    </div>
                    <CBadge color="primary">{ev.badge}</CBadge>
                  </li>
                ))}
              </ul>
              <div className="rounded bg-body-tertiary p-3 small d-flex align-items-center gap-2">
                <CIcon icon={cilHeart} className="text-danger" size="lg" />
                <span>We’ll send a reminder 1 week before costume deadlines.</span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default ParentDashboard
