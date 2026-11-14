import { useId } from 'react'
import { Link } from 'react-router-dom'
import { binSamples, metricLevel, metricSamples, statistics, windowSamples, type Metric } from '../../lib/dashboard'
import type { AppState, Person } from '../../lib/types'

const COLORS = { ok: '#84c9a5', caution: '#e8c36c', warning: '#ed8c82' }
const LABELS = { ok: 'Within bands', caution: 'Review', warning: 'Above review band' }
export function ScientificPlot({ metric: m, state, person, days }: { metric: Metric; state: AppState; person: Person; days: number }) {
  const id = useId().replace(/:/g, '')
  const samples = windowSamples(metricSamples(state, person, m.key), state, days)
  const bins = binSamples(samples, state.day, days)
  const stats = statistics(samples.map((r) => r.v))
  const latestSample = samples.at(-1)
  const latest = latestSample?.v
  const level = latest === undefined ? undefined : metricLevel(m, latest)
  const color = level ? COLORS[level] : '#959d9e'
  const valid = bins.filter((b) => b.mean !== undefined)
  const lo = Math.min(m.domain[0], ...valid.map((b) => b.mean! - (b.sd ?? 0)))
  const hi = Math.max(m.domain[1], ...valid.map((b) => b.mean! + (b.sd ?? 0)))
  const x = (t: number) => 37 + (t - (state.day - days + 1)) / days * 267
  const y = (v: number) => 92 - (v - lo) / (hi - lo) * 72
  const label = (v: number | undefined, digits = m.decimals) => v === undefined ? '—' : v.toFixed(digits)
  const threshold = (v: number, stroke: string) => <g key={v}><line x1="37" x2="304" y1={y(v)} y2={y(v)} stroke={stroke} strokeDasharray="4 3" opacity=".65" /><text x="309" y={y(v) + 3} fill={stroke}>{Number(v.toFixed(2))}</text></g>
  return (
    <article className="science-plot">
      <header><div><Link to={`/body/${person.id}/indicator/${m.key}`}>{m.title} <span aria-hidden="true">↗</span></Link><span className="plot-hazard">{m.hazard}</span></div><div className="plot-current" style={{ color }}>{label(latest)} <small>{m.unit}</small><span className="plot-reading-day">{latestSample ? `Latest · D${Math.floor(latestSample.t)}` : 'No samples'}</span></div></header>
      <svg viewBox="0 0 350 114" role="img" aria-label={`${m.title}: ${days} days, ${days / 7}-day means with plus or minus one sample standard deviation. Latest ${label(latest)} ${m.unit}.`}>
        <defs><clipPath id={id}><rect x="36" y="14" width="269" height="80" /></clipPath></defs>
        {[lo, (lo + hi) / 2, hi].map((v) => <g key={v}><line x1="37" x2="304" y1={y(v)} y2={y(v)} stroke="#323b3b" strokeDasharray="1 4" /><text x="30" y={y(v) + 3} textAnchor="end">{Number(v.toFixed(1))}</text></g>)}
        <rect x="37" y="20" width="267" height="72" fill="none" stroke="#586160" strokeWidth=".6" />
        {threshold(m.caution, COLORS.caution)}{threshold(m.warning, COLORS.warning)}{m.low !== undefined && threshold(m.low, COLORS.warning)}
        <g clipPath={`url(#${id})`}>
          {bins.map((b, i) => {
            if (b.mean === undefined) return null
            const c = COLORS[metricLevel(m, b.mean)]
            const previous = bins[i - 1]
            return <g key={b.start}><title>{`Days ${b.start}–${b.end - 1}: mean ${label(b.mean)}, SD ${label(b.sd, 3)}, variance ${label(b.variance, 3)}; n=${b.n}`}</title>
              {previous?.mean !== undefined && <line x1={x(previous.t)} y1={y(previous.mean)} x2={x(b.t)} y2={y(b.mean)} stroke={c} strokeWidth="1.2" opacity=".8" />}
              {b.sd !== undefined && <path d={`M${x(b.t)} ${y(b.mean - b.sd)}V${y(b.mean + b.sd)} M${x(b.t) - 3} ${y(b.mean - b.sd)}h6 M${x(b.t) - 3} ${y(b.mean + b.sd)}h6`} fill="none" stroke={c} strokeWidth="1" />}
              <rect x={x(b.t) - 2.2} y={y(b.mean) - 2.2} width="4.4" height="4.4" fill={c} />
            </g>
          })}
        </g>
        {[0, 3, 6].map((i) => <g key={i}><line x1={x(bins[i].t)} x2={x(bins[i].t)} y1="92" y2="96" stroke="#6a7371" /><text x={x(bins[i].t)} y="108" textAnchor="middle">D{Math.floor(bins[i].t)}</text></g>)}
      </svg>
      <div className="plot-stats"><span>SD {label(stats.sd, 2)}</span><span>s² {label(stats.variance, 3)}</span><span>n={stats.n}</span><span style={{ color }}>{level ? (level === 'warning' && (m.lowerIsWorse || (m.low !== undefined && latest! < m.low)) ? 'Below review band' : LABELS[level]) : 'No data'}</span></div>
      <details className="plot-method"><summary>Method & reference</summary><p>{m.note}</p><p>Points: non-overlapping {days / 7}-day means. Bars: ±1 sample SD (n−1 denominator), not confidence intervals or sensor error. Footer SD and variance describe all {stats.n} samples in this window; units are {m.unit} and ({m.unit})². A bin with fewer than two samples has no error bar. Colors classify means; latest-value status is separate. No data is not normal.</p><a href={m.source} target="_blank" rel="noreferrer">{m.sourceLabel} ↗</a><table><thead><tr><th>Days</th><th>Mean</th><th>SD</th><th>s²</th><th>n</th></tr></thead><tbody>{bins.map((b) => <tr key={b.start}><td>{b.start}–{b.end - 1}</td><td>{label(b.mean)}</td><td>{label(b.sd, 2)}</td><td>{label(b.variance, 3)}</td><td>{b.n}</td></tr>)}</tbody></table></details>
    </article>
  )
}
