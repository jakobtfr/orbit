import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { EXERCISE_PLAN_MIN, actionFor, attention, checkedInToday, judge, readingsFor } from '../../lib/judge'
import { metricSamples, metrics, statistics, windowSamples } from '../../lib/dashboard'
import { StatusMark } from '../Status'
import type { AppState, Person } from '../../lib/types'

function Ring({ value, goal, color, label, unit, to }: { value?: number; goal: number; color: string; label: string; unit: string; to: string }) {
  const progress = value === undefined ? 0 : Math.min(Math.max(value / goal, 0), 1)
  return <Link to={to} className="activity-ring" style={{ '--ring-color': color } as CSSProperties}>
    <svg viewBox="0 0 150 150" aria-hidden="true"><circle cx="75" cy="75" r="63" className="ring-track" /><circle cx="75" cy="75" r="63" pathLength={100} className="ring-fill" strokeOpacity={progress === 0 ? 0 : 1} strokeDasharray={progress >= 1 ? undefined : `${progress * 100} 100`} transform="rotate(-90 75 75)" /></svg>
    <div><span>{label}</span><strong>{value === undefined ? '—' : Math.round(value)}</strong><small>{unit} / {goal} goal</small></div>
  </Link>
}
export function ActivityPanel({ state, person }: { state: AppState; person: Person }) {
  const base = `/body/${person.id}`
  const sleep = judge(state, person, 'sleep')
  const hr = judge(state, person, 'hr')
  const exercise = judge(state, person, 'exercise')
  const weekExercise = windowSamples(readingsFor(state, person.id, 'exercise'), state, 7)
  const adherence = statistics(weekExercise.map((r) => Math.min(1, r.v / EXERCISE_PLAN_MIN) * 100)).mean
  const done = checkedInToday(state, person.id)
  const warnings = attention(state, person)
  const radiationRate = metricSamples(state, person, 'radiation').at(-1)?.v
  const radiationLimit = metrics(state, person).find((m) => m.key === 'radiation')!.warning
  const radiationReview = radiationRate !== undefined && radiationRate >= radiationLimit
  const sleepHours = sleep.latest ? Math.floor(sleep.latest.v) : undefined
  const sleepMinutes = sleep.latest ? Math.round((sleep.latest.v % 1) * 60) : undefined
  return <section className="dashboard-column activity-column" aria-label="Daily activity and reminders">
    <div className="column-label"><span>02 / DAILY ACTIVITY</span><span>Today</span></div>
    <div className="activity-card">
      <div className="activity-pair"><Ring value={exercise.latest?.v} goal={120} color="#80c7bc" label="Movement" unit="min" to={`${base}/indicator/exercise`} /><Link className="activity-pill sleep-pill" to={`${base}/indicator/sleep`}><span className="pill-symbol">☾</span><span className="eyebrow">LAST NIGHT</span><strong>{sleepHours === undefined ? '—' : `${sleepHours}h ${sleepMinutes}m`}</strong><span>8h sleep goal</span></Link></div>
      <Link className="activity-pill pulse-pill" to={`${base}/indicator/hr`}><span className="pill-symbol">♡</span><div><span>Resting heart rate</span><strong>{hr.latest?.v ?? '—'} <small>bpm</small></strong></div><StatusMark status={hr.status} /></Link>
      <div className="activity-pair second-pair"><Link className="activity-pill oxygen-pill" to={`${base}/indicator/spo2`}><span className="pill-symbol">O₂</span><span>Blood oxygen</span><strong>{judge(state, person, 'spo2').latest?.v ?? '—'}<small> %</small></strong><span>Latest reading</span></Link><Ring value={adherence} goal={100} color="#d8bb79" label="Weekly plan" unit="%" to={`${base}/indicator/exercise`} /></div>
    </div>
    <div className="dashboard-card reminders"><header><h2>Alerts & schedule</h2><span className="small-tag">TODAY</span></header>
      {radiationReview && <Link className="reminder-row reminder-warning priority-high" to={`${base}/indicator/radiation`}><span className="reminder-icon">!</span><div><strong>Radiation review</strong><small>{radiationRate?.toFixed(2)} mSv/d · above reference</small><em>Review now</em></div></Link>}
      {warnings.length ? warnings.slice(0, 2).map((item, i) => { const action = actionFor(state, person, item); return <Link key={i} className="reminder-row reminder-warning" to={action.button?.to ?? `${base}/check-in`}><span className="reminder-icon">!</span><div><strong>{action.observed}</strong><small>{action.next}</small></div><span>↗</span></Link> }) : !radiationReview ? <div className="reminder-row"><span className="reminder-icon clear-icon">✓</span><div><strong>No active vital alerts</strong><small>Based on current demo readings.</small></div></div> : null}
      <Link className="reminder-row priority-soon" to={`${base}/indicator/exercise`}><span className="reminder-icon">↗</span><div><strong>Resistance & cardio</strong><small>120-minute plan</small><em>Today · 16:00 · demo</em></div></Link>
      <Link className="reminder-row" to={`${base}/measure/vision`}><span className="reminder-icon">+</span><div><strong>Vision check</strong><em>Tomorrow · demo</em></div></Link>
      <Link className={`dashboard-button ${done ? 'is-done' : ''}`} to={`${base}/check-in`}>{done ? '✓ Daily check-in complete' : '+ Complete daily check-in'}<span>↗</span></Link>
    </div>
  </section>
}
