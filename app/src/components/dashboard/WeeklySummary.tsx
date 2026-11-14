import { Link } from 'react-router-dom'
import { metricSamples, metrics, statistics, windowSamples } from '../../lib/dashboard'
import { readingsFor } from '../../lib/judge'
import type { AppState, Person } from '../../lib/types'

export function WeeklySummary({ state, person }: { state: AppState; person: Person }) {
  const base = `/body/${person.id}`
  const sleep = statistics(windowSamples(readingsFor(state, person.id, 'sleep'), state, 7).map((r) => r.v))
  const pulse = statistics(windowSamples(readingsFor(state, person.id, 'hr'), state, 7).map((r) => r.v))
  const radiation = metricSamples(state, person, 'radiation').at(-1)?.v
  const limit = metrics(state, person).find((m) => m.key === 'radiation')!.warning
  return <section className="dashboard-column summary-column" aria-label="Weekly summary and risk outlook">
    <div className="column-label"><span>03 / WEEKLY REVIEW</span><span>D{state.day - 6}–{state.day}</span></div>
    <article className="dashboard-card weekly-brief">
      <header><span className="eyebrow">AUTOMATED SUMMARY</span><span className="small-tag">AI PREVIEW · MOCK</span></header>
      <p className="eyebrow">LAST SEVEN MISSION DAYS</p>
      <h2>Weekly health review</h2>
      <p>Review sleep duration, resting pulse, and exercise completion alongside your daily check-in.</p>
      <div className="brief-highlight"><span>01</span><div><strong>Sleep duration</strong><p>{sleep.mean === undefined ? 'No sleep readings available.' : `You averaged ${sleep.mean.toFixed(1)} hours of sleep across ${sleep.n} nights.`} Compare this with your planned sleep window.</p></div></div>
      <div className="brief-highlight"><span>02</span><div><strong>Resting pulse</strong><p>{pulse.mean === undefined ? 'No resting pulse readings available.' : `Resting pulse averaged ${pulse.mean.toFixed(0)} bpm this week; your preflight baseline is ${person.preflight.hr?.v ?? 'unknown'} bpm.`} A trend matters more than an isolated value.</p></div></div>
      <div className="brief-action"><span className="eyebrow">FOLLOW-UP</span><p>Keep a consistent sleep schedule and record fatigue in your next check-in.</p></div>
      <Link to={`${base}/indicator/sleep`} className="text-link">View sleep history <span>↗</span></Link>
      <p className="mock-note">Template summary of demo data. No AI model or clinical assessment is connected.</p>
    </article>
    <article className="dashboard-card outlook-card"><header><h2>Risk monitoring</h2><span className="small-tag">PREVIEW</span></header><p className="outlook-intro">What to monitor next. These are review prompts, not illness probabilities.</p>
      <Link to={`${base}/indicator/temp`} className="outlook-row"><div className="outlook-title"><strong>Fever & illness</strong><span className="risk-badge neutral">Not predicted</span></div><p>Temperature alone cannot predict infection. Compare with your in-flight baseline and record any new symptoms.</p><span className="outlook-action">Next: temperature & symptom check ↗</span></Link>
      <Link to={`${base}/indicator/radiation`} className="outlook-row"><div className="outlook-title"><strong>Radiation exposure</strong><span className={`risk-badge ${radiation !== undefined && radiation >= limit ? 'red' : 'neutral'}`}>{radiation === undefined ? 'No data' : radiation >= limit ? 'Above reference' : 'Within reference'}</span></div><p>{radiation === undefined ? 'No dose-rate readings available.' : `Demo rate: ${radiation.toFixed(2)} mSv/day; design reference: ${limit} mSv/day.`} Solar-event likelihood is unavailable.</p><span className="outlook-action">Next: review dose & shielding plan ↗</span></Link>
      <Link to={`${base}/indicator/sleep`} className="outlook-row"><div className="outlook-title"><strong>Fatigue & recovery</strong><span className="risk-badge amber">Review sleep</span></div><p>Review repeated short nights alongside how you feel. Use the crew’s planned rest periods and report persistent fatigue.</p><span className="outlook-action">Next: review sleep history ↗</span></Link>
    </article>
  </section>
}
