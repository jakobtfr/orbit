import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mark } from '../components/Shell'
import { StatusShape } from '../components/Status'
import { SUGGESTIONS, afterReading, briefing, focusOn, heardReading, isUrgent, nextStep, opening, reply, speakable, wantsLook, withReading, type DoctorReply } from '../lib/doctor'
import { INDICATORS, formatValue } from '../lib/indicators'
import { canSee, chat, findModel, warm, type ChatMessage } from '../lib/localModel'
import { useStore } from '../lib/store'
import { doctorVoice } from '../lib/voices'
import '../doctor.css'

interface Line extends DoctorReply {
  id: number
  from: 'doctor' | 'you'
  /** A note under the message, such as a reading that was saved from it. */
  note?: string
}

type Phase = 'idle' | 'thinking' | 'speaking' | 'listening'

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

const PHASE_LABEL: Record<Phase, string> = { idle: 'Ready', thinking: 'Thinking', speaking: 'Speaking', listening: 'Listening' }

/** Removes the markdown a language model may add, since the text is shown plainly and read aloud. */
function tidy(text: string): string {
  return text.replace(/[*_#`]/g, '').trimStart()
}

export function Doctor() {
  const { state, viewer, dispatch } = useStore()
  const [params] = useSearchParams()
  /** What this call is about. Fixed when the call opens, so the plan stays even after the reading improves. */
  const [focus] = useState(() => focusOn(state, viewer, params.get('about')))
  const [lines, setLines] = useState<Line[]>(() => [{ id: 0, from: 'doctor', ...opening(state, viewer, focus) }])
  /** True when the model on this device can look at pictures. */
  const [sees, setSees] = useState(false)
  const [draft, setDraft] = useState('')
  const [hearing, setHearing] = useState('')
  const [voice, setVoice] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [notice, setNotice] = useState('')
  /** The language model on this device, when one is running. Without it the doctor uses its built-in answers. */
  const [model, setModel] = useState<string | null>(null)

  const voiceOn = useRef(false)
  const phaseNow = useRef<Phase>('idle')
  const recognition = useRef<Recognition | null>(null)
  /** Goes up each time speech is started or stopped, so callbacks from an older utterance do nothing. */
  const turn = useRef(0)
  const misses = useRef(0)
  const modelNow = useRef<string | null>(null)
  const seesNow = useRef(false)
  /** The step of the plan the built-in doctor has reached, when no model is running. */
  const step = useRef(0)
  const voiceNow = useRef<SpeechSynthesisVoice | undefined>(undefined)
  const asking = useRef<AbortController | null>(null)
  /** Sentences handed to the speech voice in the current turn, and whether more are still to come. */
  const speech = useRef({ queued: 0, done: 0, closed: true })
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

  const settle = () => { if (speech.current.closed && speech.current.done >= speech.current.queued) listen() }

  /** Opens a speaking turn. Sentences are added with sayPart as they become known, then speakEnd closes the turn. */
  const speakBegin = (first: Phase = 'speaking') => {
    stopListening()
    turn.current++
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    speech.current = { queued: 0, done: 0, closed: false }
    go(first)
  }
  const sayPart = (part: string) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    if (!synth || !voiceOn.current || !part.trim()) return
    const mine = turn.current
    const q = speech.current
    const chosen = voiceNow.current
    const u = new SpeechSynthesisUtterance(speakable(part.trim()))
    u.lang = chosen?.lang ?? 'en-US'
    if (chosen) u.voice = chosen
    u.rate = 0.98
    const done = () => { if (turn.current !== mine) return; q.done++; settle() }
    u.onend = done
    u.onerror = done
    q.queued++
    go('speaking')
    synth.speak(u)
  }
  const speakEnd = () => { speech.current.closed = true; settle() }
  const speak = (text: string) => { speakBegin(); sentences(text).forEach(sayPart); speakEnd() }

  /** One still picture from the camera, as base64 JPEG, for a model that can see. */
  const snapshot = (): string | undefined => {
    const v = video.current
    if (!v || !streamNow.current || !v.videoWidth) return undefined
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = Math.round((512 * v.videoHeight) / v.videoWidth)
    canvas.getContext('2d')?.drawImage(v, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
  }

  const send = (text: string) => {
    asking.current?.abort()
    const urgent = isUrgent(text)
    // A reading said aloud in a call about that reading is saved, and everything after it uses the new state.
    const heard = urgent ? undefined : heardReading(text, focus?.key)
    let current = state
    let note: string | undefined
    if (heard) {
      const added = withReading(state, viewer, heard.key, heard)
      current = added.state
      dispatch({ type: 'reading', personId: viewer.id, key: heard.key, reading: added.reading })
      note = `Saved: ${INDICATORS[heard.key].name} ${formatValue(heard.key, heard)} ${INDICATORS[heard.key].unit}`
    }
    const general = reply(current, viewer, text)
    // The built-in doctor: judge a new reading; otherwise answer what was said, or give the next step of a focused call.
    const rule: DoctorReply = urgent ? general
      : heard ? afterReading(current, viewer, heard.key)
      : !focus || general.status !== undefined || general.actions ? general
      : nextStep(focus, ++step.current)
    const you: Line = { id: nextId.current++, from: 'you', text, note }
    const using = modelNow.current
    // Urgent words always get the fixed answer. So does everything when no model is running.
    if (!using || urgent) {
      setLines((ls) => [...ls, you, { id: nextId.current++, from: 'doctor', ...rule }])
      if (voiceOn.current) speak(rule.text)
      return
    }
    const lastSaid = [...lines].reverse().find((l) => l.from === 'doctor')?.text
    const picture = seesNow.current && wantsLook(text, lastSaid) ? snapshot() : undefined
    if (picture) you.note = [you.note, 'Sent with a picture from your camera'].filter(Boolean).join(' · ')

    const id = nextId.current++
    const write = (t: string) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, text: t } : l)))
    const messages: ChatMessage[] = [
      { role: 'system', content: briefing(current, viewer, { focus, camera: picture ? 'picture' : streamNow.current && seesNow.current ? 'on' : 'off', note: note ? `They have just told you a new reading in this message. ${note}. It is already in the readings above with its status.` : undefined }) },
      ...lines.slice(-10).filter((l) => l.text).map((l): ChatMessage => ({ role: l.from === 'doctor' ? 'assistant' : 'user', content: l.text })),
      { role: 'user', content: text, images: picture ? [picture] : undefined },
    ]
    setLines((ls) => [...ls, you, { id, from: 'doctor', text: '', status: rule.status, actions: focus ? undefined : general.actions }])
    const ctl = new AbortController()
    asking.current = ctl
    const aloud = voiceOn.current
    if (aloud) speakBegin('thinking')
    else go('thinking')
    const mine = turn.current
    let full = ''
    let saidUpTo = 0
    let gaveUp = false
    const timer = window.setTimeout(() => { if (!full) { gaveUp = true; ctl.abort() } }, 25000)
    const fallBack = () => {
      write(rule.text)
      if (voiceOn.current) speak(rule.text)
      else go('idle')
    }
    chat(using, messages, (piece) => {
      full += piece
      const clean = tidy(full)
      write(clean)
      // Say each sentence as soon as it is complete, so the voice starts before the answer is finished.
      const ready = aloud && turn.current === mine ? clean.slice(saidUpTo).match(/^[\s\S]*[.!?](?=\s)/) : null
      if (ready) { sayPart(ready[0]); saidUpTo += ready[0].length }
    }, ctl.signal).then(() => {
      const clean = tidy(full).trimEnd()
      if (!clean) { fallBack(); return }
      write(clean)
      if (aloud && turn.current === mine) { sayPart(clean.slice(saidUpTo)); speakEnd() }
      else if (phaseNow.current === 'thinking') go('idle')
    }).catch(() => {
      if (ctl.signal.aborted && !gaveUp) return
      if (full.trim() && !gaveUp) { if (aloud && turn.current === mine) speakEnd(); else if (phaseNow.current === 'thinking') go('idle'); return }
      fallBack()
    }).finally(() => window.clearTimeout(timer))
  }
  useEffect(() => { sendRef.current = send })

  // The browser fills its voice list late, so read it now and again when it changes.
  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    const load = () => { voiceNow.current = doctorVoice(synth.getVoices()) }
    load()
    synth.addEventListener('voiceschanged', load)
    return () => synth.removeEventListener('voiceschanged', load)
  }, [])

  useEffect(() => {
    let active = true
    findModel().then((m) => {
      if (!active || !m) return
      modelNow.current = m
      setModel(m)
      warm(m)
      canSee(m).then((yes) => { if (active) { seesNow.current = yes; setSees(yes) } })
    })
    return () => { active = false }
  }, [])

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
    asking.current?.abort()
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
            <span className="tag">{model ? `On this device · ${model}` : 'Built-in answers'}</span>
          </div>
          <p className="doctor-phase" role="status">{voice || phase !== 'idle' ? PHASE_LABEL[phase] : 'Voice is off'}</p>
          {spoken && <p className="doctor-caption">{spoken.text || '…'}</p>}

          <div className={`doctor-self ${stream ? 'is-on' : ''}`}>
            {stream
              ? <video ref={video} autoPlay muted playsInline aria-label="Your camera" />
              : <span>Camera off</span>}
            <span className="doctor-self-name">{viewer.name}</span>
            {stream && sees && <span className="doctor-self-seen">Show something to the doctor</span>}
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
          A simulated doctor, not a real clinician. {model ? 'Answers are written by a language model running on this device, from your own readings and check-ins. It can make mistakes.' : 'Answers are put together on this device from your own readings and check-ins.'}
          {stream && sees ? 'While the camera is on, a still picture goes to that model when you show it something or ask it to look. Pictures stay on this device and are not kept.' : 'Your camera picture is only shown to you and is not recorded.'} In voice mode, your browser's speech service turns what you say into text and may send the audio online to do it.
        </p>
      </section>

      <section className="doctor-talk" aria-label="Conversation">
        <header className="doctor-talk-head">
          <h1 className="title-3">{focus ? `About ${focus.title}` : 'Talk to the doctor'}</h1>
          <span className="label">Day {state.day}</span>
        </header>
        <ol className="doctor-lines" aria-live="polite">
          {lines.map((l) => (
            <li key={l.id} className={`doctor-line from-${l.from} ${l.urgent ? 'is-urgent' : ''}`}>
              <span className="label">{l.from === 'doctor' ? <>{l.status && <StatusShape status={l.status} size={11} />} Doctor</> : 'You'}</span>
              <p>{l.text || '…'}</p>
              {l.note && <span className="tag">{l.note}</span>}
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
          {(focus ? ['I feel fine', 'Done. What next?', 'Can you look at this?', 'What does this mean?'] : SUGGESTIONS).map((s) => <button key={s} className="tag tag-link" onClick={() => send(s)}>{s}</button>)}
        </div>
        <form className="doctor-form" onSubmit={submit}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={phase === 'listening' ? 'Listening. Speak, or type here' : 'Type a question or how you feel'} aria-label="Message to the doctor" />
          <button className="btn btn-primary" type="submit" disabled={!draft.trim()}>Send</button>
        </form>
      </section>
    </div>
  )
}
