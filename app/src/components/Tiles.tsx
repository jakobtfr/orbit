import { Link } from 'react-router-dom'
import { age } from '../lib/format'
import { INDICATORS, formatValue } from '../lib/indicators'
import { activeSymptoms, judge, now, symptomStatus } from '../lib/judge'
import { useStore } from '../lib/store'
import type { Action, IndicatorKey, Person, Reading, RegionKey } from '../lib/types'
import { STATUS, StatusMark, Tag } from './Status'

export function ValueLine({ k, reading, arrow, status, size = 'reading' }: {
  k: IndicatorKey
  reading?: Reading
  arrow?: string
  status: keyof typeof STATUS
  size?: 'reading' | 'reading-xl'
}) {
  const def = INDICATORS[k]
  const muted = status === 'stale' || status === 'unavailable'
  return (
    <div className={`${size} ${muted ? 'is-muted' : ''}`}>
      {reading && status !== 'unavailable' ? formatValue(k, reading) : '—'}
      {reading && status !== 'unavailable' && def.unit && <span className="unit">&nbsp;{def.unit}</span>}
      {arrow && <span className="arrow" style={{ color: STATUS[status].color }}>&nbsp;{arrow}</span>}
    </div>
  )
}

export function StatusTile({ person, k }: { person: Person; k: IndicatorKey }) {
  const { state } = useStore()
  const def = INDICATORS[k]
  const j = judge(state, person, k)
  return (
    <Link className="tile" to={`/body/${person.id}/indicator/${k}`}>
      <div className="label">{def.name}</div>
      <ValueLine k={k} reading={j.latest} arrow={j.arrow} status={j.status} />
      <StatusMark status={j.status} />
      <div className="tags">
        {j.latest && <Tag>{age(now(state), j.latest.t)}</Tag>}
      </div>
    </Link>
  )
}

export function SymptomTile({ person, region }: { person: Person; region: RegionKey }) {
  const { state } = useStore()
  const act = activeSymptoms(state, person.id, region)
  const status = symptomStatus(state, person.id, region)
  return (
    <Link className="tile" to={`/body/${person.id}/symptoms/${region}`}>
      <div className="label">Symptoms</div>
      <div className="reading reading-text">{act.length ? act.map((s) => s.name).join(', ') : 'None reported'}</div>
      <StatusMark status={status} />
      <div className="tags">
        {act[0] && <Tag>{age(now(state), act[0].t)}</Tag>}
      </div>
    </Link>
  )
}

export function NextActionCard({ action }: { action: Action }) {
  return (
    <section className="action-card" aria-label="Next action">
      <div className="action-head">
        <span className="label">Next action</span>
      </div>
      <p className="body">{action.observed}</p>
      <p className="title-3">{action.next}</p>
      {action.button && (
        <Link className="btn btn-primary" to={action.button.to}>
          {action.button.label}
        </Link>
      )}
    </section>
  )
}
