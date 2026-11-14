import { useState } from 'react'
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
          <g transform={side === 'back' ? 'translate(-724 0)' : undefined}>
            <path d={outlines[side]} fill="#2c2c2e" stroke="#48484a" strokeWidth="1.2" pointerEvents="none" />
            {[...new Set(parts.map((p) => muscleGroup(p.slug)))].map((group) => {
              const muscles = parts.filter((p) => muscleGroup(p.slug) === group)
              const region = regionFor(muscles[0].slug)
              const lit = hovered === group
              return <g key={group} className={`anatomy-region ${lit ? 'is-active' : ''}`}
                role="button" tabIndex={0} aria-label={`Explore ${group}`}
                onPointerEnter={() => { setHovered(group); onActive(region) }}
                onPointerLeave={() => { setHovered(null); onActive(null) }}
                onFocus={() => { setHovered(group); onActive(region) }}
                onBlur={() => { setHovered(null); onActive(null) }}
                onClick={() => selectGroup(muscles[0].slug)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectGroup(muscles[0].slug) } }}>
                {muscles.flatMap((p) => p.pathArray.map((d, i) => <path key={`${p.slug}-${i}`} d={d}
                  fill={lit ? '#8e8e93' : '#3a3a3c'} stroke="#1d1d1f" strokeWidth={lit ? 1.4 : 1} />))}
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
