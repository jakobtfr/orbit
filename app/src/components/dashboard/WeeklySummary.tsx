import { Link } from 'react-router-dom'
import { HealthChat } from './HealthChat'
import { metricSamples, metrics } from '../../lib/dashboard'
import type { AppState, Person } from '../../lib/types'

export function WeeklySummary({ state, person }: { state: AppState; person: Person }) {
  const base = `/body/${person.id}`
  const radiation = metricSamples(state, person, 'radiation').at(-1)?.v
  const limit = metrics(state, person).find((m) => m.key === 'radiation')!.warning
  return <section className="dashboard-column summary-column" aria-label="Weekly summary and risk outlook">
    <div className="column-label"><span>03 / WEEKLY REVIEW</span><span>D{state.day - 6}–{state.day}</span></div>
    <HealthChat key={`${person.id}-${state.day}`} state={state} person={person} />
    <article className="dashboard-card outlook-card"><header><h2>Risk monitoring</h2><span className="small-tag">PREVIEW</span></header>
      <Link to={`${base}/indicator/temp`} className="outlook-row"><div className="outlook-title"><strong>Fever & illness</strong><span className="risk-badge neutral">Not predicted</span></div><span className="outlook-action">Check temperature & symptoms ↗</span></Link>
      <Link to={`${base}/indicator/radiation`} className="outlook-row"><div className="outlook-title"><strong>Radiation exposure</strong><span className={`risk-badge ${radiation !== undefined && radiation >= limit ? 'red' : 'neutral'}`}>{radiation === undefined ? 'No data' : radiation >= limit ? 'Above reference' : 'Within reference'}</span></div><p>{radiation === undefined ? 'No dose data' : `${radiation.toFixed(2)} mSv/d · reference ${limit}`}</p><span className="outlook-action">Review shielding plan ↗</span></Link>
      <Link to={`${base}/indicator/sleep`} className="outlook-row"><div className="outlook-title"><strong>Fatigue & recovery</strong><span className="risk-badge amber">Review sleep</span></div><span className="outlook-action">Review sleep history ↗</span></Link>
    </article>
  </section>
}
