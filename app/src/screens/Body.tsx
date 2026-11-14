import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BodyFigure } from '../components/BodyFigure'
import { StatusShape } from '../components/Status'
import { ActivityPanel } from '../components/dashboard/ActivityPanel'
import { WeeklySummary } from '../components/dashboard/WeeklySummary'
import { ScientificPlot } from '../components/dashboard/ScientificPlot'
import { metrics } from '../lib/dashboard'
import { REGIONS } from '../lib/indicators'
import { regionSummaries } from '../lib/judge'
import { useStore } from '../lib/store'
import type { RegionKey } from '../lib/types'
import { Missing, usePerson } from './common'
import '../dashboard.css'

export function Body() {
  const person = usePerson()
  const { state } = useStore()
  const nav = useNavigate()
  const [active, setActive] = useState<RegionKey | null>(null)
  const [days, setDays] = useState(28)
  if (!person) return <Missing />
  const summaries = regionSummaries(state, person)
  const base = `/body/${person.id}`
  return <div className="screen dashboard-screen">
    <header className="dashboard-header"><div><p className="eyebrow">CREW HEALTH / PERSONAL OVERVIEW</p><h1>Your health, in orbit<span>.</span></h1><p>A little perspective. A clearer next step.</p></div><div className="dashboard-header-meta"><span className="simulation-label"><i /> SIMULATED MISSION</span><span>MISSION DAY <strong>{String(state.day).padStart(3, '0')}</strong></span></div></header>
    <div className="dashboard-grid">
      <section className="dashboard-column body-column" aria-label="Interactive body map"><div className="column-label"><span>01 / BODY OVERVIEW</span><span>Personal</span></div>
        <BodyFigure summaries={summaries} active={active} onActive={setActive} onSelect={(r) => nav(`${base}/region/${r}`)} />
        <div className="body-region-links">{summaries.map((s) => <Link key={s.region} to={`${base}/region/${s.region}`} className={active === s.region ? 'is-active' : ''} onMouseEnter={() => setActive(s.region)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(s.region)} onBlur={() => setActive(null)}><StatusShape status={s.status} size={10} /><span>{REGIONS[s.region].name}</span><span aria-hidden="true">↗</span></Link>)}</div>
      </section>
      <ActivityPanel state={state} person={person} />
      <WeeklySummary state={state} person={person} />
      <section className="dashboard-column science-column" aria-label="Five health trend plots"><div className="column-label"><span>04 / HEALTH TELEMETRY</span><div className="plot-range" aria-label="Plot time range" role="group">{[14, 28].map((d) => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>{d}D</button>)}</div></div>
        <div className="science-header"><p>Trends, with context.</p><span>Means ±1 SD · {days / 7}-day bins · simulated</span><div className="plot-legend"><span><i className="green" />Within bands</span><span><i className="amber" />Review</span><span><i className="red" />High concern</span></div></div>
        {metrics(state, person).map((m) => <ScientificPlot key={m.key} metric={m} state={state} person={person} days={days} />)}
        <p className="science-note">Bars show sample variability, not measurement uncertainty. Dashed lines show review thresholds; open each reference for its scope.</p>
      </section>
    </div>
    <footer className="dashboard-footer"><span>ORBIT / CREW HEALTH SYSTEM</span><p>Research prototype · simulated readings · mock AI summary</p><a href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noreferrer">The five spaceflight hazards ↗</a></footer>
  </div>
}
