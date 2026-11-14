import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chart } from '../components/Chart'
import { StatusMark } from '../components/Status'
import { INDICATORS, INDICATOR_ORDER, formatValue } from '../lib/indicators'
import { baselines, chartGuide, judge, now, readingsFor } from '../lib/judge'
import { statistics } from '../lib/dashboard'
import { stamp } from '../lib/format'
import { useStore } from '../lib/store'
import type { IndicatorKey } from '../lib/types'

export function DeepData() {
  const { state, viewer } = useStore()
  const [key, setKey] = useState<IndicatorKey>('hr')
  const [days, setDays] = useState(28)
  const def = INDICATORS[key]
  const end = now(state)
  const from = state.day - days + 1
  const readings = readingsFor(state, viewer.id, key).filter((r) => r.t >= from && r.t <= end)
  const stats = statistics(readings.map((r) => r.v))
  const baseline = baselines(state, viewer, key)
  const status = judge(state, viewer, key)
  const fmt = (v: number | undefined, precision = def.decimals) => v === undefined ? '—' : v.toFixed(precision)
  const exportCsv = () => {
    const rows = [['mission_day', 'value', 'secondary_value', 'unit', 'provenance'], ...readings.map((r) => [r.t, r.v, r.v2 ?? '', def.unit, r.provenance])]
    const csv = rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `orbit-${key}-${days}days.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="planet-page">
    <header className="planet-page-title"><div><p className="eyebrow">MEASUREMENTS / DAY {state.day}</p><h1>Deep Data</h1></div><div className="data-page-actions"><Link className="btn btn-secondary" to="/replay">NASA data replay ↗</Link><button className="btn btn-secondary" onClick={exportCsv} disabled={!readings.length}>Export CSV ↓</button></div></header>
    <div className="data-toolbar"><label>Measurement<select value={key} onChange={(e) => setKey(e.target.value as IndicatorKey)}>{INDICATOR_ORDER.filter((k) => k !== 'mood' && INDICATORS[k].chart).map((k) => <option key={k} value={k}>{INDICATORS[k].name}</option>)}</select></label><div className="segmented" role="group" aria-label="Data time range">{[7, 28, 90].map((d) => <button key={d} className={`btn btn-secondary ${days === d ? 'is-selected' : ''}`} aria-pressed={days === d} onClick={() => setDays(d)}>{d} days</button>)}</div><StatusMark status={status.status} /></div>
    <div className="data-stat-grid">{[['Latest', status.latest ? formatValue(key, status.latest) : '—'], ['Mean', fmt(stats.mean)], ['Standard deviation', fmt(stats.sd, 2)], ['Variance', fmt(stats.variance, 3)], ['Samples', stats.n]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{label === 'Samples' ? 'observations' : label === 'Variance' ? `(${def.unit})²` : def.unit}</small></div>)}</div>
    <section className="planet-panel data-chart"><header><h2>{def.name}</h2><Link to={`/body/${viewer.id}/indicator/${key}`}>Indicator details ↗</Link></header><Chart k={key} readings={readings} guide={chartGuide(key, baseline)} baselines={baseline} from={from} to={end} decimals={def.decimals} /><p className="data-method">Simulated readings · SD and variance describe sample variation, not sensor error.</p></section>
    <section className="planet-panel"><header><h2>Measurement record</h2><span>{readings.length} samples</span></header><div className="data-table-wrap"><table className="measurement-table"><thead><tr><th>Mission time</th><th>Reading</th><th>Activity</th><th>Data source</th></tr></thead><tbody>{[...readings].reverse().map((r, i) => <tr key={`${r.t}-${i}`}><td>{stamp(r.t)}</td><td>{formatValue(key, r)} {def.unit}</td><td>{r.activity}</td><td>{r.provenance.toLowerCase()}</td></tr>)}</tbody></table>{!readings.length && <p className="data-method">No readings in this period.</p>}</div></section>
  </div>
}
