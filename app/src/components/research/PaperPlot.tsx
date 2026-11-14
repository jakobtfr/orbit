import { useId, useRef } from 'react'
import { downloadResearch, RESEARCH_LABELS, researchSummary } from '../../lib/research'
import { VITAL_INFO, type Subject, type Vital } from '../../lib/replay'

function ticks(lo: number, hi: number, count = 5) {
  const raw = (hi - lo) / count
  const scale = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((n) => n * scale).find((n) => n >= raw) ?? raw
  const values: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-8; v += step) values.push(Number(v.toFixed(6)))
  return { values, step }
}
export function PaperPlot({ subject, vital, start, end, index }: { subject: Subject; vital: Vital; start: number; end: number; index: number }) {
  const svg = useRef<SVGSVGElement>(null)
  const clip = useId().replace(/:/g, '')
  const { series, stats, baseline, limit } = researchSummary(subject, vital, start, end)
  const info = VITAL_INFO[vital]
  const format = (n: number | undefined) => n === undefined ? '—' : n.toFixed(vital === 'temp' ? 2 : 1)
  const left = 72, right = 778, top = 24, bottom = 220
  const range = series.flatMap((p) => [p.value, p.rolling.mean! - (p.rolling.sd ?? 0), p.rolling.mean! + (p.rolling.sd ?? 0)])
  if (baseline !== null) range.push(baseline)
  if (limit !== null) range.push(limit)
  const min = range.length ? Math.min(...range) : 0, max = range.length ? Math.max(...range) : 1
  const pad = Math.max((max - min) * .09, vital === 'temp' ? .08 : 1)
  const lo = min - pad, hi = max + pad
  const x = (day: number) => left + (day - start) / Math.max(1, end - start) * (right - left)
  const y = (value: number) => bottom - (value - lo) / (hi - lo) * (bottom - top)
  const xt = ticks(start, end, 7).values.filter(Number.isInteger)
  const yt = ticks(lo, hi)
  const segments: typeof series[] = []
  for (const point of series) {
    const segment = segments.at(-1)
    if (!segment || point.day - segment.at(-1)!.day > 1) segments.push([point])
    else segment.push(point)
  }
  return <article className="paper-card">
    <header><div><span className="figure-index">({String.fromCharCode(97 + index)})</span><h2>{RESEARCH_LABELS[vital]}</h2></div><button onClick={() => { if (svg.current) downloadResearch(new XMLSerializer().serializeToString(svg.current), 'image/svg+xml', `${subject.id}-${vital}-D${start}-${end}.svg`) }} disabled={!series.length}>Save SVG ↓</button></header>
    {series.length ? <svg ref={svg} xmlns="http://www.w3.org/2000/svg" className="paper-plot" viewBox="0 0 810 310" role="img" aria-label={`${RESEARCH_LABELS[vital]} for ${subject.id}: ${stats.n} measured observations, days ${start} to ${end}.`} style={{ background: '#fafaf8', color: '#1a1a1a', fontFamily: 'Times New Roman, serif', fontSize: 12 }}>
      <title>{`${subject.id} · ${RESEARCH_LABELS[vital]} · NASA UTMB bed-rest records`}</title>
      <desc>Black squares: observed daily values. Blue: trailing seven-day mean. Shading: plus or minus one sample SD, not instrument uncertainty. Green: pre-bed-rest mean. Orange: prototype personal review threshold.</desc>
      <defs><clipPath id={clip}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath></defs>
      <rect width="810" height="310" fill="#fafaf8" />
      {yt.values.map((v) => <g key={v}><line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke="#dfe2e4" strokeWidth=".55" /><text x={left - 11} y={y(v) + 4} textAnchor="end" fill="#1a1a1a">{Number(v.toFixed(2))}</text><path d={`M${left} ${y(v)}h6M${right} ${y(v)}h-6`} stroke="#202020" /></g>)}
      {yt.values.slice(0, -1).flatMap((v) => [1, 2, 3, 4].map((i) => v + yt.step * i / 5)).filter((v) => v > lo && v < hi).map((v) => <path key={v} d={`M${left} ${y(v)}h3M${right} ${y(v)}h-3`} stroke="#404040" strokeWidth=".6" />)}
      {xt.map((d) => <g key={d}><path d={`M${x(d)} ${top}v5 M${x(d)} ${bottom}v-5`} stroke="#202020" /><text x={x(d)} y={bottom + 18} textAnchor="middle" fill="#1a1a1a">{d}</text></g>)}
      {Array.from({ length: end - start + 1 }, (_, i) => start + i).filter((d) => !xt.includes(d)).map((d) => <path key={d} d={`M${x(d)} ${top}v2.5 M${x(d)} ${bottom}v-2.5`} stroke="#404040" strokeWidth=".6" />)}
      <g clipPath={`url(#${clip})`}>
        {segments.map((segment, i) => {
          const band = segment.filter((p) => p.rolling.sd !== undefined)
          const polygon = [...band.map((p) => `${x(p.day)},${y(p.rolling.mean! + p.rolling.sd!)}`), ...[...band].reverse().map((p) => `${x(p.day)},${y(p.rolling.mean! - p.rolling.sd!)}`)].join(' ')
          return <g key={i}>{band.length > 1 && <polygon points={polygon} fill="#315f8a" opacity=".13" />}<polyline points={segment.map((p) => `${x(p.day)},${y(p.value)}`).join(' ')} fill="none" stroke="#34383b" strokeWidth=".7" opacity=".65" /><polyline points={segment.map((p) => `${x(p.day)},${y(p.rolling.mean!)}`).join(' ')} fill="none" stroke="#315f8a" strokeWidth="1.5" /></g>
        })}
        {baseline !== null && <line x1={left} x2={right} y1={y(baseline)} y2={y(baseline)} stroke="#64816e" strokeWidth="1" />}
        {limit !== null && <line x1={left} x2={right} y1={y(limit)} y2={y(limit)} stroke="#b77b46" strokeWidth="1" />}
        {series.map((p) => <rect key={p.day} className="study-observation" x={x(p.day) - 1.7} y={y(p.value) - 1.7} width="3.4" height="3.4" fill="#24282c"><title>{`Day ${p.day}: ${p.value} ${info.unit}; 7d mean ${format(p.rolling.mean)}, SD ${format(p.rolling.sd)}, n=${p.rolling.n}`}</title></rect>)}
      </g>
      <rect x={left} y={top} width={right - left} height={bottom - top} fill="none" stroke="#16191c" strokeWidth=".9" />
      <text x="19" y={(top + bottom) / 2} transform={`rotate(-90 19 ${(top + bottom) / 2})`} textAnchor="middle" fill="#1a1a1a" fontSize="14">{RESEARCH_LABELS[vital]} ({info.unit})</text>
      <text x={(left + right) / 2} y="262" textAnchor="middle" fill="#1a1a1a" fontSize="14">Bed-rest day</text>
      <text x={right - 10} y={top + 17} textAnchor="end" fill="#555" fontSize="11">{subject.id} · n = {stats.n}</text>
      <g transform="translate(72 290)" fontSize="10" fill="#414952">
        <rect x="0" y="-4" width="4" height="4" fill="#24282c" /><text x="10" y="0">Observed</text>
        <rect x="105" y="-7" width="22" height="10" fill="#315f8a" opacity=".13" /><path d="M105 -2H127" stroke="#315f8a" strokeWidth="1.5" /><text x="133" y="0">7d mean ±1 SD</text>
        <path d="M280 -2H302" stroke="#64816e" /><text x="309" y="0">Baseline</text>
        <path d="M410 -2H432" stroke="#b77b46" /><text x="439" y="0">Personal review threshold</text>
      </g>
    </svg> : <div className="paper-empty">No {RESEARCH_LABELS[vital].toLowerCase()} observations in this interval.</div>}
    <footer><span>Mean <strong>{format(stats.mean)}</strong> {info.unit}</span><span>SD <strong>{format(stats.sd)}</strong></span><span>s² <strong>{stats.variance === undefined ? '—' : stats.variance.toFixed(2)}</strong> ({info.unit})²</span><span>n = {stats.n}</span></footer>
  </article>
}
