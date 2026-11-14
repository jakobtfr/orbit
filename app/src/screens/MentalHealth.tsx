import { useEffect, useState, type FormEvent } from 'react'
import { useStore } from '../lib/store'

const MOODS = ['Very low', 'Low', 'Okay', 'Good', 'Very good']
export function MentalHealth() {
  const { state, mentalEntries, setMentalEntries } = useStore()
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState(3)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setSeconds((s) => Math.min(s + 1, 60)), 1000)
    return () => clearInterval(timer)
  }, [running])
  useEffect(() => { if (seconds >= 60) setRunning(false) }, [seconds])
  const save = (e: FormEvent) => {
    e.preventDefault()
    if (mood === null) return
    setMentalEntries((entries) => [{ id: crypto.randomUUID(), day: state.day, mood, energy, note: note.trim() }, ...entries])
    setNote(''); setSaved(true)
  }
  const phase = Math.floor(seconds / 4) % 2 === 0 ? 'Breathe in' : 'Breathe out'
  return <div className="planet-page mental-page">
    <header className="planet-page-title"><h1>Mental Health</h1><span className="privacy-label">Private · only you</span></header>
    <div className="mental-layout"><section className="planet-panel mental-checkin"><header><h2>How are you feeling?</h2></header><form onSubmit={save}>
      <fieldset><legend>Mood</legend><div className="mood-options">{MOODS.map((label, i) => <button key={label} type="button" aria-pressed={mood === i + 1} onClick={() => { setMood(i + 1); setSaved(false) }}><span>{i + 1}</span>{label}</button>)}</div></fieldset>
      <label className="mental-field">Energy <span>{energy} / 5</span><input type="range" min="1" max="5" step="1" value={energy} onChange={(e) => { setEnergy(Number(e.target.value)); setSaved(false) }} /></label>
      <label className="mental-field">Anything on your mind?<textarea value={note} maxLength={1500} onChange={(e) => { setNote(e.target.value); setSaved(false) }} placeholder="A private note about today…" rows={4} /></label>
      <div className="mental-save"><button className="btn btn-primary" disabled={mood === null} type="submit">Save check-in</button><span role="status">{saved ? 'Check-in saved.' : ''}</span></div><p className="data-method">Stored in this app session. Reloading clears your entries.</p>
    </form></section>
    <section className="planet-panel breathing-panel"><header><h2>A moment to pause</h2></header><div className={`breathing-orb ${running ? 'running' : ''}`} aria-hidden="true"><span /></div><p className="breathing-phase" role="status">{running ? phase : seconds === 60 ? 'Session complete' : 'One minute, at your pace'}</p><p className="data-method">Follow gently, or breathe at your own pace.</p><button className="btn btn-secondary" onClick={() => { if (running) setRunning(false); else { setSeconds(0); setRunning(true) } }}>{running ? 'Stop' : 'Start 60 seconds'}</button><span className="breathing-time">{60 - seconds}s</span></section></div>
    <section className="planet-panel"><header><h2>Your check-ins</h2><span>{mentalEntries.length} entries</span></header>{mentalEntries.length ? <div className="mental-history">{mentalEntries.map((entry) => <article key={entry.id}><div><span>Day {entry.day}</span><strong>{MOODS[entry.mood - 1]}</strong><span>Energy {entry.energy}/5</span></div>{entry.note && <p>{entry.note}</p>}</article>)}</div> : <p className="mental-empty">Your private notes will appear here after your first check-in.</p>}</section>
  </div>
}
