import { Link } from 'react-router-dom'
import { IncomingFamilyCall } from '../components/IncomingFamilyCall'
import { FAMILY, MESSAGES, arrived, familyLock, memberOf, offDuty, recordedLabel, signalDelayMin } from '../lib/family'
import { useFamily } from '../lib/familyStore'
import { now } from '../lib/judge'
import { useStore } from '../lib/store'
import '../family.css'
import '../family-lock.css'

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (to: boolean) => void }) {
  return <button className={`family-switch ${on ? 'is-on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}><i /></button>
}

const letters = (name: string) => name.split(' ').map((w) => w[0]).join('')

/** Family calls: who opted in on both sides, today's messages from Earth, and the private conversation. */
export function Family() {
  const { state, viewer } = useStore()
  const { optIn, setOptIn, log, clearLog, kept, openFamilyCall } = useFamily()
  const inbox = arrived(state, MESSAGES, optIn)
  const delay = Math.round(signalDelayMin(state.day))
  const free = offDuty(now(state))
  const first = viewer.name.split(' ')[0]
  const lock = familyLock(state, viewer)
  return <div className="planet-page family-page">
    <header className="planet-page-title"><div><p className="eyebrow">MESSAGES FROM EARTH</p><h1>Family</h1><p className="family-sub">Every family call is AI. Today a signal takes {delay} min one way, so nobody can talk to you live. Your people record a message each day, and ORBIT plays it as a call in your off-duty time, once today's health check is done.</p><div className="family-signal" aria-hidden="true" data-from="Earth" data-to={`You · ${delay} min one way`}><i /></div></div><span className="privacy-label">Private · on this device</span></header>

    <section className="planet-panel">
      <header><h2>Today's messages</h2><span>{lock.locked ? 'Locked until today\'s check is done' : free ? 'Unlocked by today\'s check · you are off duty now' : 'Unlocked · calls wait until you are off duty'}</span></header>
      {optIn.astronaut && !!inbox.length && (lock.locked
        ? <p className="family-lock" role="status"><span aria-hidden="true">🔒</span> The family call is the reward for today's health check. {lock.todo} <Link className="btn btn-primary" to={lock.to}>Do today's check-in</Link></p>
        : <p className="family-lock is-open" role="status"><span aria-hidden="true">🔓</span> Today's check is done. Your messages are unlocked.</p>)}
      {!optIn.astronaut && kept !== 'loading' && <p className="family-empty">You have opted out. No message is shown or played until you opt in again.</p>}
      {optIn.astronaut && !inbox.length && <p className="family-empty">No message has arrived yet today.</p>}
      <ul className="family-cards">
        {inbox.map((m, n) => { const who = memberOf(m); return <li key={m.id} className={`family-card ${n === 0 ? 'is-new' : ''} ${lock.locked ? 'is-locked' : ''}`}>
          <span className="family-face is-large" aria-hidden="true">{letters(who.name)}</span>
          <strong>{who.name}</strong>
          {lock.locked && <span className="family-card-wait">{who.name.split(' ')[0]} recorded a message for you</span>}
          <span className="family-card-meta">{who.relation} · {recordedLabel(state, m).replace('Message from Earth, ', '')} · {m.parts.length} parts</span>
          <span className="family-parts" aria-hidden="true">{m.parts.map((_, i) => <i key={i} />)}</span>
          {lock.locked
            ? <span className="family-card-locked"><span aria-hidden="true">🔒</span> Locked</span>
            : <button className="btn btn-primary" disabled={!free} onClick={() => openFamilyCall(m.id)}><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.2v9.6L10.5 6z" fill="currentColor" /></svg>Play as a call</button>}
        </li> })}
      </ul>
    </section>

    <section className="planet-panel">
      <header><h2>Who has opted in</h2><span>Either side can stop at any time</span></header>
      <ul className="family-list">
        <li>
          <span className="family-face is-you" aria-hidden="true">{first[0]}</span>
          <div><strong>Your opt-in</strong><span>{first}, you agreed to receive recorded messages as AI calls and you know that no call is live. ORBIT may pass on one health prompt per call, in its own fixed words.</span></div>
          <Switch on={optIn.astronaut} label="Your opt-in to family calls" onChange={(to) => setOptIn({ ...optIn, astronaut: to })} />
        </li>
        {FAMILY.map((f) => <li key={f.id}>
          <span className="family-face" aria-hidden="true">{letters(f.name)}</span>
          <div><strong>{f.name}</strong><span>{f.relation} · {f.consent} Since {f.since}.</span></div>
          <Switch on={!!optIn.people[f.id]} label={`${f.name}'s opt-in`} onChange={(to) => setOptIn({ ...optIn, people: { ...optIn.people, [f.id]: to } })} />
        </li>)}
      </ul>
    </section>

    <section className="planet-panel">
      <header><h2>What is real and what is AI</h2></header>
      <ul className="family-voices">
        <li className="is-recorded"><b>Recorded on Earth.</b> The person's own words, played as they recorded them. ORBIT never rewrites them.</li>
        <li className="is-link"><b>AI voice.</b> AI-generated speech that says a few fixed linking sentences. No language model takes part in a family call, so nothing is invented in your people's name.</li>
        <li className="is-health"><b>ORBIT.</b> Health prompts and answers to a symptom are ORBIT's fixed rules, word for word, in AI-generated speech.</li>
      </ul>
      <details className="family-more"><summary>Readings, urgent words, privacy and this demo</summary>
      <ul className="family-rules">
        <li><b>A reading counts, not "I am fine".</b> A reading you say in a call is saved to your health record and judged again.</li>
        <li><b>Urgent words end the call.</b> Chest pain, trouble breathing and the like go straight to the medical lead.</li>
        <li><b>Private.</b> What you and your people say is stored encrypted on this device, apart from your health record. Readings, symptoms and urgent words go to the health side and are not kept in it.</li>
        <li><b>Demo.</b> The people and their messages here are invented. Their voices are AI-generated stand-ins for real recordings, made with the open model Kokoro-82M, and each audio file says so in its metadata.</li>
      </ul>
      </details>
    </section>

    <section className="planet-panel">
      <header><h2>Your private conversation</h2><span>{kept === 'device' ? 'Kept encrypted on this device, apart from your health record' : kept === 'session' ? 'No private storage in this browser: kept for this session only, apart from your health record' : 'Kept encrypted on this device, apart from your health record'}</span></header>
      {!log.length && <p className="family-empty">Nothing yet. What you and your people say in a call is kept here. It is never added to your readings, and the medical lead cannot see it.</p>}
      <ul className="family-log">
        {log.slice(-12).map((l, n) => <li key={n} className={`is-${l.from}`}><span>{l.from === 'you' ? 'You' : l.from === 'recorded' ? `${FAMILY.find((f) => f.id === l.with)?.name.split(' ')[0] ?? 'Earth'} · recorded` : 'AI voice'}</span>{l.text}</li>)}
      </ul>
      {!!log.length && <button className="btn btn-secondary" onClick={clearLog}>Delete this conversation</button>}
    </section>
    <IncomingFamilyCall />
  </div>
}
