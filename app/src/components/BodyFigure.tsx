import { useId, useState } from 'react'
import { MUSCLE_GROUPS, muscleFor, type MuscleKey } from '../lib/anatomy'
import { REGIONS } from '../lib/indicators'
import type { RegionSummary } from '../lib/judge'
import type { RegionKey } from '../lib/types'
import { bodyFront } from './anatomy/bodyFront'
import { bodyBack } from './anatomy/bodyBack'
import { outlines } from './anatomy/outlines'
import { StatusMark } from './Status'

export interface BodyProps {
  onMuscleSelect: (muscle: MuscleKey) => void
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

const muscleGroup = (slug: string): string => {
  const key = muscleFor(slug)
  return key ? MUSCLE_GROUPS[key].name : 'Head'
}
const ANCHORS: Record<RegionKey, { x: number; y: number; end: number }> = {
  head: { x: 362, y: 184, end: 655 },
  chest: { x: 300, y: 382, end: 40 },
  hips: { x: 400, y: 654, end: 655 },
  skin: { x: 192, y: 550, end: 40 },
  whole: { x: 362, y: 1375, end: 655 },
}

export function BodyFigure({ summaries, active, onActive, onSelect, onMuscleSelect }: BodyProps) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [hovered, setHovered] = useState<string | null>(null)
  const uid = useId().replace(/:/g, '')
  const ref = (name: string) => `url(#${uid}-${name})`
  const parts = side === 'front' ? bodyFront : bodyBack
  const visibleMuscles = [...new Set(parts.map((p) => muscleFor(p.slug)).filter((key): key is MuscleKey => key !== undefined))]
  const selectGroup = (slug: string) => {
    const muscle = muscleFor(slug)
    if (muscle) onMuscleSelect(muscle)
    else onSelect('head')
  }
  const selected = summaries.find((s) => s.region === active)
  const marked = summaries.filter((s) => ['warning', 'caution', 'repeat', 'stale'].includes(s.status))

  return (
    <div className="body-stage anatomy-stage">
      <div className="anatomy-viewport">
        <svg className="anatomy-figure" viewBox="0 60 724 1370" aria-label={`${side} body map. Select a region to explore its health indicators.`}>
          <defs>
            <linearGradient id={`${uid}-surface`} x1="0" x2="1">
              <stop offset="0" stopColor="#757b83" /><stop offset=".18" stopColor="#2c3036" />
              <stop offset=".48" stopColor="#171a1e" /><stop offset=".78" stopColor="#393e45" />
              <stop offset="1" stopColor="#858b93" />
            </linearGradient>
            <radialGradient id={`${uid}-muscle`} cx="45%" cy="38%" r="72%">
              <stop stopColor="#626873" stopOpacity=".85" /><stop offset=".45" stopColor="#3d434b" stopOpacity=".95" />
              <stop offset="1" stopColor="#292e36" stopOpacity=".9" />
            </radialGradient>
            <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2=".8" y2="1">
              <stop stopColor="#d8dde3" /><stop offset=".45" stopColor="#8c959f" /><stop offset="1" stopColor="#555d68" />
            </linearGradient>
            <radialGradient id={`${uid}-lit`} cx="40%" cy="25%" r="80%">
              <stop stopColor="#e1e6ed" stopOpacity=".8" /><stop offset=".45" stopColor="#8d98a5" stopOpacity=".6" />
              <stop offset="1" stopColor="#454d59" stopOpacity=".45" />
            </radialGradient>
            <radialGradient id={`${uid}-floor`}>
              <stop stopColor="#a5adb8" stopOpacity=".28" /><stop offset="1" stopColor="#a5adb8" stopOpacity="0" />
            </radialGradient>
            <pattern id={`${uid}-grid`} width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#969da7" strokeOpacity=".055" />
            </pattern>
          </defs>
          <g aria-hidden="true" pointerEvents="none">
            <rect x="50" y="90" width="624" height="1280" fill={ref('grid')} />
            <path d="M362 90V1370" stroke="#b2bac5" strokeOpacity=".13" strokeDasharray="3 12" />
            {Array.from({ length: 25 }, (_, i) => <path key={i} d={`M80 ${120 + i * 50}h${i % 5 === 0 ? 19 : 8} M644 ${120 + i * 50}h${i % 5 === 0 ? -19 : -8}`} stroke="#8e98a5" opacity=".28" />)}
            <ellipse cx="362" cy="1372" rx="190" ry="40" fill={ref('floor')} />
            <ellipse cx="362" cy="1372" rx="158" ry="23" fill="none" stroke="#929aa6" strokeOpacity=".25" />
          </g>
          <g transform={side === 'back' ? 'translate(-724 0)' : undefined}>
            <path d={outlines[side]} fill={ref('surface')} stroke={ref('gold')} strokeWidth="1.6" pointerEvents="none" />
            {[...new Set(parts.map((p) => muscleGroup(p.slug)))].map((group, index) => {
              const muscles = parts.filter((p) => muscleGroup(p.slug) === group)
              const region = regionFor(muscles[0].slug)
              const lit = hovered === group
              const clip = `${uid}-group-${index}`
              return <g key={group} className={`anatomy-region ${lit ? 'is-active' : ''}`}
                role="button" tabIndex={0} aria-label={`Explore ${group}`}
                onPointerEnter={() => { setHovered(group); onActive(region) }}
                onPointerLeave={() => { setHovered(null); onActive(null) }}
                onFocus={() => { setHovered(group); onActive(region) }}
                onBlur={() => { setHovered(null); onActive(null) }}
                onClick={() => selectGroup(muscles[0].slug)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectGroup(muscles[0].slug) } }}>
                <defs><clipPath id={clip}>{muscles.flatMap((p) => p.pathArray.map((d, i) => <path key={`${p.slug}-${i}`} d={d} />))}</clipPath></defs>
                {muscles.flatMap((p) => p.pathArray.map((d, i) => <path key={`${p.slug}-${i}`} d={d}
                  fill={ref(lit ? 'lit' : 'muscle')} stroke={group === 'Head' ? '#edf1f5' : ref('gold')} strokeWidth={group === 'Head' ? 1.5 : lit ? 1.4 : .65} strokeOpacity={group === 'Head' ? .8 : lit ? .6 : .22} />))}
                {group === 'Head' && side === 'front' && <g pointerEvents="none" aria-hidden="true" fill="none" stroke="#c5cdd8" strokeLinecap="round">
                  <path d="M325 159Q338 153 350 160 M374 160Q386 153 399 159" strokeWidth="1.4" opacity=".25" />
                  <path d="M328 166Q338 169 347 166 M377 166Q386 169 396 166" opacity=".22" />
                  <path d="M361 163Q360 178 355 188Q362 192 369 188" strokeWidth="1.2" opacity=".26" />
                  <path d="M349 207Q362 204 375 207 M352 210Q362 215 372 210" opacity=".22" />
                  <path d="M324 182Q328 193 338 195 M400 182Q396 193 386 195" opacity=".13" />
                </g>}
                {lit && <g clipPath={`url(#${clip})`} pointerEvents="none" aria-hidden="true" >
                  <g transform={side === 'back' ? 'translate(724 0)' : undefined}>
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} className="anatomy-blood-flow"
                      d={`M${185 + i * 58} 90 C${100 + i * 75} 420 ${270 + i * 32} 560 ${155 + i * 70} 800 S${240 + i * 40} 1160 ${190 + i * 55} 1400`}
                      fill="none" strokeWidth="2" style={{ animationDelay: `${i * -.3}s` }} />)}
                  </g>
                </g>}
              </g>
            })}
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
          <span>{hovered ?? (selected ? REGIONS[selected.region].name : 'Muscle anatomy')}</span>
          {hovered ? <span className="anatomy-instruction">Select to view muscle details</span> : selected ? <StatusMark status={selected.status} /> : <span className="anatomy-instruction">Select a muscle group</span>}
        </div>
      </div>
      <div className="anatomy-controls">
        <div className="anatomy-toggle" aria-label="Body orientation" role="group">
          <button aria-pressed={side === 'front'} onClick={() => { setSide('front'); setHovered(null); onActive(null) }}>Front</button>
          <button aria-pressed={side === 'back'} onClick={() => { setSide('back'); setHovered(null); onActive(null) }}>Back</button>
        </div>
        <button className="anatomy-whole" onClick={() => onSelect('whole')}>Whole body <span aria-hidden="true">↗</span></button>
      </div>
      <div className="muscle-group-list" aria-label={`${side} muscle groups`}>
        {visibleMuscles.map((key) => <button key={key}
          className={hovered === MUSCLE_GROUPS[key].name ? 'is-active' : ''}
          onPointerEnter={() => setHovered(MUSCLE_GROUPS[key].name)} onPointerLeave={() => setHovered(null)}
          onFocus={() => setHovered(MUSCLE_GROUPS[key].name)} onBlur={() => setHovered(null)}
          onClick={() => onMuscleSelect(key)}><span><strong>{MUSCLE_GROUPS[key].name}</strong><small>{MUSCLE_GROUPS[key].anatomy}</small></span><span aria-hidden="true">↗</span></button>)}
      </div>
    </div>
  )
}
