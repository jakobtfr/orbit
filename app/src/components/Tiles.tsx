import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { age } from '../lib/format'
import { INDICATORS, formatValue } from '../lib/indicators'
import { actionSteps, activeSymptoms, judge, now, symptomStatus } from '../lib/judge'
import { actionId, sceneFor } from '../lib/procedures'
import { useStore } from '../lib/store'
import type { Action, IndicatorKey, Person, Reading, RegionKey } from '../lib/types'
import { Astronaut } from './Astronaut'
import { STATUS, StatusMark, Tag } from './Status'

export function ValueLine({ k, reading, arrow, status, size = 'reading' }: {
  k: IndicatorKey
  reading?: Reading
  arrow?: string
  status: keyof typeof STATUS
  size?: 'reading' | 'reading-xl'
}) {
  const def = INDICATORS[k]
  const muted = status === 'stale' || status === 'unavailable'
  return (
    <div className={`${size} ${muted ? 'is-muted' : ''}`}>
      {reading && status !== 'unavailable' ? formatValue(k, reading) : '—'}
      {reading && status !== 'unavailable' && def.unit && <span className="unit">&nbsp;{def.unit}</span>}
      {arrow && <span className="arrow" style={{ color: STATUS[status].color }}>&nbsp;{arrow}</span>}
    </div>
  )
}

export function StatusTile({ person, k }: { person: Person; k: IndicatorKey }) {
  const { state } = useStore()
  const def = INDICATORS[k]
  const j = judge(state, person, k)
  return (
    <Link className="tile" to={`/body/${person.id}/indicator/${k}`}>
      <div className="label">{def.name}</div>
      <ValueLine k={k} reading={j.latest} arrow={j.arrow} status={j.status} />
      <StatusMark status={j.status} />
      <div className="tags">
        {j.latest && <Tag>{age(now(state), j.latest.t)}</Tag>}
      </div>
    </Link>
  )
}

export function SymptomTile({ person, region }: { person: Person; region: RegionKey }) {
  const { state } = useStore()
  const act = activeSymptoms(state, person.id, region)
  const status = symptomStatus(state, person.id, region)
  return (
    <Link className="tile" to={`/body/${person.id}/symptoms/${region}`}>
      <div className="label">Symptoms</div>
      <div className="reading reading-text">{act.length ? act.map((s) => s.name).join(', ') : 'None reported'}</div>
      <StatusMark status={status} />
      <div className="tags">
        {act[0] && <Tag>{age(now(state), act[0].t)}</Tag>}
      </div>
    </Link>
  )
}

/** A countdown for a step that says to wait or rest for some minutes. */
function StepTimer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    if (left === null || left <= 0) return
    const id = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(id)
  }, [left])
  if (left === null) return <button className="step-timer" onClick={() => setLeft(minutes * 60)}>Start {minutes}-minute timer</button>
  if (left <= 0) return <span className="step-timer is-up" role="status">Time is up</span>
  return <button className="step-timer is-running" aria-label="Stop timer" onClick={() => setLeft(null)}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} · stop</button>
}

/** The next action, walked through one step at a time, with a timer where a step says to wait. */
/**
 * The next action, one step at a time. When the last step is done the card goes away and the
 * action is logged as done; the log is shown under "Done today" in Resources.
 */
export function NextActionCard({ action, title }: { action: Action; title?: string }) {
  const { state, stepAt, setStepAt, logAction } = useStore()
  const steps = actionSteps(action)
  const id = actionId(state.day, action)
  const at = Math.min(stepAt[id] ?? 0, steps.length)
  if (at >= steps.length) return null
  const last = at === steps.length - 1
  const step = steps[at]
  const wait = step.match(/(?:for|after) (\d+) minutes/)
  const finish = () => {
    logAction(id, { title: title ?? action.next, steps: steps.length, day: state.day })
    setStepAt(id, steps.length)
  }
  return (
    <section className="action-card" aria-label="Next action">
      <div className="action-head">
        <span className="label">Next action</span>
        {steps.length > 1 && <span className="label action-progress">Step {at + 1} of {steps.length}</span>}
      </div>
      {steps.length > 1 && (
        <div className="action-bar" aria-hidden="true">
          {steps.map((s, i) => <span key={s} className={i < at ? 'is-done' : i === at ? 'is-now' : ''} />)}
        </div>
      )}
      <p className="body">{action.observed}</p>
      <div className="action-step"><p className="title-3" key={step} aria-live="polite">{step}</p><Astronaut key={step} scene={sceneFor(step)} size={132} /></div>
      {wait && <StepTimer key={step} minutes={Number(wait[1])} />}
      {action.risk && <p className="label">Spaceflight risk this bears on: {action.risk}</p>}
      <div className="action-buttons">
        {last && action.button
          ? <Link className="btn btn-primary" to={action.button.to} onClick={finish}>{action.button.label}</Link>
          : <button className="btn btn-primary" onClick={last ? finish : () => setStepAt(id, at + 1)}>{last ? 'Done' : 'Done, next step'}</button>}
        {at > 0 && <button className="btn btn-quiet" onClick={() => setStepAt(id, at - 1)}>Back</button>}
      </div>
    </section>
  )
}
