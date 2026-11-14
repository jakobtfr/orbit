import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { metricLevel, metricSamples, statistics, windowSamples, type Metric } from '../../lib/dashboard'
import type { AppState, Person } from '../../lib/types'

const COLORS = { ok: '#30d158', caution: '#ffd60a', warning: '#ff6961' }
export function ScientificPlot({ metric: m, state, person, days }: { metric: Metric; state: AppState; person: Person; days: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 350, height: 270 })
  useEffect(() => {
    const element = svgRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const left = 32
  const right = size.width - 42
  const top = 16
  const bottom = size.height - 25
  const id = useId().replace(/:/g, '')
  const all = metricSamples(state, person, m.key)
  const samples = windowSamples(all, state, days)
  // A point for every available observation, using only that observation and its past.
  const points = samples.map((sample) => ({ t: sample.t, v: sample.v, ...statistics(all.filter((r) => r.t > sample.t - 7 && r.t <= sample.t).map((r) => r.v)) }))
  const stats = statistics(samples.map((r) => r.v))
  const latest = samples.at(-1)?.v
  const color = latest === undefined ? '#8e8e93' : COLORS[metricLevel(m, latest)]
  const lo = Math.min(m.domain[0], ...points.map((p) => Math.min(p.v, p.mean! - (p.sd ?? 0))))
  const hi = Math.max(m.domain[1], ...points.map((p) => Math.max(p.v, p.mean! + (p.sd ?? 0))))
  const x = (t: number) => left + (t - (state.day - days + 1)) / days * (right - left)
  const y = (v: number) => bottom - (v - lo) / (hi - lo) * (bottom - top)
  const label = (v: number | undefined, digits = m.decimals) => v === undefined ? '—' : v.toFixed(digits)
  const limits = [m.caution, m.warning, ...(m.low === undefined ? [] : [m.low])]
  return <article className="science-plot">
    <header><Link to={`/body/${person.id}/indicator/${m.key}`}>{m.title}</Link><div className="plot-current" style={{ color }}>{label(latest)} <small>{m.unit}</small></div></header>
    <svg ref={svgRef} viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label={`${m.title}: ${points.length} daily observations with a seven-day rolling mean and plus or minus one sample standard deviation. Latest reading ${label(latest)} ${m.unit}.`}>
      <defs><clipPath id={id}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath></defs>
      {[lo, (lo + hi) / 2, hi].map((v) => <g key={v}><line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke="#48484a" opacity=".25" /><text x={left - 7} y={y(v) + 3} textAnchor="end">{Number(v.toFixed(1))}</text></g>)}
      <rect x={left} y={top} width={right - left} height={bottom - top} fill="none" stroke="#3a3a3c" strokeWidth=".6" />
      {limits.map((v) => { const c = v === m.caution ? COLORS.caution : COLORS.warning; return <g key={v}><line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke={c} opacity=".6" strokeWidth=".8" /><text x={right + 6} y={y(v) + 3} fill={c}>{Number(v.toFixed(2))}</text></g> })}
      <g clipPath={`url(#${id})`}>
        {points.map((p, i) => {
          if (p.mean === undefined) return null
          const c = COLORS[metricLevel(m, p.v)]
          const previous = points[i - 1]
          return <g key={p.t}><title>{`Day ${Math.floor(p.t)}: reading ${label(p.v)}, 7-day mean ${label(p.mean)}, SD ${label(p.sd, 3)}, variance ${label(p.variance, 3)}; n=${p.n}`}</title>
            {previous?.mean !== undefined && p.t - previous.t <= 1.5 && <line x1={x(previous.t)} y1={y(previous.v)} x2={x(p.t)} y2={y(p.v)} stroke={c} strokeWidth="1.4" />}
            {p.sd !== undefined && <path d={`M${x(p.t)} ${y(p.mean - p.sd)}V${y(p.mean + p.sd)} M${x(p.t) - 1.7} ${y(p.mean - p.sd)}h3.4 M${x(p.t) - 1.7} ${y(p.mean + p.sd)}h3.4`} fill="none" stroke={c} opacity=".45" strokeWidth=".7" />}
            <circle className="daily-mean-point" cx={x(p.t)} cy={y(p.v)} r="1.8" fill={c} />
          </g>
        })}
      </g>
      {[state.day - days + 1, state.day - Math.floor(days / 2), state.day].map((d) => <g key={d}><line x1={x(d)} x2={x(d)} y1={bottom} y2={bottom + 4} stroke="#48484a" /><text x={x(d)} y={bottom + 18} textAnchor="middle">D{d}</text></g>)}
    </svg>
    <details className="plot-method"><summary>Details</summary><p>Simulated data. Points and connecting lines: individual daily readings. Bars: seven-day rolling mean ±1 sample SD, not sensor error or confidence intervals. Windows overlap and points are correlated. No future observations are included. The latest reading is shown above. Drift is illustrative, not a validated physiological model. Radiation totals retain three decimal places to avoid rounding artifacts in dose rates.</p><p>{m.note}</p><p>Window: n={stats.n} · SD {label(stats.sd, 2)} {m.unit} · Variance {label(stats.variance, 3)} ({m.unit})². A single sample has no SD.</p><a href={m.source} target="_blank" rel="noreferrer">{m.sourceLabel} ↗</a><table><thead><tr><th>Day</th><th>Reading</th><th>7d mean</th><th>SD</th><th>s²</th><th>n</th></tr></thead><tbody>{points.map((p) => <tr key={p.t}><td>{Math.floor(p.t)}</td><td>{label(p.v)}</td><td>{label(p.mean)}</td><td>{label(p.sd, 2)}</td><td>{label(p.variance, 3)}</td><td>{p.n}</td></tr>)}</tbody></table></details>
  </article>
}
