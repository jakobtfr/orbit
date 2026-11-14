import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BodyFigure } from '../components/BodyFigure'
import { StatusMark, Tag } from '../components/Status'
import { NextActionCard, StatusTile } from '../components/Tiles'
import { BESIDE, INDICATORS, INDICATOR_ORDER, REGIONS } from '../lib/indicators'
import { SEVERITY, actionFor, attention, checkedInToday, judge, regionSummaries } from '../lib/judge'
import { useStore } from '../lib/store'
import type { RegionKey } from '../lib/types'
import { Missing, usePerson } from './common'

export function Body() {
  const person = usePerson()
  const { state } = useStore()
  const nav = useNavigate()
  const [active, setActive] = useState<RegionKey | null>(null)
  if (!person) return <Missing />

  const summaries = regionSummaries(state, person)
  const items = attention(state, person)
  const action = items[0] ? actionFor(state, person, items[0]) : undefined
  const done = checkedInToday(state, person.id)
  const base = `/body/${person.id}`
  const open = (r: RegionKey) => nav(`${base}/region/${r}`)
  const mood = judge(state, person, 'mood')
  // Every indicator, the ones that need attention first. Mood stays in its private row.
  const explore = INDICATOR_ORDER.filter((k) => k !== 'mood')
    .map((k) => ({ k, sev: SEVERITY[judge(state, person, k).status] }))
    .sort((x, y) => y.sev - x.sev)
    .map((x) => x.k)

  return (
    <div className="screen body-screen">
      <header className="screen-head body-head">
        <div>
          <h1 className="title-1">Your body</h1>
          <p className="label">{person.role}</p>
        </div>
      </header>

      <div className="body-layout">
        <section className="region-list" aria-label="Body regions">
          <div className="label section-label">Regions</div>
          {summaries.map((s) => (
            <Link
              key={s.region}
              to={`${base}/region/${s.region}`}
              className={`region-row ${active === s.region ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(s.region)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(s.region)}
              onBlur={() => setActive(null)}
            >
              <span>{REGIONS[s.region].name}</span>
              <StatusMark status={s.status} />
            </Link>
          ))}
        </section>

        <BodyFigure summaries={summaries} active={active} onActive={setActive} onSelect={open} />

        <section className="beside" aria-label="Beside the body">
          <div className="label section-label">Beside the body</div>
          {BESIDE.map((k) => (
            <StatusTile key={k} person={person} k={k} />
          ))}
          <Link className="mood-row" to={`${base}/indicator/mood`}>
            <span>
              <span className="label">Mood (private)</span>
              <span className="data">{mood.latest ? `${mood.latest.v} of 5` : 'No entry yet'}</span>
            </span>
            <Tag>ONLY YOU</Tag>
          </Link>
        </section>
      </div>

      <div className="body-foot">
        {action ? (
          <NextActionCard action={action} />
        ) : (
          <p className="all-clear">Everything is in range.</p>
        )}
        {done ? (
          <p className="body checkin-done">Check-in done today</p>
        ) : (
          <Link className={`btn ${action?.button ? 'btn-secondary' : 'btn-primary'}`} to={`${base}/check-in`}>
            Start check-in
          </Link>
        )}
      </div>
      {items.length > 1 && (
        <p className="body-sm more-items">
          {items.length - 1} more {items.length - 1 === 1 ? 'item needs' : 'items need'} attention:{' '}
          {items.slice(1).map((i) => (i.key ? INDICATORS[i.key].name : i.label)).join(', ')}.
        </p>
      )}

      <section className="explore">
        <h2 className="title-2">Explore your measurements</h2>
        <div className="tile-grid">
          {explore.map((k) => (
            <StatusTile key={k} person={person} k={k} />
          ))}
        </div>
      </section>
    </div>
  )
}
