import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Mark } from '../components/Shell'
import { useCall } from '../lib/call'
import { speakable } from '../lib/doctor'
import { MESSAGES, arrived, callScript, familyTurn, memberOf, recordedLabel, signalDelayMin, type Segment, type Topic } from '../lib/family'
import { chatBriefing, checkModelReply } from '../lib/familyChat'
import { chat, findModel, warm, type ChatMessage } from '../lib/localModel'
import { GUIDE_NOTICE, startChips } from '../lib/familyGuide'
import { privateLines } from '../lib/familyPrivate'
import { useFamily } from '../lib/familyStore'
import { INDICATORS, formatValue } from '../lib/indicators'
import { useStore } from '../lib/store'
import type { IndicatorKey } from '../lib/types'
import { doctorVoice, rankVoices } from '../lib/voices'
import '../doctor.css'
import '../family.css'
import '../family-chat.css'

type Phase = 'ringing' | 'playing' | 'thinking' | 'listening' | 'idle'

interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start(): void
  abort(): void
}

function recognitionClass(): (new () => Recognition) | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2)

/**
 * The family call. It rings in off-duty time, plays what the person recorded on Earth, and passes on
 * the one thing ORBIT wants said, in ORBIT's words. An AI label stays on screen for the whole call,
 * and every line shows who is speaking: the recording, the AI voice, or ORBIT.
 */
export function FamilyCall({ messageId, onClose }: { messageId: string; onClose: () => void }) {
  const { state, viewer, dispatch } = useStore()
  const { optIn, addLines } = useFamily()
  const { openCall } = useCall()
  const [current, setCurrent] = useState(messageId)
  const message = MESSAGES.find((m) => m.id === current) ?? MESSAGES[0]
  const member = memberOf(message)
  const [phase, setPhase] = useState<Phase>('ringing')
  const [shown, setShown] = useState<Segment | null>(null)
  const [you, setYou] = useState('')
  const [hearing, setHearing] = useState('')
  const [saved, setSaved] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState('')
  const [muted, setMuted] = useState(false)
  /** False once urgent words ended the role-play: from then on the call is ORBIT only. */
  const [rolePlay, setRolePlay] = useState(true)
  const [played, setPlayed] = useState<Topic[]>([])
  /** The reading the health part asked for, until it has been given. */
  const [focus, setFocus] = useState<IndicatorKey | undefined>(undefined)
  /** The "talk freely" preview: scripted replies in place of the next recording. Off until the astronaut turns it on. */
  const [talkFreely, setTalkFreely] = useState(false)
  /** The language model on this device, when one is running. It writes the preview's replies; without it the preset lines are used. */
  const [model, setModel] = useState<string | null>(null)
  /** The preview's talk so far, for the model: what was said and what it answered. */
  const talk = useRef<ChatMessage[]>([])
  /** What the guided conversation offers to say next; before the first reply, everything this person can answer. */
  const [offered, setOffered] = useState<string[] | null>(null)
  /** Scripted lines already said in this call. */
  const [scripted, setScripted] = useState<string[]>([])
  /** Senders whose message has been opened in this call. */
  const [heardFrom, setHeardFrom] = useState<string[]>([])

  /** Goes up whenever playback is replaced, so an older queue stops. */
  const run = useRef(0)
  const audio = useRef<HTMLAudioElement | null>(null)
  const recognition = useRef<Recognition | null>(null)
  const voices = useRef<SpeechSynthesisVoice[]>([])
  /** Pre-rendered speech for fixed sentences, by their text. */
  const rendered = useRef<Record<string, string>>({})
  const mutedNow = useRef(false)
  const sendRef = useRef<(text: string) => void>(() => {})
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    const synth = window.speechSynthesis
    const load = () => { voices.current = synth?.getVoices() ?? [] }
    load()
    synth?.addEventListener('voiceschanged', load)
    fetch(`${import.meta.env.BASE_URL}family/voice.json`).then((r) => (r.ok ? r.json() : {})).then((m) => { rendered.current = m as Record<string, string> }).catch(() => {})
    findModel().then((m) => { if (alive.current && m) { setModel(m); warm(m) } })
    return () => {
      alive.current = false
      run.current++
      synth?.removeEventListener('voiceschanged', load)
      synth?.cancel()
      audio.current?.pause()
      const r = recognition.current
      recognition.current = null
      if (r) { r.onend = null; r.onresult = null; r.abort() }
    }
  }, [])

  const stopListening = () => {
    const r = recognition.current
    recognition.current = null
    if (r) { r.onend = null; r.onresult = null; r.onerror = null; r.abort() }
    setHearing('')
  }

  const listen = () => {
    const Rec = recognitionClass()
    if (!Rec || mutedNow.current) { setPhase('idle'); return }
    stopListening()
    const r = new Rec()
    r.lang = 'en-US'
    r.continuous = false
    r.interimResults = true
    let tries = 0
    r.onresult = (e) => {
      let text = ''
      let final = false
      for (let i = e.resultIndex; i < e.results.length; i++) { text += e.results[i][0].transcript; if (e.results[i].isFinal) final = true }
      setHearing(text)
      if (final && text.trim()) { setHearing(''); sendRef.current(text.trim()) }
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture' || e.error === 'network') {
        tries = 99
        setNotice('The microphone is not available. Type your answer, or tap one below.')
      }
    }
    r.onend = () => {
      if (recognition.current !== r) return
      recognition.current = null
      if (++tries > 4 || mutedNow.current) { setPhase('idle'); return }
      window.setTimeout(() => { if (alive.current && !recognition.current && !mutedNow.current) listen() }, 250)
    }
    recognition.current = r
    setPhase('listening')
    try { r.start() } catch { setPhase('idle') }
  }

  /** Says one part: the recording or pre-rendered speech when there is a file, the browser's voice when not. */
  const sayOne = (seg: Segment) => new Promise<void>((resolve) => {
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }
    const bySynth = () => {
      const synth = window.speechSynthesis
      if (!synth) { window.setTimeout(finish, 1200 + seg.text.length * 45); return }
      const u = new SpeechSynthesisUtterance(speakable(seg.text))
      const ranked = rankVoices(voices.current)
      const voice = seg.label === 'ORBIT' ? doctorVoice(voices.current) : ranked[1] ?? ranked[0]
      if (voice) { u.voice = voice; u.lang = voice.lang }
      u.rate = seg.label === 'ORBIT' ? 1.1 : 1
      u.onend = finish
      u.onerror = finish
      synth.speak(u)
      // Some browsers never report the end of an utterance.
      window.setTimeout(finish, 4000 + seg.text.length * 110)
    }
    const file = seg.audio ?? rendered.current[seg.text]
    if (!file) { bySynth(); return }
    // A file that cannot be played reports it twice, as an error and as a failed play: fall back once.
    let fellBack = false
    const fallBack = () => { if (!done && !fellBack) { fellBack = true; bySynth() } }
    const a = new Audio(`${import.meta.env.BASE_URL}${file}`)
    audio.current = a
    a.onended = finish
    a.onerror = fallBack
    a.play().catch(fallBack)
  })

  const play = async (segments: Segment[], then: 'listen' | 'stop' = 'listen') => {
    const mine = ++run.current
    stopListening()
    window.speechSynthesis?.cancel()
    audio.current?.pause()
    setPhase('playing')
    for (const seg of segments) {
      if (run.current !== mine) return
      setShown(seg)
      await sayOne(seg)
    }
    if (run.current !== mine || !alive.current) return
    if (then === 'listen') listen()
    else setPhase('idle')
  }

  const accept = () => {
    const script = callScript(state, viewer, message)
    const about = script.find((s) => s.kind === 'health')
    setPlayed([message.parts[0].topic])
    setHeardFrom([member.id])
    setFocus(about ? about['key'] : undefined)
    addLines([{ day: state.day, with: member.id, from: 'recorded', text: message.parts[0].text }])
    void play(script)
  }

  const send = (text: string) => {
    if (!rolePlay) return
    setYou(text)
    setSaved('')
    const turn = familyTurn(state, viewer, text, { member, message, played, focus, talkFreely, said: scripted })
    if (!(turn.kind === 'preview' && turn.forModel && model)) addLines(privateLines(state, member, text, turn))
    if (turn.kind === 'escalate') {
      setRolePlay(false)
      void play(turn.segments, 'stop')
      return
    }
    if (turn.kind === 'reading' && turn.reading && turn.saved) {
      const { key: indicator } = turn.saved
      dispatch({ type: 'reading', personId: viewer.id, key: indicator, reading: turn.reading })
      setSaved(`Saved to your health record: ${INDICATORS[indicator].name} ${formatValue(indicator, turn.saved)} ${INDICATORS[indicator].unit}`)
      if (turn.settled) setFocus(undefined)
    }
    if (turn.topic) setPlayed((p) => [...p, turn.topic!])
    if (turn.next) setOffered(turn.next)
    if (turn.kind === 'preview' && turn.forModel && model) {
      // Everyday talk, and a model is running: it writes the reply, and the reply is checked before it is shown or spoken.
      const mine = ++run.current
      stopListening()
      window.speechSynthesis?.cancel()
      audio.current?.pause()
      setShown(null)
      setPhase('thinking')
      let full = ''
      const preset = turn.segments[0]
      const asked: ChatMessage = { role: 'user', content: text }
      chat(model, [{ role: 'system', content: chatBriefing(member, viewer, message) }, ...talk.current.slice(-8), asked], (piece) => { full += piece }, AbortSignal.timeout(20000), 0.7, { think: false, maxTokens: 90 })
        .then(() => true, () => false)
        .then((ok) => {
          if (run.current !== mine || !alive.current) return
          if (!ok || !full.trim()) { setScripted((x) => [...x, preset.text]); addLines(privateLines(state, member, text, turn)); void play([preset]); return }
          const said = checkModelReply(full)
          talk.current = [...talk.current, asked, { role: 'assistant', content: said }]
          addLines([{ day: state.day, with: member.id, from: 'you', text }, { day: state.day, with: member.id, from: 'ai', text: said }])
          void play([{ kind: 'preview', label: 'AI model', text: said }])
        })
      return
    }
    if (turn.kind === 'preview') setScripted((x) => [...x, turn.segments[0].text])
    void play(turn.segments)
  }
  useEffect(() => { sendRef.current = send })

  // The astronaut already answered on the incoming-call card, so it rings for a moment and connects.
  const connect = useRef(accept)
  connect.current = accept
  useEffect(() => {
    const id = window.setTimeout(() => connect.current(), 1500)
    return () => window.clearTimeout(id)
  }, [])

  const others = arrived(state, MESSAGES, optIn).filter((m) => m.id !== message.id && !heardFrom.includes(m.from))
  const next = (id: string) => {
    const m = MESSAGES.find((x) => x.id === id)
    if (!m) return
    const who = memberOf(m)
    setCurrent(id)
    setOffered(null)
    talk.current = []
    setPlayed([m.parts[0].topic])
    setHeardFrom((h) => [...h, who.id])
    setYou('')
    setSaved('')
    addLines([{ day: state.day, with: who.id, from: 'recorded', text: m.parts[0].text }])
    void play([{ kind: 'recorded', label: 'Recorded on Earth', text: m.parts[0].text, audio: m.parts[0].audio, standIn: m.parts[0].standIn }])
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    send(text)
  }
  const toggleMute = () => {
    const to = !muted
    mutedNow.current = to
    setMuted(to)
    if (to) { stopListening(); if (phase === 'listening') setPhase('idle') }
    else if (phase === 'idle') listen()
  }
  const toDoctor = () => { onClose(); openCall() }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e['key'] === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const ringing = phase === 'ringing'
  const delay = Math.round(signalDelayMin(state.day))
  const status = ringing ? 'Connecting…' : phase === 'playing' ? (shown?.label === 'Recorded on Earth' ? 'Playing the recording' : 'Speaking') : phase === 'thinking' ? 'Writing a reply…' : phase === 'listening' ? 'Listening' : muted ? 'You are muted' : 'Your turn'
  const left = message.parts.filter((p) => !played.includes(p.topic))
  const chips = ringing || !rolePlay || phase === 'playing' || phase === 'thinking' ? [] : talkFreely ? [
    ...(focus ? [{ label: 'Demo: say 112 over 70', say: 'It is 112 over 70 now' }] : []),
    ...(offered ?? startChips(member)).map((say) => ({ label: say, say })),
  ] : [
    ...(focus ? [{ label: 'Demo: say 112 over 70', say: 'It is 112 over 70 now' }, { label: 'I am fine', say: 'I am fine' }] : []),
    ...(left.some((p) => p.topic === 'day') ? [{ label: 'How was your day?', say: 'How was your day?' }] : []),
    ...(left.some((p) => p.topic === 'story') ? [{ label: 'Tell me a story', say: 'Tell me a story' }] : []),
    ...(left.length && !left.some((p) => p.topic === 'day' || p.topic === 'story') ? [{ label: 'Go on', say: 'Go on' }] : []),
  ]
  const first = member.name.split(' ')[0]

  return (
    <div className="doctor-backdrop">
      <div className={`doctor-call family-call is-${ringing ? 'calling' : phase === 'playing' ? 'speaking' : phase} ${rolePlay ? '' : 'is-orbit'}`} role="dialog" aria-modal="true" aria-label={`Family call with ${member.name}`}>
        <header className="doctor-call-head">
          <span>{rolePlay ? <>{member.name} <em>{member.relation}</em></> : <>ORBIT <em>The family call has ended</em></>}</span>
          <span className="family-ai" title="Every family call is AI. It is not live.">AI call</span>
        </header>
        <p className="family-from">{recordedLabel(state, message)} · signal {delay} min one way</p>

        <div className="doctor-face">
          <div className={`doctor-avatar ${rolePlay ? 'family-avatar' : ''}`} aria-hidden="true">{rolePlay ? initials(member.name) : <Mark size={52} />}</div>
          <p className="doctor-phase" role="status">{status}</p>
        </div>

        <div className="doctor-words" aria-live="polite">
          {ringing
            ? <p className="doctor-caption is-quiet">{first} recorded a message for you. It is not a live call: you will hear the recording, and an AI voice links the parts.</p>
            : <>
                {you && <p className="doctor-said">{you}</p>}
                {shown && <p className={`family-label is-${shown.kind}`}>{shown.label}{shown.label === 'Recorded on Earth' ? ` · ${first}'s own words${shown.standIn ? ' · demo: AI-generated stand-in voice' : ''}` : shown.label === 'ORBIT' ? ' · fixed health rule, word for word' : shown.label === 'Scripted preview' ? ' · written by the team · AI voice · not ' + first : shown.label === 'AI model' ? ` · written by an AI model in ${first}'s character · not ${first}` : ' · AI-generated'}</p>}
                {shown && <p className={`doctor-caption ${rolePlay ? '' : 'is-urgent'}`}>{shown.text}</p>}
                {hearing && <p className="doctor-said">{hearing}</p>}
                {saved && <p className="doctor-saved">{saved}</p>}
              </>}
        </div>

        {!!chips.length && (
          <div className="doctor-choices" role="group" aria-label="Answers you can tap">
            {chips.map((c) => <button key={c.label} onClick={() => send(c.say)}>{c.label}</button>)}
          </div>
        )}
        {!ringing && rolePlay && (
          <div className={`family-chat-preview ${talkFreely ? 'is-on' : ''}`}>
            <button role="switch" aria-checked={talkFreely} onClick={() => setTalkFreely((on) => !on)}>{talkFreely ? 'Talk freely is on' : 'Talk freely (preview)'}</button>
            {talkFreely && <p role="note">{GUIDE_NOTICE} {model ? `Anything else you type is answered by an AI model on this device (${model}) in ${first}'s character.` : 'Anything else you type gets an honest "not yet".'} Health goes to ORBIT's fixed rules.</p>}
          </div>
        )}

        {!ringing && rolePlay && phase !== 'playing' && !!others.length && (
          <div className="doctor-choices family-next" role="group" aria-label="More messages from Earth">
            {others.map((m) => <button key={m.id} onClick={() => next(m.id)}>Next message: {memberOf(m).name.split(' ')[0]}</button>)}
          </div>
        )}
        {!rolePlay && (
          <div className="family-ring">
            <button className="btn btn-primary" onClick={toDoctor}>Call the ORBIT doctor</button>
          </div>
        )}

        {notice && rolePlay && <p className="doctor-notice" role="alert">{notice}</p>}

        {!ringing && rolePlay && (
          <form className="doctor-form" onSubmit={submit}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Say it, or type here" aria-label={`Your reply to ${member.name}`} />
            <button className="btn btn-primary" type="submit" disabled={!draft.trim()}>Send</button>
          </form>
        )}

        <div className="doctor-controls">
          <button className="doctor-round" aria-pressed={muted} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} title={muted ? 'Unmute' : 'Mute'} disabled={ringing || !rolePlay} onClick={toggleMute}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />{muted && <path d="M4 4l16 16" />}</svg>
          </button>
          <button className="doctor-round doctor-end" aria-label="End call" title="End call" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 13.5c5-4.5 12-4.5 17 0l-2.2 2.6-3.1-1.3v-2.4a9 9 0 0 0-6.4 0v2.4l-3.1 1.3Z" /></svg>
          </button>
        </div>
        <p className="doctor-fine">Not live. In this demo every voice is AI-generated speech (Kokoro-82M); a real recording would be the person's own. Your side of this call stays private, apart from your health record.</p>
      </div>
    </div>
  )
}
