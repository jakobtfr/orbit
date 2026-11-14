import { Link } from 'react-router-dom'
import { useCall } from '../../lib/call'
import { actionFor, attention, checkedInToday, judge } from '../../lib/judge'
import { metricSamples, metrics } from '../../lib/dashboard'
import type { AppState, Person } from '../../lib/types'

export function RisksAndChecks({ state, person }: { state: AppState; person: Person }) {
  const base = `/body/${person.id}`
  const { openCall } = useCall()
  const rate = metricSamples(state, person, 'radiation').at(-1)?.v
  const limit = metrics(state, person).find((m) => m.key === 'radiation')!.warning
  const radiationHigh = rate !== undefined && rate >= limit
  const radiation = judge(state, person, 'radiation')
  const temp = judge(state, person, 'temp')
  const sleep = judge(state, person, 'sleep')
  const vision = judge(state, person, 'vision')
  const done = checkedInToday(state, person.id)
  const other = attention(state, person).filter((item) => !['radiation', 'temp', 'sleep', 'vision', 'exercise'].includes(item.key ?? ''))
  return <div className="dashboard-card reminders risks-checks" aria-label="Risks and scheduled checks">
    <header><h2>Risks & checks</h2></header>
    <Link className={`reminder-row ${radiationHigh || radiation.status === 'warning' ? 'priority-high' : ''}`} to={`${base}/indicator/radiation`}>
      <span className="reminder-icon">!</span><div><strong>Radiation exposure</strong><small>{rate === undefined ? 'No recent radiation reading' : `${rate.toFixed(2)} mSv today · limit ${limit} a day`}</small><em>{radiationHigh ? 'Review shielding plan' : 'See dose history'}</em></div><span className="check-arrow">↗</span>
    </Link>
    {other.map((item, i) => {
      const action = actionFor(state, person, item)
      const off = item.status === 'caution' || item.status === 'warning'
      const inside = <><span className="reminder-icon">!</span><div><strong>{item.label}</strong><small>{action.next}</small>{off && <em>Call the doctor about this</em>}</div><span className="check-arrow">↗</span></>
      const tone = `reminder-row ${item.status === 'warning' ? 'priority-high' : 'priority-soon'}`
      return off
        ? <button key={i} className={tone} onClick={() => openCall(item.key ?? item.region)}>{inside}</button>
        : <Link key={i} className={tone} to={action.button?.to ?? `${base}/check-in`}>{inside}</Link>
    })}
    <Link className={`reminder-row ${temp.status === 'warning' ? 'priority-high' : ['repeat', 'caution'].includes(temp.status) ? 'priority-soon' : ''}`} to={`${base}/indicator/temp`}><span className="reminder-icon">°</span><div><strong>Temperature & symptoms</strong><small>{temp.latest ? `${temp.latest.v.toFixed(1)} °C · compare with your usual` : 'No recent temperature reading'}</small></div><span className="check-arrow">↗</span></Link>
    <Link className={`reminder-row ${sleep.status === 'warning' ? 'priority-high' : ['repeat', 'caution'].includes(sleep.status) ? 'priority-soon' : ''}`} to={`${base}/indicator/sleep`}><span className="reminder-icon">☾</span><div><strong>Sleep & recovery</strong><small>Review sleep history and fatigue</small></div><span className="check-arrow">↗</span></Link>
    <Link className="reminder-row priority-soon" to={`${base}/indicator/exercise`}><span className="reminder-icon">↗</span><div><strong>Resistance & cardio</strong><small>120-minute plan</small><em>Today · 16:00</em></div><span className="check-arrow">↗</span></Link>
    <Link className={`reminder-row ${vision.status === 'warning' ? 'priority-high' : ''}`} to={`${base}/measure/vision`}><span className="reminder-icon">+</span><div><strong>Vision check</strong><em>{vision.status === 'warning' ? 'Review now' : 'Tomorrow'}</em></div><span className="check-arrow">↗</span></Link>
    <Link className={`dashboard-button ${done ? 'is-done' : ''}`} to={`${base}/check-in`}>{done ? '✓ Daily check-in complete' : '+ Complete daily check-in'}<span>↗</span></Link>
  </div>
}
