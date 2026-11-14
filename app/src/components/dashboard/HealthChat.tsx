import { useEffect, useRef, useState, type FormEvent } from 'react'
import { EXERCISE_PLAN_MIN, readingsFor } from '../../lib/judge'
import { statistics, windowSamples } from '../../lib/dashboard'
import type { AppState, Person } from '../../lib/types'

type Message = { role: 'user' | 'assistant'; text: string }

export function HealthChat({ state, person }: { state: AppState; person: Person }) {
  const week = (key: 'sleep' | 'hr' | 'exercise') => statistics(windowSamples(readingsFor(state, person.id, key), state, 7).map((r) => r.v))
  const sleep = week('sleep')
  const pulse = week('hr')
  const exercise = week('exercise')
  const sleepText = sleep.mean === undefined ? 'No sleep readings are available this week.' : `You averaged ${sleep.mean.toFixed(1)} hours of sleep across ${sleep.n} nights, against the demo goal of 8 hours.`
  const pulseText = pulse.mean === undefined ? 'No resting pulse readings are available this week.' : `Your average resting pulse was ${pulse.mean.toFixed(0)} bpm. Your preflight baseline is ${person.preflight.hr?.v ?? 'unknown'} bpm.`
  const [messages, setMessages] = useState<Message[]>([
    { role: 'user', text: 'How was my week?' },
    { role: 'assistant', text: `${sleepText}\n\n${pulseText}\n\nWhich would you like to look at more closely?` },
  ])
  const [draft, setDraft] = useState('')
  const log = useRef<HTMLDivElement>(null)
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight }, [messages])
  const send = (text: string) => {
    const question = text.trim()
    if (!question) return
    const topic = question.toLowerCase()
    const answer = /sleep|rest|fatigue/.test(topic) && !/pulse|heart/.test(topic)
      ? `${sleepText}\n\nReview your sleep history alongside fatigue in your daily check-in. A consistent sleep schedule is a useful follow-up.`
      : /pulse|heart|bpm/.test(topic) ? `${pulseText}\n\nCompare the trend with your personal baseline and review any symptoms in your check-in.`
      : /exercise|workout|movement|training/.test(topic) ? exercise.mean === undefined ? 'No exercise readings are available this week.' : `You averaged ${Math.round(exercise.mean)} minutes of exercise across ${exercise.n} recorded days. The demo plan is ${EXERCISE_PLAN_MIN} minutes per day. Open the exercise measurements to review the daily record.`
      : `I can summarize sleep, resting pulse, and exercise from this week's demo readings. Try asking about one of those. This preview uses prepared responses.`
    setMessages((previous) => [...previous, { role: 'user', text: question }, { role: 'assistant', text: answer }])
    setDraft('')
  }
  const submit = (event: FormEvent) => { event.preventDefault(); send(draft) }
  return <article className="dashboard-card health-chat" aria-label="Weekly health conversation">
    <header><h2>Weekly check-in</h2><span className="small-tag">AI PREVIEW · MOCK</span></header>
    <div className="health-chat-log" role="log" aria-live="polite" aria-label="Health conversation" ref={log}>
      {messages.map((message, i) => <div key={i} className={`chat-message chat-${message.role}`}><span className="chat-speaker">{message.role === 'user' ? 'You' : 'ORBIT'}</span><p>{message.text}</p></div>)}
    </div>
    <div className="chat-suggestions" aria-label="Suggested questions">{['Sleep', 'Resting pulse', 'Exercise'].map((topic) => <button key={topic} onClick={() => send(`Tell me about my ${topic.toLowerCase()}.`)}>{topic}</button>)}</div>
    <form className="chat-composer" onSubmit={submit}><input aria-label="Message ORBIT" placeholder="Ask about your week…" value={draft} maxLength={500} onChange={(e) => setDraft(e.target.value)} /><button type="submit" disabled={!draft.trim()} aria-label="Send message"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 16V4M5 9l5-5 5 5" /></svg></button></form>
    <p className="chat-disclosure">Demo data · prepared responses</p>
  </article>
}
