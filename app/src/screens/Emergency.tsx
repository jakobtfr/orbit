import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '../components/Shell'
import { StatusShape, Tag } from '../components/Status'
import { CREW } from '../data/demo'
import { BREATHING_QUESTION, CHEST_PAIN_STEPS, CPR_STEPS, FIRST_STEPS, OTHER_SCENARIOS, SOURCES, type EmergencyStep } from '../data/emergency'
import { age } from '../lib/format'
import { INDICATORS, formatValue } from '../lib/indicators'
import { judge, now } from '../lib/judge'
import { useStore } from '../lib/store'
import type { CrewMember, IndicatorKey } from '../lib/types'

const PANEL: IndicatorKey[] = ['hr', 'bp', 'spo2']

type Branch = 'cpr' | 'pain'

function elapsed(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function Sources({ ids }: { ids: EmergencyStep['sources'] }) {
  return (
    <p className="body-sm em-sources">
      Source:{' '}
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && ' · '}
          <a href={SOURCES[id].url} target="_blank" rel="noreferrer">{SOURCES[id].label.split(',')[0]}</a>
        </span>
      ))}
    </p>
  )
}

export function Emergency() {
  const { state, viewer } = useStore()
  const nav = useNavigate()
  const [start] = useState(() => Date.now())
  const [secs, setSecs] = useState(0)
  const [patient, setPatient] = useState<CrewMember | null>(null)
  const [started, setStarted] = useState(false)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [done, setDone] = useState<{ title: string; t: number }[]>([])
  /** Index in `done` where the current branch's steps begin. */
  const [branchFrom, setBranchFrom] = useState(0)
  const [flash, setFlash] = useState(true)
  const [leaving, setLeaving] = useState(false)

  const branchSteps = branch === 'cpr' ? CPR_STEPS : branch === 'pain' ? CHEST_PAIN_STEPS : []
  const branchDone = done.length - branchFrom
  const step: EmergencyStep | undefined = done.length < FIRST_STEPS.length ? FIRST_STEPS[done.length] : branch ? branchSteps[branchDone] : undefined
  const asking = started && done.length === FIRST_STEPS.length && !branch
  const finished = branch !== null && branchDone >= branchSteps.length

  useEffect(() => {
    if (finished) return
    const id = window.setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => window.clearInterval(id)
  }, [start, finished])

  const home = `/body/${viewer.id}`
  const mark = (title: string) => setDone((d) => [...d, { title, t: secs }])
  /** Starts a branch after logging why: the breathing answer, or breathing stopping during the chest-pain steps. */
  const enter = (b: Branch, why: string) => {
    mark(why)
    setBranchFrom(done.length + 1)
    setBranch(b)
  }
  const total = branchFrom + branchSteps.length

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
                  {done.map((d, i) => (
                    <li key={i}><span>{d.title}</span><span className="data">{elapsed(d.t)}</span></li>
                  ))}
                </ol>
              )}
              {asking && (
                <section className="em-step">
                  <div className="tags"><Tag>Step {done.length + 1}</Tag></div>
                  <h1 className="title-2">{BREATHING_QUESTION.title}</h1>
                  <p className="body-lg">{BREATHING_QUESTION.detail}</p>
                  <div className="choice-row">
                    <button className="btn btn-primary btn-large" onClick={() => enter('cpr', 'Not breathing normally')}>No, not breathing normally</button>
                    <button className="btn btn-secondary btn-large" onClick={() => enter('pain', 'Breathing normally')}>Yes, breathing normally</button>
                  </div>
                  <Sources ids={BREATHING_QUESTION.sources} />
                </section>
              )}
              {step && (
                <section className="em-step">
                  <div className="tags"><Tag>{branch ? `Step ${done.length + 1} of ${total}` : `Step ${done.length + 1}`}</Tag></div>
                  <h1 className="title-2">{step.title}</h1>
                  <p className="body-lg">{step.detail}</p>
                  <div className="choice-row">
                    <button className="btn btn-primary btn-large" onClick={() => mark(step.title)}>Done, next</button>
                    {branch === 'pain' && <button className="btn btn-secondary btn-large" onClick={() => enter('cpr', 'Breathing stopped')}>Breathing stopped: start CPR</button>}
                  </div>
                  <Sources ids={step.sources} />
                </section>
              )}
              {finished && (
                <section className="em-step">
                  <h1 className="title-2">All steps done</h1>
                  <p className="body-lg">
                    {done.length} steps in {elapsed(done[done.length - 1].t)}. Stay with {patient.name} and keep taking readings until the ground replies.
                  </p>
                  <button className="btn btn-primary btn-large" onClick={() => nav(home)}>Close and return</button>
                </section>
              )}
            </>
          )}

          {!finished && <button className="btn btn-quiet em-leave" onClick={() => setLeaving(true)}>Leave emergency</button>}
          <p className="body-sm em-disclaimer">First-aid steps from published resuscitation guidelines, adapted for weightlessness. Not reviewed by a clinician.</p>
        </main>

        {patient?.id === viewer.id && (
          <aside className="em-panel" aria-label="Patient readings">
            <div className="label">Patient readings</div>
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
