import React, { useEffect, useRef } from 'react'

import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CListGroup,
  CListGroupItem,
  CProgress,
  CRow,
  CWidgetStatsA,
} from '@coreui/react'
import { CChartBar, CChartDoughnut, CChartLine, CChartRadar } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import CIcon from '@coreui/icons-react'
import {
  cilArrowTop,
  cilBell,
  cilCalendar,
  cilClock,
  cilPeople,
  cilSpeedometer,
  cilWarning,
} from '@coreui/icons'

import { barChartOptions, doughnutOptions, lineChartOptions, radarOptions } from './chartOptions'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
      if (chart.options?.scales?.r) {
        chart.options.scales.r.angleLines.color = c
        chart.options.scales.r.grid.color = c
        chart.options.scales.r.pointLabels.color = t
      }
      chart.update()
    }
    document.documentElement.addEventListener('ColorSchemeChange', onChange)
    return () => document.documentElement.removeEventListener('ColorSchemeChange', onChange)
  }, [ref])
}

const sessionsToday = [
  { title: 'Skills — Alpha batch', time: '07:30 – 09:00', place: 'Rink A', present: 18, expected: 20 },
  { title: 'Fitness edge work', time: '10:00 – 11:00', place: 'Studio 2', present: 12, expected: 12 },
  { title: 'Junior spins lab', time: '16:00 – 17:15', place: 'Rink B', present: 9, expected: 11 },
]

const CoachDashboard = () => {
  const trendRef = useRef(null)
  const radarRef = useRef(null)
  useChartColorSync(trendRef)
  useChartColorSync(radarRef)

  const schedule = [
    { day: 'Thu May 8', detail: 'Gamma — power pulls (06:30)' },
    { day: 'Fri May 9', detail: 'Beta — choreography block' },
    { day: 'Sat May 10', detail: 'Open ice — assessments' },
  ]

  return (
    <>
      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol lg={8}>
          <CCard className="h-100 border-primary border-opacity-25">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Today&apos;s sessions</strong>
                <div className="small text-body-secondary">Live ops view — dummy headcount</div>
              </div>
              <CBadge color="primary" className="fs-6">
                3 today
              </CBadge>
            </CCardHeader>
            <CCardBody>
              <CRow xs={{ gutter: 3 }}>
                {sessionsToday.map((s) => (
                  <CCol md={4} key={s.title}>
                    <CCard className="mb-0 h-100 shadow-sm">
                      <CCardBody>
                        <div className="text-body-secondary small mb-1">
                          <CIcon icon={cilClock} className="me-1" />
                          {s.time}
                        </div>
                        <div className="fw-semibold mb-2">{s.title}</div>
                        <div className="small text-body-secondary mb-2">
                          <CIcon icon={cilSpeedometer} className="me-1" />
                          {s.place}
                        </div>
                        <div className="d-flex justify-content-between small mb-1">
                          <span>Attendance</span>
                          <span>
                            {s.present}/{s.expected}
                          </span>
                        </div>
                        <CProgress
                          color={s.present >= s.expected ? 'success' : 'warning'}
                          value={Math.round((s.present / s.expected) * 100)}
                        />
                      </CCardBody>
                    </CCard>
                  </CCol>
                ))}
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CRow xs={{ gutter: 4 }} className="g-4">
            <CCol xs={12}>
              <CWidgetStatsA
                color="info"
                value={
                  <>
                    91%{' '}
                    <span className="fs-6 fw-normal text-white-50">
                      (+2% <CIcon icon={cilArrowTop} />)
                    </span>
                  </>
                }
                title="Attendance (rolling 14d)"
                chart={
                  <CChartLine
                    className="mt-3 mx-3"
                    style={{ height: '70px' }}
                    data={{
                      labels: DAYS,
                      datasets: [
                        {
                          backgroundColor: 'transparent',
                          borderColor: 'rgba(255,255,255,.55)',
                          borderWidth: 2,
                          data: [86, 88, 89, 90, 89, 91, 91],
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
            </CCol>
            <CCol xs={12}>
              <CWidgetStatsA
                color="success"
                value="52"
                title="Active students (your roster)"
                chart={
                  <CChartLine
                    className="mt-3 mx-3"
                    style={{ height: '70px' }}
                    data={{
                      labels: DAYS,
                      datasets: [
                        {
                          backgroundColor: 'transparent',
                          borderColor: 'rgba(255,255,255,.55)',
                          borderWidth: 2,
                          data: [48, 49, 50, 50, 51, 52, 52],
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
            </CCol>
          </CRow>
        </CCol>
      </CRow>

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="warning"
            value={
              <>
                $2,840{' '}
                <span className="fs-6 fw-normal text-white-50">outstanding</span>
              </>
            }
            title="Pending fees"
            chart={
              <CChartDoughnut
                className="mt-3 mx-auto"
                style={{ height: '70px', width: '70px' }}
                data={{
                  labels: ['Collected', 'Due'],
                  datasets: [
                    {
                      backgroundColor: ['rgba(255,255,255,.35)', 'rgba(255,255,255,.15)'],
                      data: [62, 38],
                    },
                  ],
                }}
                options={{ ...doughnutOptions(), plugins: { legend: { display: false } } }}
              />
            }
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="primary"
            value="6"
            title="Sessions this week"
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '70px' }}
                data={{
                  labels: DAYS,
                  datasets: [
                    {
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,.55)',
                      borderWidth: 2,
                      data: [4, 5, 5, 6, 6, 6, 6],
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
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="danger"
            value="2"
            title="Follow-ups needed"
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '70px' }}
                data={{
                  labels: DAYS,
                  datasets: [
                    {
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,.55)',
                      borderWidth: 2,
                      data: [4, 3, 3, 2, 2, 2, 2],
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
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="secondary"
            value="94%"
            title="Session completion"
            chart={
              <CChartLine
                className="mt-3 mx-3"
                style={{ height: '70px' }}
                data={{
                  labels: DAYS,
                  datasets: [
                    {
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,.55)',
                      borderWidth: 2,
                      data: [88, 90, 91, 92, 93, 94, 94],
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
        </CCol>
      </CRow>

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol lg={7}>
          <CCard className="h-100">
            <CCardHeader>
              <strong>Attendance trend</strong>
              <div className="small text-body-secondary">Daily check-ins vs capacity</div>
            </CCardHeader>
            <CCardBody>
              <CChartLine
                ref={trendRef}
                style={{ height: '240px' }}
                data={{
                  labels: DAYS,
                  datasets: [
                    {
                      label: 'Checked in',
                      backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .15)`,
                      borderColor: getStyle('--cui-info'),
                      borderWidth: 2,
                      fill: true,
                      data: [42, 45, 44, 48, 46, 50, 49],
                    },
                    {
                      label: 'Capacity',
                      backgroundColor: 'transparent',
                      borderColor: getStyle('--cui-secondary'),
                      borderWidth: 1,
                      borderDash: [4, 4],
                      data: [52, 52, 52, 52, 52, 52, 52],
                    },
                  ],
                }}
                options={lineChartOptions({ legend: true })}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={5}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilPeople} className="me-2" />
              Student progress mix
            </CCardHeader>
            <CCardBody>
              <CChartBar
                style={{ height: '240px' }}
                data={{
                  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                  datasets: [
                    {
                      label: 'Improving',
                      backgroundColor: getStyle('--cui-success'),
                      data: [12, 14, 16, 18],
                      stack: 'p',
                    },
                    {
                      label: 'Stable',
                      backgroundColor: getStyle('--cui-info'),
                      data: [22, 20, 19, 18],
                      stack: 'p',
                    },
                    {
                      label: 'Needs attention',
                      backgroundColor: getStyle('--cui-warning'),
                      data: [4, 5, 5, 6],
                      stack: 'p',
                    },
                  ],
                }}
                options={barChartOptions({ stacked: true })}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol lg={5}>
          <CCard className="h-100">
            <CCardHeader>
              <strong>Session load</strong>
              <div className="small text-body-secondary">Sessions per day this week</div>
            </CCardHeader>
            <CCardBody>
              <CChartBar
                style={{ height: '220px' }}
                data={{
                  labels: DAYS,
                  datasets: [
                    {
                      label: 'Sessions',
                      backgroundColor: getStyle('--cui-primary'),
                      data: [2, 3, 2, 4, 3, 5, 4],
                    },
                  ],
                }}
                options={barChartOptions()}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={7}>
          <CCard className="h-100">
            <CCardHeader>
              Skill trajectory <span className="text-body-secondary fw-normal">(demo radar)</span>
            </CCardHeader>
            <CCardBody>
              <CChartRadar
                ref={radarRef}
                style={{ height: '260px' }}
                data={{
                  labels: ['Edges', 'Jumps', 'Spins', 'Stamina', 'Flex', 'Speed'],
                  datasets: [
                    {
                      label: 'Cohort avg',
                      backgroundColor: `rgba(${getStyle('--cui-primary-rgb')}, .2)`,
                      borderColor: getStyle('--cui-primary'),
                      pointBackgroundColor: getStyle('--cui-primary'),
                      pointBorderColor: '#fff',
                      data: [72, 65, 70, 80, 68, 74],
                    },
                    {
                      label: 'Target',
                      backgroundColor: `rgba(${getStyle('--cui-success-rgb')}, .15)`,
                      borderColor: getStyle('--cui-success'),
                      pointBackgroundColor: getStyle('--cui-success'),
                      pointBorderColor: '#fff',
                      data: [85, 80, 82, 88, 80, 85],
                    },
                  ],
                }}
                options={radarOptions()}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow xs={{ gutter: 4 }}>
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilCalendar} className="me-2" />
              Upcoming batch schedule
            </CCardHeader>
            <CCardBody>
              <CListGroup flush>
                {schedule.map((row) => (
                  <CListGroupItem key={row.day} className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold">{row.day}</div>
                      <div className="small text-body-secondary">{row.detail}</div>
                    </div>
                    <CBadge color="light" textColor="dark">
                      Scheduled
                    </CBadge>
                  </CListGroupItem>
                ))}
              </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilBell} className="me-2" />
              Notifications &amp; announcements
            </CCardHeader>
            <CCardBody>
              <CListGroup flush>
                <CListGroupItem>
                  <div className="d-flex gap-2">
                    <CIcon icon={cilWarning} className="text-warning mt-1" />
                    <div>
                      <div className="fw-semibold">Ice maintenance — Rink A</div>
                      <div className="small text-body-secondary">May 11, 06:00–08:00. Sessions moved to Rink B.</div>
                    </div>
                  </div>
                </CListGroupItem>
                <CListGroupItem>
                  <div className="fw-semibold">New waiver on file</div>
                  <div className="small text-body-secondary">3 parents signed overnight — all synced.</div>
                </CListGroupItem>
                <CListGroupItem>
                  <div className="fw-semibold">Staff stand-up</div>
                  <div className="small text-body-secondary">Friday 08:15 — skills curriculum tweaks.</div>
                </CListGroupItem>
              </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default CoachDashboard
