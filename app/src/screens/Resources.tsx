import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Scene } from '../components/guides/Scene'
import { BackLink } from '../components/Shell'
import { Tag } from '../components/Status'
import { GUIDES, guideById, hasGravity, stepsFor, type Guide, type GuideStep } from '../lib/guides'
import { useStore } from '../lib/store'
import { ScreenTitle } from './common'
import '../guides.css'

function GuideTags({ guide, steps }: { guide: Guide; steps: number }) {
  const { state } = useStore()
  return <div className="tags">
    {guide.emergency && <span className="tag is-emergency">Emergency</span>}
    <Tag>{steps} steps</Tag>
    {guide.needs === 'gravity' && !hasGravity(state.place) && <Tag>For after a landing</Tag>}
  </div>
}

export function Resources() {
  const { state } = useStore()
  return (
    <div className="screen">
      <ScreenTitle sub="Short animated refreshers for situations you trained for long ago. They run on this device, need no contact with Earth, and follow where you are now: weightless or in gravity.">
        Resources
      </ScreenTitle>
      <div className="guide-grid">
        {GUIDES.map((guide) => (
          <Link key={guide.id} className="guide-card" to={`/resources/${guide.id}`}>
            <Scene scene={guide.cover} />
            <strong>{guide.title}</strong>
            <p>{guide.when}</p>
            <GuideTags guide={guide} steps={stepsFor(guide, state.place).length} />
          </Link>
        ))}
      </div>
      <p className="label">A refresher, not a replacement for training. The steps follow the published guidelines listed in each guide and have not been reviewed by a clinician.</p>
    </div>
  )
}

/** Counts a beat aloud on screen, in sets, and hands each count to the scene so the two stay together. */
function Pace({ pace, onBeat }: { pace: NonNullable<GuideStep['pace']>; onBeat: (n: number) => void }) {
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    if (n === null) return
    const id = setTimeout(() => { const next = (n % pace.count) + 1; setN(next); onBeat(next) }, 60000 / pace.perMinute)
    return () => clearTimeout(id)
  }, [n, pace, onBeat])
  return <div className="guide-pace">
    <button className="btn btn-secondary" onClick={() => { setN(n === null ? 1 : null); onBeat(1) }}>{n === null ? `Start the beat: ${pace.perMinute} a minute` : 'Stop the beat'}</button>
    {n !== null && <span className="guide-count" role="status" aria-live="off">{n}</span>}
    {n !== null && <span className="label">of {pace.count}</span>}
  </div>
}

function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    if (left === null || left <= 0) return
    const id = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(id)
  }, [left])
  const name = seconds >= 120 ? `${seconds / 60} minutes` : `${seconds} seconds`
  return <div className="guide-pace">
    <button className="btn btn-secondary" onClick={() => setLeft(left === null ? seconds : null)}>{left === null ? `Count ${name}` : 'Stop'}</button>
    {left !== null && <span className="guide-count" role="status" aria-live="off">{left > 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : 'Time'}</span>}
  </div>
}

export function GuidePlayer() {
  const { id } = useParams()
  const { state } = useStore()
  const nav = useNavigate()
  const guide = guideById(id)
  const [at, setAt] = useState(0)
  const [beat, setBeat] = useState(0)
  useEffect(() => { setAt(0) }, [id])
  const steps = guide ? stepsFor(guide, state.place) : []
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setAt((a) => Math.min(a + 1, steps.length - 1))
      if (e.key === 'ArrowLeft') setAt((a) => Math.max(a - 1, 0))
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [steps.length])
  if (!guide) return <Resources />
  const step = steps[Math.min(at, steps.length - 1)]
  const last = at >= steps.length - 1
  return (
    <div className="screen">
      <BackLink to="/resources">Resources</BackLink>
      <ScreenTitle sub={guide.when}>{guide.title}</ScreenTitle>
      <div className="tags">
        {guide.emergency && <span className="tag is-emergency">Emergency</span>}
        {!guide.needs && <Tag>{hasGravity(state.place) ? 'Steps for gravity' : 'Steps for weightlessness'}</Tag>}
        {guide.needs === 'gravity' && !hasGravity(state.place) && <Tag>For after a landing</Tag>}
      </div>
      <div className="guide-player">
        <div className="guide-stage"><Scene key={`${at}-${step.scene}`} scene={step.scene} beat={beat} label={step.title} /></div>
        <div className="guide-step">
          <div className="guide-bar" role="group" aria-label="Steps">
            {steps.map((s, i) => <button key={s.title} className={i < at ? 'is-done' : i === at ? 'is-now' : ''} aria-label={`Step ${i + 1}: ${s.title}`} aria-current={i === at ? 'step' : undefined} onClick={() => setAt(i)} />)}
          </div>
          <span className="label">Step {at + 1} of {steps.length}</span>
          <h2 className="title-2" aria-live="polite">{step.title}</h2>
          <p className="body">{step.text}</p>
          {step.pace && <Pace key={at} pace={step.pace} onBeat={setBeat} />}
          {step.seconds && <Countdown key={at} seconds={step.seconds} />}
          {step.link && <Link className="btn btn-secondary" to={`/resources/${step.link.guide}`}>{step.link.label}</Link>}
          <div className="guide-nav">
            {at > 0 && <button className="btn btn-secondary" onClick={() => setAt(at - 1)}>Back</button>}
            {last
              ? <button className="btn btn-primary" onClick={() => nav('/resources')}>Finish</button>
              : <button className="btn btn-primary" onClick={() => setAt(at + 1)}>Next step</button>}
          </div>
        </div>
      </div>
      <section>
        <h2 className="title-3">Sources</h2>
        <ul className="guide-sources">
          {guide.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}
        </ul>
        <p className="label">A refresher, not a replacement for training. Not reviewed by a clinician.</p>
      </section>
    </div>
  )
}
