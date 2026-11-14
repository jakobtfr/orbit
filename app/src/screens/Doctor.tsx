import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mark } from '../components/Shell'
import { StatusShape } from '../components/Status'
import { SUGGESTIONS, opening, reply, speakable, type DoctorReply } from '../lib/doctor'
import { useStore } from '../lib/store'
import '../doctor.css'

interface Line extends DoctorReply {
  id: number
  from: 'doctor' | 'you'
}

type Phase = 'idle' | 'speaking' | 'listening'

/** The part of the browser's speech recognition that is used here. It is not in every TypeScript DOM library. */
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

function sentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text]
}

const PHASE_LABEL: Record<Phase, string> = { idle: 'Ready', speaking: 'Speaking', listening: 'Listening' }

export function Doctor() {
  const { state, viewer } = useStore()
  const [lines, setLines] = useState<Line[]>(() => [{ id: 0, from: 'doctor', ...opening(state, viewer) }])
  const [draft, setDraft] = useState('')
  const [hearing, setHearing] = useState('')
  const [voice, setVoice] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [notice, setNotice] = useState('')

  const voiceOn = useRef(false)
  const phaseNow = useRef<Phase>('idle')
  const recognition = useRef<Recognition | null>(null)
  /** Goes up each time speech is started or stopped, so callbacks from an older utterance do nothing. */
  const turn = useRef(0)
  const misses = useRef(0)
  const nextId = useRef(1)
  const video = useRef<HTMLVideoElement>(null)
  const streamNow = useRef<MediaStream | null>(null)
  const end = useRef<HTMLLIElement>(null)
  const sendRef = useRef<(text: string) => void>(() => {})

  const go = (p: Phase) => { phaseNow.current = p; setPhase(p) }

  const stopListening = () => {
    const r = recognition.current
    recognition.current = null
    if (r) { r.onend = null; r.onresult = null; r.onerror = null; r.abort() }
    setHearing('')
  }

  const listen = useCallback(() => {
    const Rec = recognitionClass()
    if (!Rec || !voiceOn.current) { go('idle'); return }
    stopListening()
    const r = new Rec()
    r.lang = 'en-US'
    r.continuous = false
    r.interimResults = true
    let heard = false
    r.onresult = (e) => {
      let text = ''
      let final = false
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript
        if (e.results[i].isFinal) final = true
      }
      setHearing(text)
      if (final && text.trim()) {
        heard = true
        misses.current = 0
        setHearing('')
        sendRef.current(text.trim())
      }
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        misses.current = 99
        setNotice('The microphone is blocked. Allow it in the browser, or type your question.')
      } else if (e.error === 'network' || e.error === 'audio-capture') {
        misses.current = 99
        setNotice('The browser could not listen just now. You can still type, and I will answer aloud.')
      }
    }
    r.onend = () => {
      if (recognition.current === r) recognition.current = null
      if (heard || !voiceOn.current || phaseNow.current !== 'listening') return
      // Silence: keep the line open, but give up after a few empty tries so nothing spins.
      misses.current += 1
      if (misses.current > 5) { go('idle'); return }
      window.setTimeout(() => { if (voiceOn.current && phaseNow.current === 'listening' && !recognition.current) listen() }, 250)
    }
    recognition.current = r
    go('listening')
    try { r.start() } catch { go('idle') }
  }, [])

  const speak = useCallback((text: string) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    stopListening()
    const mine = ++turn.current
    if (!synth) { listen(); return }
    synth.cancel()
    go('speaking')
    const parts = sentences(speakable(text))
    const english = synth.getVoices().filter((v) => v.lang.startsWith('en'))
    const chosen = english.find((v) => v.default) ?? english.find((v) => v.localService) ?? english[0]
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part)
      u.lang = chosen?.lang ?? 'en-US'
      if (chosen) u.voice = chosen
      u.rate = 0.98
      if (i === parts.length - 1) {
        const done = () => { if (turn.current === mine) listen() }
        u.onend = done
        u.onerror = done
      }
      synth.speak(u)
    })
  }, [listen])

  const send = useCallback((text: string) => {
    const answer = reply(state, viewer, text)
    setLines((ls) => [...ls, { id: nextId.current++, from: 'you', text }, { id: nextId.current++, from: 'doctor', ...answer }])
    if (voiceOn.current) speak(answer.text)
  }, [state, viewer, speak])
  useEffect(() => { sendRef.current = send }, [send])

  const quiet = () => {
    turn.current++
    stopListening()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    go('idle')
  }

  const voiceStart = () => {
    voiceOn.current = true
    misses.current = 0
    setVoice(true)
    setNotice(recognitionClass() ? '' : 'This browser cannot listen, so I will speak and you can type.')
    const last = [...lines].reverse().find((l) => l.from === 'doctor')
    if (last) speak(last.text)
    else listen()
  }
  const voiceStop = () => { voiceOn.current = false; setVoice(false); quiet() }

  const cameraStop = () => {
    streamNow.current?.getTracks().forEach((t) => t.stop())
    streamNow.current = null
    setStream(null)
  }
  const cameraStart = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setNotice('This browser has no camera access.'); return }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamNow.current?.getTracks().forEach((t) => t.stop())
      streamNow.current = s
      setStream(s)
    } catch {
      setNotice('The camera is blocked. Allow it in the browser to see yourself during the call.')
    }
  }

  useEffect(() => { if (video.current) video.current.srcObject = stream }, [stream])
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'nearest' }) }, [lines, hearing])
  useEffect(() => () => {
    voiceOn.current = false
    turn.current++
    const r = recognition.current
    recognition.current = null
    if (r) { r.onend = null; r.abort() }
    window.speechSynthesis?.cancel()
    streamNow.current?.getTracks().forEach((t) => t.stop())
  }, [])

  const inCall = voice || !!stream
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    send(text)
  }
  const spoken = [...lines].reverse().find((l) => l.from === 'doctor')

  return (
    <div className="screen doctor-screen">
      <section className="doctor-stage" aria-label="Call with the virtual doctor">
        <div className={`doctor-tile is-${phase}`}>
          <div className="doctor-avatar" aria-hidden="true"><Mark size={56} /></div>
          <div className="doctor-id">
            <strong>ORBIT doctor</strong>
            <span className="tag">Simulated</span>
          </div>
          <p className="doctor-phase" role="status">{voice ? PHASE_LABEL[phase] : 'Voice is off'}</p>
          {spoken && <p className="doctor-caption">{spoken.text}</p>}

          <div className={`doctor-self ${stream ? 'is-on' : ''}`}>
            {stream
              ? <video ref={video} autoPlay muted playsInline aria-label="Your camera" />
              : <span>Camera off</span>}
            <span className="doctor-self-name">{viewer.name}</span>
          </div>
        </div>

        <div className="doctor-controls">
          {!inCall
            ? <button className="btn btn-primary" onClick={() => { voiceStart(); void cameraStart() }}>Start call</button>
            : <button className="btn btn-secondary doctor-end" onClick={() => { voiceStop(); cameraStop() }}>End call</button>}
          <button className="btn btn-secondary" aria-pressed={voice} onClick={voice ? voiceStop : voiceStart}>{voice ? 'Voice on' : 'Voice off'}</button>
          <button className="btn btn-secondary" aria-pressed={!!stream} onClick={stream ? cameraStop : () => void cameraStart()}>{stream ? 'Camera on' : 'Camera off'}</button>
        </div>
        {notice && <p className="body-sm doctor-notice" role="alert">{notice}</p>}
        <p className="card-note">
          A simulated doctor, not a real clinician. Answers are put together on this device from your own readings and check-ins.
          Your camera picture is only shown to you and is not recorded. In voice mode, your browser's speech service turns what you say into text and may send the audio online to do it.
        </p>
      </section>

      <section className="doctor-talk" aria-label="Conversation">
        <header className="doctor-talk-head">
          <h1 className="title-3">Talk to the doctor</h1>
          <span className="label">Day {state.day}</span>
        </header>
        <ol className="doctor-lines" aria-live="polite">
          {lines.map((l) => (
            <li key={l.id} className={`doctor-line from-${l.from} ${l.urgent ? 'is-urgent' : ''}`}>
              <span className="label">{l.from === 'doctor' ? <>{l.status && <StatusShape status={l.status} size={11} />} Doctor</> : 'You'}</span>
              <p>{l.text}</p>
              {l.actions && (
                <div className="doctor-actions">
                  {l.actions.map((a) => <Link key={a.to} className="tag tag-link" to={a.to}>{a.label}</Link>)}
                </div>
              )}
            </li>
          ))}
          {hearing && <li className="doctor-line from-you is-hearing"><span className="label">You</span><p>{hearing}</p></li>}
          <li ref={end} aria-hidden="true" />
        </ol>
        <div className="doctor-suggest">
          {SUGGESTIONS.map((s) => <button key={s} className="tag tag-link" onClick={() => send(s)}>{s}</button>)}
        </div>
        <form className="doctor-form" onSubmit={submit}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={phase === 'listening' ? 'Listening. Speak, or type here' : 'Type a question or how you feel'} aria-label="Message to the doctor" />
          <button className="btn btn-primary" type="submit" disabled={!draft.trim()}>Send</button>
        </form>
      </section>
    </div>
  )
}
