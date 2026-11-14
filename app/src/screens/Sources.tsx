import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StatusShape } from '../components/Status'
import { DEVICES, HAND_ENTERED, LOW_BATTERY, battery } from '../data/devices'
import { age } from '../lib/format'
import { INDICATORS, formatValue } from '../lib/indicators'
import { judge, now } from '../lib/judge'
import { useStore } from '../lib/store'
import type { IndicatorKey, StatusKey } from '../lib/types'
import { ScreenTitle } from './common'

interface Row {
  id: string
  name: string
  note: string
  feeds: IndicatorKey[]
  linked: boolean
  level?: number
  chargeDays?: number
  power: string
}

function Feed({ k }: { k: IndicatorKey }) {
  const { state, viewer } = useStore()
  const j = judge(state, viewer, k)
  const def = INDICATORS[k]
  return (
    <Link className="feed-row" to={`/body/${viewer.id}/indicator/${k}`}>
      <span className="feed-name">{def.name}</span>
      <span className="data">
        {j.status === 'unavailable' ? 'Not available here' : j.latest ? `${formatValue(k, j.latest)} ${def.unit}` : 'No reading yet'}
      </span>
    </Link>
  )
}

function SourceRow({ row, selected }: { row: Row; selected: boolean }) {
  const { state, viewer } = useStore()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'center' })
  }, [selected])

  const judged = row.feeds.map((k) => judge(state, viewer, k))
  const available = judged.filter((j) => j.status !== 'unavailable')
  const last = Math.max(-Infinity, ...judged.map((j) => j.latest?.t ?? -Infinity))
  const low = row.level !== undefined && row.level < LOW_BATTERY
  let status: StatusKey = 'ok'
  let word = row.linked ? 'Connected' : 'Ready'
  if (available.length === 0) {
    status = 'unavailable'
    word = 'Not in use here'
  } else if (available.every((j) => j.status === 'stale')) {
    status = 'stale'
    word = 'No recent data'
  } else if (low) {
    status = 'caution'
    word = 'Needs charging'
  }

  return (
    <div className={`source-row ${selected ? 'is-selected' : ''}`} ref={ref} role="row">
      <div role="cell">
        <div className="source-name">{row.name}</div>
        <div className="body-sm">{row.note}</div>
      </div>
      <div role="cell">
        <span className="status-mark">
          <StatusShape status={status} />
          <span style={{ color: status === 'unavailable' ? 'var(--text-muted)' : `var(--status-${status})` }}>{word}</span>
        </span>
        <div className="body-sm">{row.linked ? 'Sends readings on its own' : 'Entered by hand'}</div>
      </div>
      <div role="cell">
        <div className="data source-strong">{row.power}</div>
        {row.level !== undefined && (
          <div className="meter" role="img" aria-label={`Battery ${row.level}%`}>
            <span style={{ width: `${row.level}%` }} />
          </div>
        )}
        {row.chargeDays && <div className="body-sm">About {row.chargeDays} days per charge</div>}
      </div>
      <div role="cell">
        <div className="data source-strong">{Number.isFinite(last) ? age(now(state), last) : 'None yet'}</div>
      </div>
      <div role="cell" className="source-feeds">
        {row.feeds.map((k) => <Feed key={k} k={k} />)}
      </div>
    </div>
  )
}

export function Sources() {
  const { state } = useStore()
  const [params] = useSearchParams()
  const selected = params.get('device')

  const device = (owner: 'personal' | 'shared'): Row[] =>
    DEVICES.filter((d) => d.owner === owner).map((d) => {
      const level = battery(d, state.day)
      return {
        id: d.id,
        name: d.name,
        note: d.spec,
        feeds: d.feeds,
        linked: d.how === 'Sends readings on its own',
        level,
        chargeDays: d.chargeDays,
        power: level === undefined ? 'Cabin power' : `Battery ${level}%`,
      }
    })
  const groups: { title: string; rows: Row[] }[] = [
    { title: 'Yours', rows: device('personal') },
    { title: 'Shared on board', rows: device('shared') },
    {
      title: 'No device',
      rows: HAND_ENTERED.map((h) => ({ id: h.name, name: h.name, note: h.note, feeds: h.feeds, linked: false, power: 'No power needed' })),
    },
  ]

  return (
    <div className="screen">
      <ScreenTitle sub="The equipment ORBIT reads from, whether it is working, and which readings each one feeds.">Sources</ScreenTitle>
      <div className="source-table" role="table" aria-label="Sources">
        <div className="source-row source-head" role="row">
          <div role="columnheader">Source</div>
          <div role="columnheader">Status</div>
          <div role="columnheader">Power</div>
          <div role="columnheader">Last reading</div>
          <div role="columnheader">Feeds</div>
        </div>
        {groups.map((g) => (
          <div key={g.title} role="rowgroup">
            <div className="source-group label">{g.title}</div>
            {g.rows.map((r) => <SourceRow key={r.id} row={r} selected={r.id === selected} />)}
          </div>
        ))}
      </div>
    </div>
  )
}
