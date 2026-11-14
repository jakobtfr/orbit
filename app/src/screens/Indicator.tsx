import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chart } from '../components/Chart'
import { BackLink } from '../components/Shell'
import { StatusMark, Tag } from '../components/Status'
import { NextActionCard, ValueLine } from '../components/Tiles'
import { FIRST_DAY } from '../data/demo'
import { age, signed, stamp } from '../lib/format'
import { INDICATORS, REGIONS, formatValue } from '../lib/indicators'
import { actionFor, activeSymptoms, baselines, chartGuide, judge, now, readingsFor, symptomsFor } from '../lib/judge'
import { useStore } from '../lib/store'
import type { IndicatorKey, RegionKey } from '../lib/types'
import { Missing, ScreenTitle, usePerson } from './common'

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'Whole mission', days: 0 },
]
const ACTIVITY = { rest: 'Resting', during: 'During exercise', after: 'After exercise' }

export function Indicator() {
  const person = usePerson()
  const { key } = useParams()
  const { state } = useStore()
  const [range, setRange] = useState(30)
  if (!person || !key || !(key in INDICATORS)) return <Missing />

  const k = key as IndicatorKey
  const def = INDICATORS[k]
  const back = (
    <BackLink to={def.region === 'beside' ? `/body/${person.id}` : `/body/${person.id}/region/${def.region}`}>
      {def.region === 'beside' ? 'Your body' : REGIONS[def.region].name}
    </BackLink>
  )

  const t = now(state)
  const j = judge(state, person, k)
  const b = baselines(state, person, k)
  const all = readingsFor(state, person.id, k)
  const pre = person.preflight[k]
  const needsAction = j.status !== 'ok' && j.status !== 'unavailable'
  const action = needsAction ? actionFor(state, person, { kind: 'indicator', key: k, status: j.status, label: def.name }) : undefined
  const from = range ? t - range : FIRST_DAY
  const diff = (base?: number, base2?: number) => {
    if (!j.latest || base === undefined) return ''
    const d1 = signed(j.latest.v - base, def.decimals)
    return k === 'bp' && base2 !== undefined ? `${d1}/${signed((j.latest.v2 ?? 0) - base2, 0)}` : d1
  }
  const canMeasure = def.inputLabel !== ''

  return (
    <div className="screen indicator-screen">
      {back}
      <ScreenTitle>{def.name}</ScreenTitle>

      <section className="hero">
        {j.status === 'unavailable' ? (
          <>
            <div className="title-2">Not available here</div>
            <p className="body">{j.reason}</p>
          </>
        ) : (
          <ValueLine k={k} reading={j.latest} arrow={j.arrow} status={j.status} size="reading-xl" />
        )}
        {def.provenance === 'MODELLED' && <p className="body-sm">Estimated, not measured.</p>}
        <StatusMark status={j.status} size={16} />
        <div className="tags">
          {j.latest && <Tag>{age(t, j.latest.t)}</Tag>}
          <Tag>{j.latest?.source ?? def.source}</Tag>
        </div>
      </section>

      {j.status !== 'unavailable' && k !== 'vision' && (
        <section>
          <h2 className="title-3">Compared with you</h2>
          <div className="compare">
            <div className="compare-row">
              <span className="label">Before flight</span>
              {pre ? (
                <>
                  <span className="reading">{formatValue(k, pre)}<span className="unit">&nbsp;{def.unit}</span></span>
                  <span className="data">{diff(pre.v, pre.v2)} now</span>
                </>
              ) : (
                <span className="body-sm">No value from before flight</span>
              )}
            </div>
            <div className="compare-row">
              <span className="label">Your last 7 days</span>
              {b.recent !== undefined ? (
                <>
                  <span className="reading">{formatValue(k, { v: b.recent, v2: b.recent2 })}<span className="unit">&nbsp;{def.unit}</span></span>
                  <span className="data">{diff(b.recent, b.recent2)} now</span>
                </>
              ) : (
                <span className="body-sm">Not enough readings yet</span>
              )}
            </div>
          </div>
          {k === 'temp' && (
            <p className="body-sm note">
              Body temperature is expected to run about 1 °C above the before-flight value in flight. It is judged against the last 7 days of readings.
            </p>
          )}
        </section>
      )}

      {action && <NextActionCard action={action} />}
      {action && (j.status === 'caution' || j.status === 'warning') && <Link className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} to={`/doctor?about=${k}`}>Talk it through with the doctor</Link>}

      {def.chart && j.status !== 'unavailable' && (
        <section>
          <div className="section-row">
            <h2 className="title-3">Trend</h2>
            <div className="segmented" role="group" aria-label="Chart period">
              {RANGES.map((r) => (
                <button key={r.label} className={`btn btn-secondary ${range === r.days ? 'is-selected' : ''}`} aria-pressed={range === r.days} onClick={() => setRange(r.days)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Chart k={k} readings={all} guide={chartGuide(k, b)} baselines={b} from={from} to={t} decimals={def.decimals} />
        </section>
      )}

      <section>
        <h2 className="title-3">Readings</h2>
        {all.length === 0 ? (
          <p className="empty-line">No readings yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Time</th><th>Value</th><th>Context</th><th>Source</th></tr>
            </thead>
            <tbody>
              {all.slice(-10).reverse().map((r, i) => (
                <tr key={`${r.t}-${i}`}>
                  <td>{stamp(r.t)}</td>
                  <td className="cell-value">{formatValue(k, r)} {def.unit}</td>
                  <td>{ACTIVITY[r.activity]}</td>
                  <td>{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="quiet-row">
        {canMeasure && j.status !== 'unavailable' && (
          <Link className="btn btn-quiet" to={`/body/${person.id}/measure/${k}`}>How to measure</Link>
        )}
      </div>
    </div>
  )
}

export function Symptoms() {
  const person = usePerson()
  const { rid } = useParams()
  const { state } = useStore()
  if (!person || !rid || !(rid in REGIONS)) return <Missing />
  const region = rid as RegionKey
  const back = <BackLink to={`/body/${person.id}/region/${region}`}>{REGIONS[region].name}</BackLink>
  const act = activeSymptoms(state, person.id, region)
  const all = symptomsFor(state, person.id, region)
  const action = act.length
    ? actionFor(state, person, { kind: 'symptom', region, status: 'caution', label: act.map((s) => s.name).join(', ') })
    : undefined
  return (
    <div className="screen indicator-screen">
      {back}
      <ScreenTitle sub="What was reported in the daily check-in for this part of the body.">
        Symptoms: {REGIONS[region].name.toLowerCase()}
      </ScreenTitle>
      <section className="hero">
        <div className="title-2">{act.length ? act.map((s) => s.name).join(', ') : 'None reported'}</div>
        <StatusMark status={act.length ? 'caution' : 'ok'} size={16} />
        <div className="tags">
          <Tag>From your check-in</Tag>
        </div>
      </section>
      {action && <NextActionCard action={{ ...action, button: undefined }} />}
      <section>
        <h2 className="title-3">Reported</h2>
        {all.length === 0 ? (
          <p className="empty-line">Nothing has been reported here during the mission.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Time</th><th>Symptom</th><th>Pain, 0 to 10</th></tr>
            </thead>
            <tbody>
              {all.slice(0, 10).map((s, i) => (
                <tr key={i}>
                  <td>{stamp(s.t)}</td>
                  <td className="cell-value">{s.name}</td>
                  <td>{s.pain ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
