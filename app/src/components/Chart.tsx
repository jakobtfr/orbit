import { classify, type Baselines, type ChartGuide } from '../lib/judge'
import type { IndicatorKey, Reading } from '../lib/types'
import { STATUS } from './Status'

const W = 720
const H = 260
const M = { top: 16, right: 150, bottom: 30, left: 48 }

function ticks(lo: number, hi: number, count: number): number[] {
  const span = hi - lo || 1
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toFixed(6)))
  return out
}

/**
 * Line chart following DESIGN.md: straight segments between real readings, no fills or smoothing,
 * baseline as a band, limits as thin labelled lines, status colour only on points outside a limit.
 */
export function Chart({ k, readings, guide, baselines, from, to, decimals }: {
  k: IndicatorKey
  readings: Reading[]
  guide: ChartGuide
  baselines: Baselines
  from: number
  to: number
  decimals: number
}) {
  const data = readings.filter((r) => r.t >= from && r.t <= to && r.activity === 'rest')
  if (data.length < 2) return <p className="empty-line">Not enough readings in this period to draw a chart.</p>

  const values = data.flatMap((r) => (r.v2 !== undefined ? [r.v, r.v2] : [r.v]))
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  const pad0 = (hi - lo || 1) * 0.6
  // Show a limit or band only when it is close enough to the data to be useful.
  for (const l of guide.limits) {
    if (l.v > lo - pad0 * 2 && l.v < hi + pad0 * 2) {
      lo = Math.min(lo, l.v)
      hi = Math.max(hi, l.v)
    }
  }
  if (guide.band) {
    lo = Math.min(lo, guide.band[0])
    hi = Math.max(hi, guide.band[1])
  }
  const pad = (hi - lo || 1) * 0.12
  lo -= pad
  hi += pad

  const x = (t: number) => M.left + ((t - from) / (to - from)) * (W - M.left - M.right)
  const y = (v: number) => M.top + (1 - (v - lo) / (hi - lo)) * (H - M.top - M.bottom)
  const dense = data.length > 45
  const path = (get: (r: Reading) => number) => data.map((r, i) => `${i ? 'L' : 'M'}${x(r.t).toFixed(1)} ${y(get(r)).toFixed(1)}`).join(' ')
  const xt = ticks(from, to, 6).filter((t) => Number.isInteger(t))
  const yt = ticks(lo, hi, 4)
  const inside = (v: number) => v >= lo && v <= hi

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Readings over time">
      {guide.band && (
        <>
          <rect x={M.left} y={y(guide.band[1])} width={W - M.left - M.right} height={y(guide.band[0]) - y(guide.band[1])} fill="var(--bg-hover)" />
          <text className="chart-label" x={W - M.right + 8} y={y((guide.band[0] + guide.band[1]) / 2) + 4}>{guide.bandLabel}</text>
        </>
      )}
      {yt.map((v) => (
        <g key={v}>
          <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} stroke="var(--border-subtle)" />
          <text className="chart-label" x={M.left - 8} y={y(v) + 4} textAnchor="end">{v.toFixed(decimals)}</text>
        </g>
      ))}
      {xt.map((t) => (
        <text key={t} className="chart-label" x={x(t)} y={H - 8} textAnchor="middle">{t}</text>
      ))}
      <text className="chart-label" x={W - M.right + 24} y={H - 8}>Mission day</text>
      {from < 0 && to > 0 && (
        <>
          <line x1={x(0)} x2={x(0)} y1={M.top} y2={H - M.bottom} stroke="var(--border-control)" strokeDasharray="2 4" />
          <text className="chart-label" x={x(0) + 6} y={M.top + 10}>Launch</text>
        </>
      )}
      {guide.limits.filter((l) => inside(l.v)).map((l) => (
        <g key={l.label}>
          <line x1={M.left} x2={W - M.right} y1={y(l.v)} y2={y(l.v)} stroke="var(--border-control)" />
          <text className="chart-label" x={W - M.right + 8} y={y(l.v) + 4}>{l.label}</text>
        </g>
      ))}
      <path d={path((r) => r.v)} fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinejoin="round" />
      {data[0].v2 !== undefined && (
        <path d={path((r) => r.v2 ?? r.v)} fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinejoin="round" />
      )}
      {data.map((r, i) => {
        const key = `${r.t}-${i}`
        const lvl = classify(k, r, baselines).level
        const cx = x(r.t)
        const cy = y(r.v)
        if (lvl === 'ok') return dense ? null : <circle key={key} cx={cx} cy={cy} r="2.5" fill="var(--text-primary)" />
        const c = STATUS[lvl].color
        return lvl === 'caution' ? (
          <path key={key} d={`M${cx} ${cy - 6} ${cx + 6} ${cy + 5}H${cx - 6}Z`} fill={c} stroke="var(--bg-canvas)" />
        ) : (
          <path key={key} d={`M${cx} ${cy - 6} ${cx + 6} ${cy} ${cx} ${cy + 6} ${cx - 6} ${cy}Z`} fill={c} stroke="var(--bg-canvas)" />
        )
      })}
    </svg>
  )
}
