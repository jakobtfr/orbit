import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '../components/Shell'
import { StatusShape, Tag } from '../components/Status'
import { CREW } from '../data/demo'
import { CHEST_PAIN_STEPS, OTHER_SCENARIOS } from '../data/emergency'
import { age } from '../lib/format'
import { INDICATORS, formatValue } from '../lib/indicators'
import { judge, now } from '../lib/judge'
import { useStore } from '../lib/store'
import type { CrewMember, IndicatorKey } from '../lib/types'

const PANEL: IndicatorKey[] = ['hr', 'bp', 'spo2']

function elapsed(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function Emergency() {
  const { state, viewer } = useStore()
  const nav = useNavigate()
  const [start] = useState(() => Date.now())
  const [secs, setSecs] = useState(0)
  const [patient, setPatient] = useState<CrewMember | null>(null)
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState<number[]>([])
  const [flash, setFlash] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const finished = done.length === CHEST_PAIN_STEPS.length

  useEffect(() => {
    if (finished) return
    const id = window.setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => window.clearInterval(id)
  }, [start, finished])

  const home = `/body/${viewer.id}`
  const step = CHEST_PAIN_STEPS[done.length]

  return (
    <div className="emergency">
      <header className="em-header">
        <span className={`em-shape ${flash && !finished ? 'is-flashing' : ''}`}><StatusShape status="warning" size={20} /></span>
        <span className="em-title">Emergency{patient ? ` · ${patient.name}` : ''}{started ? ' · Chest pain or collapse' : ''}</span>
        <span className="em-timer">{elapsed(secs)}</span>
        {flash && !finished && <button className="em-btn" onClick={() => setFlash(false)}>Stop flashing</button>}
      </header>

      <div className="em-body">
        <main className="em-main">
          {!patient && (
            <>
              <h1 className="title-2">Who needs help?</h1>
              <div className="choice-col">
                {CREW.map((p) => (
                  <button key={p.id} className="btn btn-secondary btn-large em-person" onClick={() => setPatient(p)}>
                    <span>{p.name}</span>
                    <span className="label">{p.role}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {patient && !started && (
            <>
              <h1 className="title-2">What is happening?</h1>
              <div className="choice-col">
                <button className="btn btn-primary btn-large" onClick={() => setStarted(true)}>Chest pain or collapse</button>
                {OTHER_SCENARIOS.map((s) => (
                  <button key={s} className="btn btn-secondary btn-large" disabled>
                    <span>{s}</span>
                    <span className="label">Not in this version</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {patient && started && (
            <>
              {done.length > 0 && (
                <ol className="em-done">
                  {done.map((t, i) => (
                    <li key={i}><span>{CHEST_PAIN_STEPS[i].title}</span><span className="data">{elapsed(t)}</span></li>
                  ))}
                </ol>
              )}
              {step ? (
                <section className="em-step">
                  <div className="tags"><Tag>Step {done.length + 1} of {CHEST_PAIN_STEPS.length}</Tag><Tag>DRAFT TEXT · NOT A PROTOCOL</Tag></div>
                  <h1 className="title-2">{step.title}</h1>
                  <p className="body-lg">{step.detail}</p>
                  <button className="btn btn-primary btn-large" onClick={() => setDone([...done, secs])}>Done, next</button>
                </section>
              ) : (
                <section className="em-step">
                  <h1 className="title-2">All steps done</h1>
                  <p className="body-lg">
                    {CHEST_PAIN_STEPS.length} steps in {elapsed(done[done.length - 1])}. Stay with {patient.name} and keep taking readings until the ground replies.
                  </p>
                  <button className="btn btn-primary btn-large" onClick={() => nav(home)}>Close and return to Body</button>
                </section>
              )}
            </>
          )}

          {!finished && <button className="btn btn-quiet em-leave" onClick={() => setLeaving(true)}>Leave emergency</button>}
        </main>

        {patient?.id === viewer.id && (
          <aside className="em-panel" aria-label="Your readings">
            <div className="label">Your readings</div>
            <div className="title-3">{viewer.name}</div>
            {PANEL.map((k) => {
              const j = judge(state, viewer, k)
              const pre = viewer.preflight[k]
              return (
                <div key={k} className="em-reading">
                  <div className="label">{INDICATORS[k].name}</div>
                  <div className="reading">
                    {j.latest ? formatValue(k, j.latest) : '—'}
                    <span className="unit">&nbsp;{INDICATORS[k].unit}</span>
                  </div>
                  <div className="data">
                    {j.latest ? age(now(state), j.latest.t) : 'No reading'}
                    {pre && ` · before flight ${formatValue(k, pre)}`}
                  </div>
                </div>
              )
            })}
          </aside>
        )}
      </div>

      {leaving && (
        <Dialog title="Leave the emergency flow?" onClose={() => setLeaving(false)}>
          <p className="body">The steps taken so far will not be kept.</p>
          <div className="dialog-actions">
            <button className="btn btn-secondary" onClick={() => setLeaving(false)}>Stay</button>
            <button className="btn btn-primary" onClick={() => nav(home)}>Leave</button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
