import { useState } from 'react'
import { MUSCLE_GROUPS, muscleFor, regionForPart, type MuscleKey } from '../lib/anatomy'
import { REGIONS } from '../lib/indicators'
import type { RegionSummary } from '../lib/judge'
import type { RegionKey, StatusKey } from '../lib/types'
import { bodyFront } from './anatomy/bodyFront'
import { bodyBack } from './anatomy/bodyBack'
import { outlines } from './anatomy/outlines'
import { STATUS, StatusMark, StatusShape } from './Status'

export interface BodyProps {
  onMuscleSelect: (muscle: MuscleKey) => void
  /** The status of each muscle group, which decides its colour. */
  muscleStatuses: Record<MuscleKey, StatusKey>
  summaries: RegionSummary[]
  active: RegionKey | null
  onActive: (r: RegionKey | null) => void
  onSelect: (r: RegionKey) => void
}

/** Body colours for each status: the status colour toned down so the figure stays calm. Shapes carry the same meaning in the caption, list and legend. */
const TONE: Record<StatusKey, { rest: string; lit: string }> = {
  ok: { rest: '#2f7d46', lit: '#3fb562' },
  caution: { rest: '#a8901c', lit: '#e0c021' },
  warning: { rest: '#a8504b', lit: '#e86a63' },
  stale: { rest: '#3f7f99', lit: '#5bb9de' },
  repeat: { rest: '#77777c', lit: '#b4b4b9' },
  unavailable: { rest: '#3a3a3c', lit: '#8e8e93' },
}
const LEGEND: StatusKey[] = ['ok', 'caution', 'warning', 'repeat', 'stale']

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

export function BodyFigure({ summaries, active, onActive, onSelect, onMuscleSelect, muscleStatuses }: BodyProps) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [hovered, setHovered] = useState<string | null>(null)
  const [inspected, setInspected] = useState<string | null>(null)
  const inspect = (group: string) => { setHovered(group); setInspected(group) }
  const parts = side === 'front' ? bodyFront : bodyBack
  const visibleMuscles = [...new Set(parts.map((p) => muscleFor(p.slug)).filter((key): key is MuscleKey => key !== undefined))]
  const selectGroup = (slug: string) => {
    const muscle = muscleFor(slug)
    if (muscle) onMuscleSelect(muscle)
    else onSelect('head')
  }
  const selected = summaries.find((s) => s.region === active)
  const headStatus = summaries.find((s) => s.region === 'head')?.status ?? 'ok'
  const statusOfPart = (slug: string): StatusKey => { const key = muscleFor(slug); return key ? muscleStatuses[key] : headStatus }
  const statusOfGroup = (group: string): StatusKey => { const part = parts.find((p) => muscleGroup(p.slug) === group); return part ? statusOfPart(part.slug) : 'ok' }
  const shown = LEGEND.filter((st) => st === 'ok' || parts.some((p) => statusOfPart(p.slug) === st))
  const marked = summaries.filter((s) => ['warning', 'caution', 'repeat', 'stale'].includes(s.status))

  return (
    <div className="body-stage anatomy-stage">
      <div className="anatomy-caption" aria-live="polite" aria-atomic="true">
        <span>{inspected ?? (selected ? REGIONS[selected.region].name : 'Muscle anatomy')}</span>
        {inspected ? <StatusMark status={statusOfGroup(inspected)} /> : selected ? <StatusMark status={selected.status} /> : <span className="anatomy-instruction">Coloured by status. Select a part for details</span>}
      </div>
      <div className="anatomy-viewport">
        <svg className="anatomy-figure" viewBox="0 60 724 1370" aria-label={`${side} body map. Select a region to explore its health indicators.`}>
          <g transform={side === 'back' ? 'translate(-724 0)' : undefined}>
            <path d={outlines[side]} fill="#2c2c2e" stroke="#48484a" strokeWidth="1.2" pointerEvents="none" />
            {[...new Set(parts.map((p) => muscleGroup(p.slug)))].map((group) => {
              const muscles = parts.filter((p) => muscleGroup(p.slug) === group)
              const region = regionForPart(muscles[0].slug)
              const tone = TONE[statusOfPart(muscles[0].slug)]
              const lit = hovered === group
              return <g key={group} className={`anatomy-region ${lit ? 'is-active' : ''}`}
                role="button" tabIndex={0} aria-label={`${group}: ${STATUS[statusOfPart(muscles[0].slug)].label}. Open details`}
                onPointerEnter={() => { inspect(group); onActive(region) }}
                onPointerLeave={() => { setHovered(null); onActive(null) }}
                onFocus={() => { inspect(group); onActive(region) }}
                onBlur={() => { setHovered(null); onActive(null) }}
                onClick={() => selectGroup(muscles[0].slug)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectGroup(muscles[0].slug) } }}>
                {muscles.flatMap((p) => p.pathArray.map((d, i) => <path key={`${p.slug}-${i}`} d={d}
                  fill={lit ? tone.lit : tone.rest} stroke="#1d1d1f" strokeWidth={lit ? 1.4 : 1} />))}
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
      </div>
      <div className="anatomy-legend" aria-label="What the colours mean">
        {shown.map((st) => <StatusMark key={st} status={st} />)}
      </div>
      <div className="anatomy-controls">
        <div className="anatomy-toggle" aria-label="Body orientation" role="group">
          <button aria-pressed={side === 'front'} onClick={() => { setSide('front'); setHovered(null); setInspected(null); onActive(null) }}>Front</button>
          <button aria-pressed={side === 'back'} onClick={() => { setSide('back'); setHovered(null); setInspected(null); onActive(null) }}>Back</button>
        </div>
        <button className="anatomy-whole" onClick={() => onSelect('whole')}>Whole body <span aria-hidden="true">↗</span></button>
      </div>
      <div className="muscle-group-list" aria-label={`${side} muscle groups`}>
        {visibleMuscles.map((key) => <button key={key}
          className={hovered === MUSCLE_GROUPS[key].name ? 'is-active' : ''}
          onPointerEnter={() => inspect(MUSCLE_GROUPS[key].name)} onPointerLeave={() => setHovered(null)}
          onFocus={() => inspect(MUSCLE_GROUPS[key].name)} onBlur={() => setHovered(null)}
          onClick={() => onMuscleSelect(key)}><span><strong>{MUSCLE_GROUPS[key].name}</strong><small>{MUSCLE_GROUPS[key].anatomy}</small></span><span className="muscle-status" title={STATUS[muscleStatuses[key]].label}><StatusShape status={muscleStatuses[key]} size={11} /><span className="sr-only">{STATUS[muscleStatuses[key]].label}</span></span></button>)}
      </div>
    </div>
  )
}
