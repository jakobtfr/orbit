import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Astronaut } from '../components/Astronaut'
import { BackLink } from '../components/Shell'
import { StatusShape } from '../components/Status'
import { useCall } from '../lib/call'
import { activeProcedures, allProcedures, measureProcedures, sceneFor, type Procedure } from '../lib/procedures'
import { useStore } from '../lib/store'
import { ScreenTitle } from './common'
import '../guides.css'

function ProcedureCard({ p }: { p: Procedure }) {
  return (
    <Link className="resource-card" to={`/resources/${p.id}`}>
      <Astronaut scene={sceneFor(p.steps[0])} size={72} still />
      <span>
        <strong>{p.title}</strong>
        <small>{p.status && <StatusShape status={p.status} size={10} />}{p.steps.length} steps</small>
      </span>
    </Link>
  )
}

/** Every procedure on board: what is needed today, and how to take each reading. */
export function Resources() {
  const { state, viewer, actionLog, stepAt, setStepAt } = useStore()
  const today = activeProcedures(state, viewer)
  const done = Object.entries(actionLog).filter(([id, a]) => a.day === state.day && (stepAt[id] ?? 0) >= a.steps)
  const measuring = measureProcedures(state, viewer)
  return (
    <div className="screen">
      <ScreenTitle sub="Every procedure on board, one animated step at a time. It is all stored on this device, so it works without contact with Earth.">
        Resources
      </ScreenTitle>
      {today.length > 0 && (
        <section aria-label="Needed today">
          <h2 className="title-3">Needed today</h2>
          <div className="guide-grid">{today.map((p) => <ProcedureCard key={p.id} p={p} />)}</div>
        </section>
      )}
      {done.length > 0 && (
        <section aria-label="Done today">
          <h2 className="title-3">Done today</h2>
          <ul className="done-list">
            {done.map(([id, a]) => (
              <li key={id}>
                <span className="done-tick" aria-hidden="true">✓</span>
                <span><strong>{a.title}</strong><small>{a.steps === 1 ? '1 step' : `All ${a.steps} steps`} done</small></span>
                <button className="btn btn-quiet" onClick={() => setStepAt(id, 0)}>Do again</button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-label="How to measure">
        <h2 className="title-3">How to measure</h2>
        <div className="guide-grid">{measuring.map((p) => <ProcedureCard key={p.id} p={p} />)}</div>
      </section>
    </div>
  )
}

/** One procedure, with the astronaut acting out the step that is showing. */
export function ProcedurePlayer() {
  const { id } = useParams()
  const { state, viewer } = useStore()
  const { openCall } = useCall()
  const [at, setAt] = useState(0)
  useEffect(() => { setAt(0) }, [id])
  const p = allProcedures(state, viewer).find((x) => x.id === id)
  const count = p?.steps.length ?? 0
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setAt((a) => Math.min(a + 1, count - 1))
      if (e.key === 'ArrowLeft') setAt((a) => Math.max(a - 1, 0))
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [count])
  if (!p) return <Resources />
  const i = Math.min(at, p.steps.length - 1)
  const last = i === p.steps.length - 1
  return (
    <div className="screen">
      <BackLink to="/resources">Resources</BackLink>
      <ScreenTitle sub={p.intro}>{p.kind === 'measure' ? `How to measure: ${p.title.toLowerCase()}` : p.title}</ScreenTitle>
      <div className="guide-player">
        <div className="guide-stage"><Astronaut key={i} scene={sceneFor(p.steps[i])} size={420} /></div>
        <div className="guide-step">
          <div className="guide-bar" role="group" aria-label="Steps">
            {p.steps.map((s, n) => <button key={s} className={n < i ? 'is-done' : n === i ? 'is-now' : ''} aria-label={`Step ${n + 1}`} aria-current={n === i ? 'step' : undefined} onClick={() => setAt(n)} />)}
          </div>
          <span className="label">Step {i + 1} of {p.steps.length}</span>
          <h2 className="title-2" aria-live="polite">{p.steps[i]}</h2>
          <div className="guide-nav">
            {i > 0 && <button className="btn btn-secondary" onClick={() => setAt(i - 1)}>Back</button>}
            {!last && <button className="btn btn-primary" onClick={() => setAt(i + 1)}>Next step</button>}
            {last && p.button && <Link className="btn btn-primary" to={p.button.to}>{p.button.label}</Link>}
            {p.kind === 'now' && <button className="btn btn-secondary" onClick={() => openCall(p.about)}>Call the doctor</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
