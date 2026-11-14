import { useEffect, useState, type FormEvent } from 'react'
import { FamilyVideos } from '../components/diary/FamilyVideos'
import { CONNECTION_QUESTIONS, writeDiary, type ConnectionAnswers } from '../lib/diary'
import { useStore, type MentalEntry } from '../lib/store'
import '../diary.css'

const MOODS = ['Very low', 'Low', 'Okay', 'Good', 'Very good']
export function MentalHealth() {
  const { state, mentalEntries, setMentalEntries, mentalStorageStatus } = useStore()
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState(3)
  const [note, setNote] = useState('')
  const [answers, setAnswers] = useState<ConnectionAnswers>({})
  const [saved, setSaved] = useState('')
  const [saving, setSaving] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setSeconds((s) => Math.min(s + 1, 60)), 1000)
    return () => clearInterval(timer)
  }, [running])
  useEffect(() => { if (seconds >= 60) setRunning(false) }, [seconds])
  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (mood === null || saving || mentalStorageStatus === 'loading') return
    setSaving(true)
    const entry: MentalEntry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), day: state.day, mood, energy, note: note.trim(), answers: Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, value?.trim()])) }
    let persisted = true
    try { await writeDiary('entries', entry) } catch { persisted = false }
    setMentalEntries((entries) => [entry, ...entries])
    setNote(''); setAnswers({}); setSaving(false)
    setSaved(persisted ? 'Diary entry saved on this device.' : 'Saved for this session only. Local storage is unavailable.')
  }
  const phase = Math.floor(seconds / 4) % 2 === 0 ? 'Breathe in' : 'Breathe out'
  return <div className="planet-page diary-page">
    <header className="planet-page-title"><div><p className="eyebrow">YOUR PRIVATE SPACE</p><h1>My Personal Diary</h1><p className="diary-subtitle">Private notes and messages from home.</p></div><span className="privacy-label">Private · on this device</span></header>
    <FamilyVideos />
    <div className="personal-diary-layout">
      <section className="planet-panel mental-checkin diary-form-panel"><header><div><p className="eyebrow">DAY {state.day}</p><h2>How are you, really?</h2></div><span className="diary-local-label">A moment for yourself</span></header><form onSubmit={save}>
        <fieldset><legend>How is your mood today?</legend><div className="mood-options">{MOODS.map((label, i) => <button key={label} type="button" disabled={saving} aria-pressed={mood === i + 1} onClick={() => { setMood(i + 1); setSaved('') }}><span>{i + 1}</span>{label}</button>)}</div></fieldset>
        <label className="mental-field">Energy <span>{energy} / 5</span><input disabled={saving} type="range" min="1" max="5" step="1" value={energy} onChange={(e) => { setEnergy(Number(e.target.value)); setSaved('') }} /></label>
        <div className="diary-reflection-heading"><h3>Being away from home</h3><span>Optional reflections</span></div>
        {CONNECTION_QUESTIONS.map((question) => <label key={question.key} className="mental-field diary-question">{question.label}<textarea disabled={saving} rows={2} maxLength={1500} value={answers[question.key] ?? ''} placeholder={question.placeholder} onChange={(e) => { setAnswers((previous) => ({ ...previous, [question.key]: e.target.value })); setSaved('') }} /></label>)}
        <label className="mental-field diary-question">Anything else you want to remember?<textarea disabled={saving} value={note} maxLength={1500} onChange={(e) => { setNote(e.target.value); setSaved('') }} placeholder="Something that happened, a thought, a small win…" rows={3} /></label>
        <div className="mental-save"><button className="btn btn-primary" disabled={mood === null || saving || mentalStorageStatus === 'loading'} type="submit">{saving ? 'Saving…' : 'Save diary entry'}</button><span role="status">{saved}</span></div>
        <p className="data-method">Entries stay in this browser on this device. Clearing browser data removes them.</p>
        {mentalStorageStatus === 'unavailable' && <p className="diary-error">Local storage is unavailable. New entries may only last for this session.</p>}
      </form></section>
      <aside className="diary-side"><section className="planet-panel breathing-panel"><header><h2>A moment to pause</h2></header><div className={`breathing-orb ${running ? 'running' : ''}`} aria-hidden="true"><span /></div><p className="breathing-phase" role="status">{running ? phase : seconds === 60 ? 'Session complete' : 'One minute, at your pace'}</p><p className="data-method">Follow gently, or breathe at your own pace.</p><button className="btn btn-secondary" onClick={() => { if (running) setRunning(false); else { setSeconds(0); setRunning(true) } }}>{running ? 'Stop' : 'Start 60 seconds'}</button><span className="breathing-time">{60 - seconds}s</span></section>
      <div className="diary-gentle-note"><p className="eyebrow">NO RIGHT ANSWER</p><p>You can miss home and still have a good day. Write as much or as little as you want.</p></div></aside>
    </div>
    <section className="planet-panel diary-history"><header><h2>Your diary</h2><span>{mentalEntries.length} {mentalEntries.length === 1 ? 'entry' : 'entries'}</span></header>{mentalStorageStatus === 'loading' ? <p className="mental-empty">Opening your diary…</p> : mentalEntries.length ? <div className="mental-history">{mentalEntries.map((entry) => <details key={entry.id} className="diary-entry"><summary><span className="entry-date">{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : `Mission day ${entry.day}`}</span><span className="entry-mood">{MOODS[entry.mood - 1]}</span><span>Energy {entry.energy}/5</span><span className="entry-expand">Read entry</span></summary><div className="diary-entry-content"><span className="eyebrow">MISSION DAY {entry.day}</span>{CONNECTION_QUESTIONS.map((question) => entry.answers?.[question.key] ? <div key={question.key}><h3>{question.label}</h3><p>{entry.answers[question.key]}</p></div> : null)}{entry.note && <div><h3>My notes</h3><p>{entry.note}</p></div>}{!entry.note && !Object.values(entry.answers ?? {}).some(Boolean) && <p>Mood and energy logged. No written reflection.</p>}</div></details>)}</div> : <p className="mental-empty">Your diary entries will appear here.</p>}</section>
  </div>
}
