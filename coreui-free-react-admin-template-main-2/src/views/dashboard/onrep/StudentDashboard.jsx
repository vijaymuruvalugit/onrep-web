import React, { useEffect, useRef } from 'react'

import {
  CAvatar,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CWidgetStatsA,
} from '@coreui/react'
import { CChartBar } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import CIcon from '@coreui/icons-react'
import {
  cilArrowRight,
  cilBolt,
  cilCalendar,
  cilFire,
  cilGraph,
  cilHappy,
  cilListRich,
  cilStar,
} from '@coreui/icons'

import avatar1 from 'src/assets/images/avatars/1.jpg'
import avatar5 from 'src/assets/images/avatars/5.jpg'
import avatar6 from 'src/assets/images/avatars/6.jpg'

import { barChartOptions } from './chartOptions'

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

const milestones = [
  { title: 'First clean spin', done: true },
  { title: 'Level 3 skills badge', done: true },
  { title: 'Competition debut', done: false },
  { title: 'Axel prep — off-ice', done: false },
]

const leaderboard = [
  { name: 'You', rank: 2, streak: 12, avatar: avatar1, highlight: true },
  { name: 'Jordan', rank: 1, streak: 15, avatar: avatar5 },
  { name: 'Sam', rank: 3, streak: 9, avatar: avatar6 },
]

const StudentDashboard = () => {
  const loadRef = useRef(null)
  useChartColorSync(loadRef)

  return (
    <>
      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="danger"
            value={
              <>
                12{' '}
                <span className="fs-6 fw-normal text-white-50">days</span>
              </>
            }
            title="Attendance streak"
            chart={
              <CChartBar
                className="mt-2 mx-auto"
                style={{ height: '56px', width: '90%' }}
                data={{
                  labels: ['', '', '', '', '', '', ''],
                  datasets: [
                    {
                      backgroundColor: 'rgba(255,255,255,.35)',
                      data: [3, 4, 5, 4, 6, 5, 7],
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { display: false }, y: { display: false } },
                }}
              />
            }
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="warning"
            value="Level 4"
            title="Progress tier"
            chart={
              <div className="d-flex justify-content-center align-items-end mt-2" style={{ height: '56px' }}>
                {[40, 55, 70, 85].map((h, i) => (
                  <div
                    key={i}
                    className="bg-white bg-opacity-25 mx-1 rounded-top"
                    style={{ width: '12px', height: `${h}%` }}
                  />
                ))}
              </div>
            }
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="info"
            value="6"
            title="Achievements unlocked"
            chart={
              <div className="text-center mt-2 text-white-50">
                <CIcon icon={cilStar} size="3xl" />
              </div>
            }
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsA
            color="success"
            value="Sat 09:00"
            title="Next session"
            chart={
              <CChartBar
                className="mt-2 mx-auto"
                style={{ height: '56px', width: '90%' }}
                data={{
                  labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                  datasets: [
                    {
                      backgroundColor: 'rgba(255,255,255,.4)',
                      data: [1, 0, 1, 1, 0, 2, 1],
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { display: false }, y: { display: false } },
                }}
              />
            }
          />
        </CCol>
      </CRow>

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol lg={5}>
          <CCard className="h-100 border-info border-opacity-50">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Your momentum</strong>
                <div className="small text-body-secondary">Keep the streak alive</div>
              </div>
              <CBadge color="info" className="d-flex align-items-center gap-1">
                <CIcon icon={cilFire} /> Hot week
              </CBadge>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{
                    width: '88px',
                    height: '88px',
                    background: `conic-gradient(${getStyle('--cui-success')} 78%, ${getStyle('--cui-border-color')} 0)`,
                  }}
                >
                  <span
                    className="rounded-circle bg-body d-flex align-items-center justify-content-center"
                    style={{ width: '72px', height: '72px' }}
                  >
                    <span className="fs-5 fw-bold text-success">78%</span>
                  </span>
                </div>
                <div>
                  <div className="text-body-secondary small">Training load completion</div>
                  <div className="fs-5 fw-semibold">On track for next badge</div>
                  <CButton color="primary" size="sm" className="mt-2">
                    View drills <CIcon icon={cilArrowRight} className="ms-1" />
                  </CButton>
                </div>
              </div>
              <div className="rounded bg-body-tertiary p-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                    <CIcon icon={cilHappy} className="text-warning" size="lg" />
                  <span className="fw-semibold">Coach shout-out</span>
                </div>
                <p className="small mb-0 text-body-secondary">
                  “Love the energy you brought to spins today — same focus next ice block.”
                </p>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={7}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilGraph} className="me-2" />
              Weekly session energy
            </CCardHeader>
            <CCardBody>
              <CChartBar
                ref={loadRef}
                style={{ height: '220px' }}
                data={{
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [
                    {
                      label: 'Ice time (hrs)',
                      backgroundColor: getStyle('--cui-primary'),
                      data: [1.5, 0, 2, 1, 0, 2.5, 1],
                    },
                    {
                      label: 'Off-ice (hrs)',
                      backgroundColor: getStyle('--cui-info'),
                      data: [0.5, 1, 0.5, 1, 0.5, 0, 1],
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
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilListRich} className="me-2" />
              Milestones
            </CCardHeader>
            <CCardBody>
              <ul className="list-unstyled mb-0">
                {milestones.map((m) => (
                  <li key={m.title} className="d-flex align-items-center gap-2 mb-3">
                    <CIcon
                      icon={m.done ? cilStar : cilBolt}
                      className={m.done ? 'text-warning' : 'text-body-secondary'}
                    />
                    <span className={m.done ? 'fw-semibold' : 'text-body-secondary'}>{m.title}</span>
                    {m.done && (
                      <CBadge color="success" className="ms-auto">
                        Unlocked
                      </CBadge>
                    )}
                  </li>
                ))}
              </ul>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilCalendar} className="me-2" />
              Next up
            </CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="text-body-secondary small">Tomorrow</div>
                  <div className="fw-semibold fs-5">07:30 — Edge class</div>
                  <div className="small text-body-secondary">Rink A · Coach Priya</div>
                </div>
                <CBadge color="primary" shape="rounded-pill">
                  Check-in opens 07:00
                </CBadge>
              </div>
              <CProgress thin color="primary" value={72} className="mb-1" />
              <div className="small text-body-secondary">Prep checklist 72% — pack guards + water</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow xs={{ gutter: 4 }}>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <CIcon icon={cilStar} className="me-2" />
              Squad leaderboard <span className="text-body-secondary fw-normal">(friendly)</span>
            </CCardHeader>
            <CCardBody className="p-0">
              <CRow className="g-0 text-center border-bottom border-secondary border-opacity-25 py-2 small text-body-secondary fw-semibold">
                <CCol xs={2}>Rank</CCol>
                <CCol xs={5} className="text-start ps-4">
                  Skater
                </CCol>
                <CCol xs={3}>Streak</CCol>
                <CCol xs={2}>Spark</CCol>
              </CRow>
              {leaderboard.map((row) => (
                <CRow
                  key={row.name}
                  className={`g-0 align-items-center py-3 border-bottom border-light ${row.highlight ? 'bg-primary bg-opacity-10' : ''}`}
                >
                  <CCol xs={2} className="text-center">
                    <span className="fs-5 fw-bold">#{row.rank}</span>
                  </CCol>
                  <CCol xs={5} className="ps-4">
                    <div className="d-flex align-items-center gap-2">
                      <CAvatar src={row.avatar} size="md" />
                      <span className="fw-semibold">{row.name}</span>
                      {row.highlight && <CBadge color="primary">You</CBadge>}
                    </div>
                  </CCol>
                  <CCol xs={3} className="text-center">
                    <CBadge color="danger" className="d-inline-flex align-items-center gap-1">
                      <CIcon icon={cilFire} size="sm" />
                      {row.streak}d
                    </CBadge>
                  </CCol>
                  <CCol xs={2} className="text-center">
                    <CProgress thin color="warning" value={row.rank === 1 ? 100 : row.rank === 2 ? 85 : 65} />
                  </CCol>
                </CRow>
              ))}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default StudentDashboard
