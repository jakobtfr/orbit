import { useId, useState } from 'react'
import { REGIONS } from '../lib/indicators'
import type { RegionSummary } from '../lib/judge'
import type { RegionKey } from '../lib/types'
import { bodyFront } from './anatomy/bodyFront'
import { bodyBack } from './anatomy/bodyBack'
import { outlines } from './anatomy/outlines'
import { StatusMark } from './Status'

export interface BodyProps {
  summaries: RegionSummary[]
  active: RegionKey | null
  onActive: (r: RegionKey | null) => void
  onSelect: (r: RegionKey) => void
}

/** Translate the muscle map into ORBIT's existing health regions. */
function regionFor(slug: string): RegionKey {
  if (slug.startsWith('head')) return 'head'
  if (/^(chest|neck|trapezius|upper-back)/.test(slug)) return 'chest'
  if (/^(abs|obliques|lower-back|hips|gluteal|adductors|quadriceps|hamstring)/.test(slug)) return 'hips'
  return 'skin'
}

const REGIONS_ORDER: RegionKey[] = ['head', 'chest', 'hips', 'skin']
const ANCHORS: Record<RegionKey, { x: number; y: number; end: number }> = {
  head: { x: 362, y: 184, end: 655 },
  chest: { x: 300, y: 382, end: 40 },
  hips: { x: 400, y: 654, end: 655 },
  skin: { x: 192, y: 550, end: 40 },
  whole: { x: 362, y: 1375, end: 655 },
}

export function BodyFigure({ summaries, active, onActive, onSelect }: BodyProps) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const uid = useId().replace(/:/g, '')
  const ref = (name: string) => `url(#${uid}-${name})`
  const parts = side === 'front' ? bodyFront : bodyBack
  const selected = summaries.find((s) => s.region === active)
  const marked = summaries.filter((s) => ['warning', 'caution', 'repeat', 'stale'].includes(s.status))

  return (
    <div className="body-stage anatomy-stage">
      <div className="anatomy-heading">
        <span><span className="anatomy-dot" /> BODY MAP</span>
        <span>{side === 'front' ? 'ANTERIOR' : 'POSTERIOR'} / {side === 'front' ? '01' : '02'}</span>
      </div>
      <div className="anatomy-viewport">
        <svg className="anatomy-figure" viewBox="0 60 724 1370" aria-label={`${side} body map. Select a region to explore its health indicators.`}>
          <defs>
            <linearGradient id={`${uid}-surface`} x1="0" x2="1">
              <stop offset="0" stopColor="#8b7747" /><stop offset=".18" stopColor="#292a26" />
              <stop offset=".48" stopColor="#101417" /><stop offset=".78" stopColor="#34352c" />
              <stop offset="1" stopColor="#a48a50" />
            </linearGradient>
            <radialGradient id={`${uid}-muscle`} cx="38%" cy="24%" r="85%">
              <stop stopColor="#655f43" stopOpacity=".85" /><stop offset=".45" stopColor="#383a30" stopOpacity=".72" />
              <stop offset="1" stopColor="#101518" stopOpacity=".9" />
            </radialGradient>
            <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2=".8" y2="1">
              <stop stopColor="#fff1b1" /><stop offset=".45" stopColor="#c9a956" /><stop offset="1" stopColor="#786032" />
            </linearGradient>
            <radialGradient id={`${uid}-lit`} cx="40%" cy="25%" r="80%">
              <stop stopColor="#fff0b0" stopOpacity=".8" /><stop offset=".45" stopColor="#b2944e" stopOpacity=".6" />
              <stop offset="1" stopColor="#49412a" stopOpacity=".45" />
            </radialGradient>
            <radialGradient id={`${uid}-floor`}>
              <stop stopColor="#d9bd71" stopOpacity=".28" /><stop offset="1" stopColor="#d9bd71" stopOpacity="0" />
            </radialGradient>
            <pattern id={`${uid}-grid`} width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#cbb26e" strokeOpacity=".055" />
            </pattern>
          </defs>
          <g aria-hidden="true" pointerEvents="none">
            <rect x="50" y="90" width="624" height="1280" fill={ref('grid')} />
            <path d="M362 90V1370" stroke="#e2c77f" strokeOpacity=".13" strokeDasharray="3 12" />
            {Array.from({ length: 25 }, (_, i) => <path key={i} d={`M80 ${120 + i * 50}h${i % 5 === 0 ? 19 : 8} M644 ${120 + i * 50}h${i % 5 === 0 ? -19 : -8}`} stroke="#b8a16a" opacity=".28" />)}
            <ellipse cx="362" cy="1372" rx="190" ry="40" fill={ref('floor')} />
            <ellipse cx="362" cy="1372" rx="158" ry="23" fill="none" stroke="#bfa363" strokeOpacity=".25" />
          </g>
          <g transform={side === 'back' ? 'translate(-724 0)' : undefined}>
            <path d={outlines[side]} fill={ref('surface')} stroke={ref('gold')} strokeWidth="1.6" pointerEvents="none" />
            {REGIONS_ORDER.map((region) => (
              <g key={region} className={`anatomy-region ${active === region ? 'is-active' : ''}`}
                role="button" tabIndex={0} aria-label={`Explore ${REGIONS[region].name}`}
                onPointerEnter={() => onActive(region)} onPointerLeave={() => onActive(null)}
                onFocus={() => onActive(region)} onBlur={() => onActive(null)}
                onClick={() => onSelect(region)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(region) } }}>
                {parts.filter((p) => regionFor(p.slug) === region).map((p) => (
                  <g key={p.slug}>
                    {p.pathArray.map((d, i) => <path key={i} d={d}
                      fill={ref(active === region ? 'lit' : 'muscle')}
                      stroke={ref('gold')} strokeWidth={active === region ? 2.5 : 1.1}
                      strokeOpacity={active === region ? 1 : .55} />)}
                  </g>
                ))}
              </g>
            ))}
          </g>
          {/* Decorative anatomical guides; not medical measurements. */}
          <g className="anatomy-guides" fill="none" stroke={ref('gold')} pointerEvents="none" aria-hidden="true">
            <path d="M362 253V698 M355 260 333 293 272 315 M369 260 391 293 452 315" strokeWidth="2" opacity=".7" />
            {side === 'front' && Array.from({ length: 7 }, (_, i) => (
              <path key={i} d={`M358 ${385 + i * 17} Q${278 - i * 2} ${400 + i * 20} ${277 + i * 5} ${373 + i * 14} M366 ${385 + i * 17} Q${446 + i * 2} ${400 + i * 20} ${447 - i * 5} ${373 + i * 14}`} opacity=".32" strokeWidth="1.5" />
            ))}
            <path d="M360 690Q295 655 280 703Q294 738 340 754 M364 690Q429 655 444 703Q430 738 384 754" opacity=".45" />
          </g>
          <g aria-hidden="true" pointerEvents="none">
            {marked.filter((s) => s.region !== 'whole').map((s) => {
              const a = ANCHORS[s.region]
              return <g key={s.region} className={`anatomy-point anatomy-point-${s.status}`}>
                <path d={`M${a.x} ${a.y}H${a.end}`} stroke="currentColor" strokeWidth="1" opacity=".5" />
                <circle cx={a.x} cy={a.y} r="15" fill="none" stroke="currentColor" opacity=".4" />
                <circle cx={a.x} cy={a.y} r="5" fill="currentColor" />
              </g>
            })}
          </g>
        </svg>
        <div className="anatomy-caption" aria-live="polite">
          <span>{selected ? REGIONS[selected.region].name : 'Explore your body'}</span>
          {selected ? <StatusMark status={selected.status} /> : <span className="anatomy-instruction">Select a region to see more</span>}
        </div>
      </div>
      <div className="anatomy-controls">
        <div className="anatomy-toggle" aria-label="Body orientation" role="group">
          <button aria-pressed={side === 'front'} onClick={() => { setSide('front'); onActive(null) }}>Front</button>
          <button aria-pressed={side === 'back'} onClick={() => { setSide('back'); onActive(null) }}>Back</button>
        </div>
        <button className="anatomy-whole" onClick={() => onSelect('whole')}>Whole body <span aria-hidden="true">↗</span></button>
      </div>
    </div>
  )
}
