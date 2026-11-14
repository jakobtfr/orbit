import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chart } from '../components/Chart'
import { StatusMark } from '../components/Status'
import { FIRST_DAY } from '../data/demo'
import { signed } from '../lib/format'
import { INDICATORS, formatValue } from '../lib/indicators'
import { baselines, chartGuide, judge, now, readingsFor } from '../lib/judge'
import { downloadResearch } from '../lib/research'
import { useStore } from '../lib/store'
import type { IndicatorKey } from '../lib/types'
import '../research.css'

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '28 days', days: 28 },
  { label: '90 days', days: 90 },
  { label: 'Whole mission', days: 0 },
]

const GROUPS: { title: string; keys: IndicatorKey[] }[] = [
  { title: 'Chest', keys: ['hr', 'bp', 'standing', 'spo2'] },
  { title: 'Head', keys: ['vision'] },
  { title: 'Whole body', keys: ['temp', 'weight'] },
  { title: 'Hips and spine', keys: ['bone'] },
  { title: 'Daily routine', keys: ['sleep', 'exercise', 'radiation', 'cabin', 'mood'] },
]

const EXPLORABLE = GROUPS.flatMap((group) => group.keys)

export function Measurements() {
  const { state, viewer } = useStore()
  const [key, setKey] = useState<IndicatorKey>('hr')
  const [days, setDays] = useState(28)
  const t = now(state)
  const from = days ? state.day - days + 1 : FIRST_DAY
  const def = INDICATORS[key]
  const judged = judge(state, viewer, key)
  const base = baselines(state, viewer, key)
  const guide = chartGuide(key, base)
  const series = readingsFor(state, viewer.id, key).filter((r) => r.t >= from && r.t <= t && r.activity === 'rest')
  const pre = viewer.preflight[key]
  const latest = judged.latest
  const change = (() => {
    if (!latest || pre?.v === undefined) return undefined
    const upper = signed(latest.v - pre.v, def.decimals)
    if (key === 'bp' && pre.v2 !== undefined) return `${upper}/${signed((latest.v2 ?? 0) - pre.v2, 0)}`
    return `${upper} ${def.unit}`
  })()

  const exportCsv = () => {
    const rows = [['measurement', 'mission_day', 'value', 'second_value', 'unit']]
    for (const item of EXPLORABLE) {
      const info = INDICATORS[item]
      for (const reading of readingsFor(state, viewer.id, item)) {
        if (reading.t < from || reading.t > t) continue
        rows.push([info.name, String(Math.floor(reading.t)), String(reading.v), reading.v2 === undefined ? '' : String(reading.v2), info.unit])
      }
    }
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')
    downloadResearch(csv, 'text/csv;charset=utf-8', `lena-day-${Math.floor(from)}-${state.day}.csv`)
  }

  return (
    <div className="planet-page research-page">
      <header className="planet-page-title">
        <div>
          <h1>Measurements</h1>
          <p className="research-lead">Your measurements, compared with your own normal.</p>
        </div>
        <div className="data-page-actions">
          <Link className="btn btn-secondary" to={`/body/${viewer.id}/indicator/${key}`}>Open this measurement</Link>
          <button className="btn btn-secondary" onClick={exportCsv}>Download data ↓</button>
        </div>
      </header>
      <div className="research-toolbar">
        <div className="research-ranges" role="group" aria-label="Time range">
          {RANGES.map((range) => (
            <button key={range.label} aria-pressed={days === range.days} onClick={() => setDays(range.days)}>{range.label}</button>
          ))}
        </div>
        <span className="research-interval">Mission days {Math.floor(from)}–{state.day}</span>
      </div>
      <div className="research-layout">
        <section className="research-figures" aria-label={def.name}>
          <article className="paper-card lena-record">
            <header>
              <h2>{def.name}</h2>
              <StatusMark status={judged.status} />
            </header>
            {judged.status === 'unavailable' ? (
              <p className="paper-empty">{judged.reason}</p>
            ) : def.chart ? (
              <Chart k={key} readings={readingsFor(state, viewer.id, key)} guide={guide} baselines={base} from={from} to={t} decimals={def.decimals} />
            ) : (
              <p className="paper-empty">{latest ? `${formatValue(key, latest)} ${def.unit}`.trim() : 'No readings yet.'} This check is stored as a result, without a daily trend.</p>
            )}
            <footer>
              <span>Latest <strong>{latest ? formatValue(key, latest) : '—'}</strong> {def.unit}</span>
              <span>{series.length} {series.length === 1 ? 'reading' : 'readings'} in this range</span>
              {pre && <span>Before flight <strong>{formatValue(key, pre)}</strong> {def.unit}</span>}
              {change && <span>{change} from before flight</span>}
            </footer>
          </article>
          {judged.status !== 'unavailable' && <p className="research-note">
            {def.provenance === 'MODELLED' ? 'Estimated, not measured. ' : ''}
            The line is your readings. A band is your normal, a solid mark is your personal limit, and a dashed mark is the Earth cutoff.
            {' '}<span>{def.source}.</span>
          </p>}
        </section>
        <aside className="research-sidebar" aria-label="Your measurements">
          <section className="clinical-summary">
            <header><h2>Your measurements</h2></header>
            <p className="review-context">{viewer.name} · mission day {state.day}</p>
            {GROUPS.map((group) => (
              <div key={group.title} className="measure-group">
                <h3>{group.title}</h3>
                <div className="measure-list">
                  {group.keys.map((item) => {
                    const info = INDICATORS[item]
                    const result = judge(state, viewer, item)
                    return (
                      <button key={item} aria-pressed={item === key} onClick={() => setKey(item)}>
                        <span className="measure-name">{info.name}</span>
                        <span className="measure-value">{result.latest ? formatValue(item, result.latest) : '—'}</span>
                        <span className="measure-meta"><StatusMark status={result.status} size={12} /></span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  )
}
