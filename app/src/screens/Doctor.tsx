import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Astronaut } from '../components/Astronaut'
import { Mark } from '../components/Shell'
import { useCall } from '../lib/call'
import { afterReading, briefing, declined, focusOn, greeting, guideCommand, heardReading, isUrgent, nextStep, opening, reply, speakable, stepLine, topicOf, wantsLook, wantsProcedure, withReading, type DoctorReply } from '../lib/doctor'
import { INDICATORS, formatValue } from '../lib/indicators'
import { activeProcedures, allProcedures, measureProcedures, sceneFor, type Procedure } from '../lib/procedures'
import type { IndicatorKey } from '../lib/types'
import { canSee, chat, findModel, warm, type ChatMessage } from '../lib/localModel'
import { useStore } from '../lib/store'
import { doctorVoice } from '../lib/voices'
import '../doctor.css'

interface Line extends DoctorReply {
  id: number
  from: 'doctor' | 'you'
  /** A note under the message: a reading that was saved from it, or something the doctor did, such as opening a procedure. */
  note?: string
  /** Answers offered under the doctor's words, to tap instead of saying. */
  choices?: Choice[]
}

/** Something the doctor did: what it says about it, the note shown under its words, and the steps of the procedure it concerns. */
interface Did { text: string; note: string; steps: string[] }

/** One answer the person can tap. It is sent as if they had said it, unless it picks a problem or starts a procedure. */
interface Choice { label: string; say?: string; about?: string; start?: string; other?: boolean }

const WHERE: Choice[] = [
  { label: 'Head', say: 'I have a headache' },
  { label: 'Chest', say: 'My chest hurts' },
  { label: 'Stomach', say: 'My stomach hurts' },
  { label: 'Skin', say: 'I have a skin rash' },
  { label: 'Tired or feverish', say: 'I feel tired and feverish' },
]
const FEEL: Choice[] = [{ label: 'Fine' }, { label: 'Dizzy', say: 'I feel dizzy' }, { label: 'Weak or tired', say: 'I feel weak and tired' }, { label: 'Worse than before', say: 'I feel worse than before' }]

/** How the language model offers answers to tap: [[options: Yes | No | Not sure]] at the end of its answer. */
const OPTIONS_TAG = /\[\[\s*options\s*:\s*([^\]]+)\]\]/i

type Phase = 'idle' | 'calling' | 'thinking' | 'speaking' | 'listening'

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


/** A little quicker than the browser's normal pace, which sounds slow for short answers. */
const SPEECH_RATE = 1.2

/**
 * How the language model acts instead of only talking, at the end of its answer: [[start:measure-bp]] begins a
 * procedure, [[next]] and [[step:3]] move through the one in hand, [[finish]] closes it, and [[drop]] or
 * [[drop:measure-bp]] puts aside one the person does not want.
 */
const ACT_TAG = /\[\[\s*(start|step|next|finish|drop)\s*(?::\s*([a-z0-9-]+))?\s*\]\]/i

/** Removes the markdown a language model may add, and its request to start a procedure, since the text is shown plainly and read aloud. */
function tidy(text: string): string {
  return text.replace(/\[\[[^\]]*(\]\]?)?/g, '').replace(/[*_#`]/g, '').trimStart()
}

/**
 * The call with the virtual doctor, as a pop-up like a phone call. It rings briefly, then connects with
 * voice and camera on. A procedure the doctor goes through is acted out inside the pop-up, one step at a
 * time. Minimised, it becomes a bar in the corner and the screen behind is free to use.
 */
export function Doctor({ about, onClose }: { about?: string; onClose: () => void }) {
  const { state, viewer, dispatch } = useStore()
  const { guide, setGuide, wanted, askFor } = useCall()
  /** What this call is about. A call opened on a problem starts with it; one opened from the header has none until the person picks. */
  const [focus, setFocus] = useState(() => (about ? focusOn(state, viewer, about) : undefined))
  const [lines, setLines] = useState<Line[]>(() => {
    if (focus) return [{ id: 0, from: 'doctor', ...opening(state, viewer, focus), choices: FEEL }]
    const g = greeting(state, viewer)
    return [{ id: 0, from: 'doctor', text: g.text, choices: [...g.problems, { label: 'Something else', other: true }, { label: 'Just check my results', say: 'How are my results?' }] }]
  })
  /** What the doctor means to get done in this call, fixed when it opens: what is needed today and how to take those readings again, or else how to take the main readings. It is not shown; the doctor works from it. */
  const [tasks, setTasks] = useState<Procedure[]>(() => {
    const today = activeProcedures(state, viewer).slice(0, 3)
    const measuring = measureProcedures(state, viewer)
    const again = measuring.filter((m) => m.button && today.some((t) => `measure-${t.about}` === m.id))
    return today.length ? [...today, ...again].slice(0, 5) : measuring.slice(0, 3)
  })
  /** The procedure being gone through, kept as it was when it started. The step is in the shared guide. */
  const [proc, setProc] = useState<Procedure | null>(null)
  const [finished, setFinished] = useState<string[]>([])
  /** What the person said they do not want to deal with in this call. The doctor does not start it or bring it up again unless they ask. */
  const [dropped, setDropped] = useState<string[]>([])
  /** True when the model on this device can look at pictures. */
  const [sees, setSees] = useState(false)
  const [draft, setDraft] = useState('')
  const [hearing, setHearing] = useState('')
  const [voice, setVoice] = useState(false)
  const [phase, setPhase] = useState<Phase>('calling')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [notice, setNotice] = useState('')
  const [muted, setMuted] = useState(false)
  const [typing, setTyping] = useState(false)
  /** Shrunk to a bar, so the whole screen is free while the call goes on. */
  const [small, setSmall] = useState(false)
  const [seconds, setSeconds] = useState(0)
  /** The language model on this device, when one is running. Without it the doctor uses its built-in answers. */
  const [model, setModel] = useState<string | null>(null)

  const voiceOn = useRef(false)
  const phaseNow = useRef<Phase>('calling')
  const recognition = useRef<Recognition | null>(null)
  /** Goes up each time speech is started or stopped, so callbacks from an older utterance do nothing. */
  const turn = useRef(0)
  const misses = useRef(0)
  const modelNow = useRef<string | null>(null)
  const seesNow = useRef(false)
  const mutedNow = useRef(false)
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
  /** The step that was last read out, so a step is said once however it was reached. */
  const lastGuide = useRef('')
  /** The reading the last measuring procedure was for, so a bare number said afterwards counts for it. */
  const measured = useRef<IndicatorKey | undefined>(undefined)

  const go = (p: Phase) => { phaseNow.current = p; setPhase(p) }

  const stopListening = () => {
    const r = recognition.current
    recognition.current = null
    if (r) { r.onend = null; r.onresult = null; r.onerror = null; r.abort() }
    setHearing('')
  }

  const listen = useCallback(() => {
    const Rec = recognitionClass()
    if (!Rec || !voiceOn.current || mutedNow.current) { go('idle'); return }
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
    u.rate = SPEECH_RATE
    u.pitch = 1
    const done = () => { if (turn.current !== mine) return; q.done++; settle() }
    u.onend = done
    u.onerror = done
    q.queued++
    go('speaking')
    synth.speak(u)
  }
  const speakEnd = () => { speech.current.closed = true; settle() }
  const speak = (text: string) => { speakBegin(); sentences(text).forEach(sayPart); speakEnd() }

  /** Says something the doctor decided itself, outside the usual question and answer. */
  const announce = (text: string, note?: string, choices?: Choice[]) => {
    asking.current?.abort()
    setLines((ls) => [...ls, { id: nextId.current++, from: 'doctor', text, note, choices }])
    if (voiceOn.current) speak(text)
    else go('idle')
  }

  const todo = tasks.filter((t) => !finished.includes(t.id) && !dropped.includes(t.id))
  /** Starts a procedure in the call, where each step is acted out, and reads its first step. When quiet, the words are returned for the caller to say. */
  const startProcedure = (id: string, quiet = false): Did | undefined => {
    const p = allProcedures(state, viewer).find((x) => x.id === id) ?? tasks.find((x) => x.id === id)
    if (!p || !p.steps.length) return undefined
    if (!tasks.some((t) => t.id === p.id)) setTasks((ts) => [p, ...ts])
    setFinished((f) => f.filter((x) => x !== p.id))
    setDropped((d) => d.filter((x) => topicOf(x) !== topicOf(p.id)))
    if (p.id.startsWith('measure-')) measured.current = p.id.slice(8) as IndicatorKey
    setProc(p)
    lastGuide.current = `${p.id}:0`
    setGuide({ id: p.id, at: 0 })
    const said = {
      steps: p.steps,
      text: `${p.title}, ${p.steps.length === 1 ? 'one step' : `${p.steps.length} steps`}. ${stepLine(p.steps, 0)}`,
      note: `Going through: ${p.kind === 'measure' ? `how to measure ${p.title.toLowerCase()}` : p.title}`,
    }
    if (!quiet) announce(said.text, said.note)
    return said
  }
  const finishProcedure = (quiet = false): Did | undefined => {
    if (!proc) return undefined
    const next = todo.find((t) => t.id !== proc.id)
    setFinished((f) => [...f, proc.id])
    setProc(null)
    setGuide(null)
    lastGuide.current = ''
    const said = {
      steps: proc.steps,
      text: `${proc.title} is done.${proc.kind === 'measure' && proc.button ? ' Tell me the result, or enter it on screen.' : ''}${next ? ` Next: ${next.kind === 'measure' ? `measuring ${next.title.toLowerCase()}` : next.title}. Say start when you are ready.` : ''}`,
      note: `Done: ${proc.title}`,
    }
    if (!quiet) announce(said.text, said.note)
    return said
  }
  /** Moves to a step because the model judged the earlier ones done. The words are returned for the caller to say. */
  const stepQuietly = (n: number): Did | undefined => {
    if (!proc) return undefined
    if (n >= proc.steps.length) return finishProcedure(true)
    const to = Math.max(0, n)
    lastGuide.current = `${proc.id}:${to}`
    setGuide({ id: proc.id, at: to })
    return { steps: proc.steps, text: stepLine(proc.steps, to), note: `${proc.title}: step ${to + 1} of ${proc.steps.length}` }
  }
  const stopProcedure = () => {
    setProc(null)
    setGuide(null)
    lastGuide.current = ''
    announce('Stopped. Say start when you want to go on.', `Stopped: ${proc?.title ?? 'procedure'}`)
  }
  /**
   * Puts aside what the person does not want: its procedure is closed if it is open, the call stops being
   * about it, and it leaves the doctor's list. Says what was closed, and what to say when no model words it.
   */
  const discard = (ids: string[]) => {
    const topics = new Set(ids.map(topicOf))
    const gone = [...tasks, ...allProcedures(state, viewer)].filter((p) => topics.has(topicOf(p.id)))
    const name = (gone[0]?.title ?? proc?.title ?? 'that').toLowerCase()
    const closed = !!proc && topics.has(topicOf(proc.id))
    const unfocused = !!focus && ((!!focus.key && topics.has(focus.key)) || gone.some((p) => focus.title.includes(p.title.toLowerCase())))
    setDropped((d) => [...new Set([...d, ...ids, ...gone.map((p) => p.id)])])
    if (closed) { setProc(null); setGuide(null); lastGuide.current = '' }
    if (unfocused) { setFocus(undefined); step.current = 0 }
    if (measured.current && topics.has(measured.current)) measured.current = undefined
    return { closed, unfocused, ids: [...new Set([...ids, ...gone.map((p) => p.id)])], name, text: `All right, we will leave ${name}. What would you like to talk about instead?`, note: `Left out: ${gone[0]?.title ?? proc?.title ?? 'procedure'}` }
  }
  const at = proc && guide?.id === proc.id ? Math.min(guide.at, proc.steps.length - 1) : 0
  const moveTo = (n: number) => {
    if (!proc) return
    if (n >= proc.steps.length) finishProcedure()
    else setGuide({ id: proc.id, at: Math.max(0, n) })
  }
  // A step reached any way, by voice, in this panel, or on the procedure screen, is read out once.
  useEffect(() => {
    if (!proc || guide?.id !== proc.id) return
    const tag = `${guide.id}:${guide.at}`
    if (lastGuide.current === tag) return
    lastGuide.current = tag
    announce(stepLine(proc.steps, Math.min(guide.at, proc.steps.length - 1)), `${proc.title}: step ${Math.min(guide.at, proc.steps.length - 1) + 1} of ${proc.steps.length}`)
  }, [guide, proc])
  // Someone pressed "Go through it with the doctor" on a procedure.
  useEffect(() => {
    if (!wanted || phase === 'calling') return
    askFor(null)
    startProcedure(wanted)
  }, [wanted, phase])

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

  /**
   * Answers what the person said. With `hidden`, the text is an instruction to the model that the person never
   * sees, used to have the model open the call in its own words; `fallback` is what is said if the model cannot.
   */
  const send = (text: string, opts: { hidden?: boolean; focus?: typeof focus; fallback?: DoctorReply & { choices?: Choice[] }; extra?: Choice[]; note?: string; talkOnly?: boolean } = {}) => {
    asking.current?.abort()
    const urgent = !opts.hidden && isUrgent(text)
    // A reading said aloud in a call about that reading is saved, and everything after it uses the new state.
    const heard = urgent || opts.hidden ? undefined : heardReading(text, measured.current ?? focus?.key)
    const lastDoctor = [...lines].reverse().find((l) => l.from === 'doctor')?.text ?? ''
    const known = [...tasks, ...allProcedures(state, viewer)]
    // Turning something down is acted on by the app, so its procedure never stays on screen. With nothing named, it is the one in hand or just offered.
    const refused = urgent || heard || opts.hidden ? [] : declined(text, known, proc?.id ?? (/\b(say start|shall we|ready to|go through|walk you through|take you through|want me to|would you like)\b/i.test(lastDoctor) ? todo[0]?.id : undefined))
    const left = refused.length ? discard(refused) : undefined
    if (left && !modelNow.current) {
      setLines((ls) => [...ls, { id: nextId.current++, from: 'you', text }])
      announce(left.text, left.note)
      return
    }
    // What is still open after that: the state itself only changes on the next render.
    const procNow = left?.closed ? null : proc
    const focusNow = left?.unfocused ? undefined : opts.focus ?? focus
    const todoNow = left ? todo.filter((t) => !left.ids.includes(t.id)) : todo
    const droppedNow = left ? [...new Set([...dropped, ...left.ids])] : dropped
    if (!urgent && !heard && !left && !opts.hidden) {
      // Going through a procedure is done by the app, not the model, so a step is never skipped or reworded.
      const command = proc ? guideCommand(text) : undefined
      // A plain yes to the doctor's offer to go through something starts the next thing it means to do.
      const offered = !proc && guideCommand(text) === 'next' && /\b(say start|shall we|ready to|go through|walk you through|take you through|want me to|would you like)\b/i.test([...lines].reverse().find((l) => l.from === 'doctor')?.text ?? '')
      const asked = command ? undefined : offered ? (todo[0] ?? tasks[0])?.id : wantsProcedure(text, [...tasks, ...allProcedures(state, viewer)], todo.find((t) => t.id !== proc?.id)?.id ?? (proc ? undefined : tasks[0]?.id))
      if (command || asked) {
        asking.current?.abort()
        setLines((ls) => [...ls, { id: nextId.current++, from: 'you', text }])
        if (asked) startProcedure(asked)
        else if (command === 'next') moveTo(at + 1)
        else if (command === 'back') { if (at > 0) moveTo(at - 1); else if (proc) announce(stepLine(proc.steps, 0)) }
        else if (command === 'repeat' && proc) announce(stepLine(proc.steps, at))
        else if (command === 'stop') stopProcedure()
        return
      }
    }
    let current = state
    let note: string | undefined = left?.note
    if (heard) {
      const added = withReading(state, viewer, heard.key, heard)
      current = added.state
      dispatch({ type: 'reading', personId: viewer.id, key: heard.key, reading: added.reading })
      note = `Saved: ${INDICATORS[heard.key].name} ${formatValue(heard.key, heard)} ${INDICATORS[heard.key].unit}`
    }
    const general = reply(current, viewer, text)
    // The built-in doctor: judge a new reading; otherwise answer what was said, or give the next step of a focused call.
    const rule: DoctorReply & { choices?: Choice[] } = opts.fallback ? opts.fallback
      : urgent ? general
      : left ? { text: left.text }
      : heard ? afterReading(current, viewer, heard.key)
      : !focusNow || general.status !== undefined || general.actions ? general
      : nextStep(focusNow, ++step.current)
    const you: Line = { id: nextId.current++, from: 'you', text, note }
    const using = modelNow.current
    // Urgent words always get the fixed answer. So does everything when no model is running.
    if (!using || urgent) {
      setLines((ls) => [...ls, ...(opts.hidden ? [] : [you]), { id: nextId.current++, from: 'doctor', ...rule, choices: rule.choices ?? (rule.ask === 'where' ? WHERE : undefined) }])
      if (voiceOn.current) speak(rule.text)
      return
    }
    const lastSaid = [...lines].reverse().find((l) => l.from === 'doctor')?.text
    const picture = seesNow.current && wantsLook(text, lastSaid) ? snapshot() : undefined
    if (picture) you.note = [you.note, 'Sent with a picture from your camera'].filter(Boolean).join(' · ')

    const id = nextId.current++
    const write = (t: string) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, text: t } : l)))
    const messages: ChatMessage[] = [
      { role: 'system', content: briefing(current, viewer, { focus: focusNow, camera: picture ? 'picture' : streamNow.current && seesNow.current ? 'on' : 'off', note: [
        heard && note ? `They have just told you a new reading in this message. ${note}. It is already in the readings above with its status.` : '',
        left ? `They have just said they do not want to deal with ${left.name}, and the app has put it aside. Say in a few words that you will leave it, then go on from whatever else they said, or ask what they would like to talk about instead.` : '',
        opts.note ?? '',
        droppedNow.length ? `They do not want these in this call: ${droppedNow.join(', ')}. Do not start them, and do not bring them up or advise on them again unless they ask.` : '',
        procNow
          ? `You are going through the procedure "${procNow.title}" with them, and each step is shown to them in the call. They are on step ${at + 1} of ${procNow.steps.length}: "${procNow.steps[at]}" All its steps: ${procNow.steps.map((x, n) => `${n + 1}. ${x}`).join(' ')} You move through it for them. If what they just said shows this step is done, acknowledge it in a few words and end your answer with [[next]]. If it shows later steps are done too, end with [[step:N]], where N is the first step still to do. If it shows the whole procedure is done, end with [[finish]]. Example: they say "I am lying down and I had some water", you answer "Good. [[next]]". The app then reads the next step aloud, so never read out steps yourself. If they only ask a question about the step, answer it in one sentence with no tag. If they say they do not want to do this or talk about it, do not argue: say you will leave it, ask what they want instead, and end your answer with [[drop]]. The app then closes the procedure.`
          : `Procedures you can go through with them, as id: name: ${allProcedures(current, viewer).filter((x) => !droppedNow.includes(x.id)).map((x) => `${x.id}: ${x.kind === 'measure' ? `how to measure ${x.title.toLowerCase()}` : x.title} (${x.steps.length} steps)`).join('; ')}.${todoNow.length ? ` The ones their readings call for today: ${todoNow.map((t) => t.id).join(', ')}.` : ''} You cannot read steps out yourself: the app does that when you end your answer with [[start:ID]], using an id from this list. Most answers have no tag. Start a procedure only when they have told you a problem that this procedure deals with, or asked for it, or said yes to your offer of it. Never start one before they have said what is wrong, never because it is on the list, and never in an answer that asks them a question: ask first, and start it in a later answer. If what they describe fits none of these, help by talking and use no tag. When you do start one, say in one short sentence what you will go through with them and end with the tag. Example: you offered to go through one and they say "Yes, let us do that", you answer "Good, we will go through it now. [[start:ID]]" with its real id. The app then shows the procedure and reads its first step aloud. If they say they do not want to deal with one of these, end your answer with [[drop:ID]] instead and move on to what they do want.`,
      ].filter(Boolean).join(' ') || undefined }) },
      ...(opts.hidden ? [] : lines.slice(-10)).filter((l) => l.text).map((l): ChatMessage => ({ role: l.from === 'doctor' ? 'assistant' : 'user', content: l.text })),
      { role: 'user', content: text, images: picture ? [picture] : undefined },
    ]
    setLines((ls) => [...(opts.hidden ? [] : [...ls, you]), { id, from: 'doctor', text: '', status: rule.status, actions: focusNow || left || opts.hidden ? undefined : general.actions }])
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
      setLines((ls) => ls.map((l) => (l.id === id ? { ...l, text: rule.text, choices: rule.choices } : l)))
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
    }, ctl.signal, opts.hidden ? 0.9 : undefined).then(() => {
      let clean = tidy(full).trimEnd()
      const tag = turn.current === mine && !opts.hidden ? ACT_TAG.exec(full) : null
      const act = tag?.[1].toLowerCase()
      // The model decided to act: start a procedure, move on in the one in hand, or close it. What follows is added to what is being said.
      const dropping = act === 'drop' ? (tag?.[2] && known.some((p) => p.id === tag[2]) ? [tag[2]] : procNow ? [procNow.id] : []) : []
      const put = dropping.length ? discard(dropping) : undefined
      // A procedure is not started on a turn that is only for asking, or in an answer that asks the person something: they have not said yet what it is.
      const mayStart = !opts.talkOnly && !/\?\s*$/.test(clean)
      const started = !tag || act === 'drop' ? undefined
        : act === 'start' ? (mayStart && tag[2] && !droppedNow.includes(tag[2]) ? startProcedure(tag[2], true) : undefined)
        : !procNow ? undefined
        : act === 'next' ? stepQuietly(at + 1)
        : act === 'step' ? (Number(tag[2]) > at + 1 ? stepQuietly(Number(tag[2]) - 1) : undefined)
        : finishProcedure(true)
      if (started) {
        // A small model sometimes recites the steps anyway. The app reads them, so those sentences are dropped.
        const plain = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
        const known = plain(started.steps.join(' '))
        const own = sentences(clean).filter((x) => !known.includes(plain(x))).join(' ')
        clean = `${own} ${started.text}`.trim()
      }
      if (!clean && put) clean = put.text
      if (!clean) { fallBack(); return }
      // A label needs a real word in it: a small model sometimes echoes a placeholder such as A | B | C.
      const fromModel = OPTIONS_TAG.exec(full)?.[1].split('|').map((x) => x.replace(/[*_#`"]/g, '').trim()).filter((x) => x.length <= 32 && /[a-z]{2}/i.test(x)).slice(0, 4).map((label): Choice => ({ label })) ?? []
      // Answers that come from the person's own data, such as the problems their readings point to, go first.
      const offered = started ? undefined : [...(opts.extra ?? []), ...fromModel].filter((c, n, all) => all.findIndex((x) => x.label.toLowerCase() === c.label.toLowerCase()) === n).slice(0, 6)
      setLines((ls) => ls.map((l) => (l.id === id ? { ...l, text: clean, note: started?.note ?? put?.note, choices: offered?.length ? offered : undefined } : l)))
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

  // Ring for a moment, then connect: the doctor starts talking and the camera comes on.
  const connect = useRef(() => {})
  connect.current = () => {
    void cameraStart()
    const first = lines[0]
    // Without a model the call opens with the built-in words. With one, the model opens it itself, so no two calls start alike.
    if (!modelNow.current || !first) { voiceStart(); return }
    voiceOn.current = true
    misses.current = 0
    setVoice(true)
    setNotice(recognitionClass() ? '' : 'This browser cannot listen, so I will speak and you can type.')
    const name = viewer.name.split(' ')[0]
    send(focus
      ? `[The call has just connected and they have not spoken yet. Open it yourself, in your own words and not the way you would open any other call. Greet ${name} in two or three words, say in one sentence why you are calling, going by what this call was opened about, then ask one question about how they are or what they notice. End with three or four likely answers to your question, in their words, such as [[options: Dizzy | Tired | Nothing unusual]] for a question about what they notice.]`
      : `[The call has just connected and they have not spoken yet. Open it yourself, in your own words and not the way you would open any other call. Greet ${name} in two or three words and ask what is wrong or what they need, in one short sentence. Do not mention any reading or finding yet, and give no options.]`,
    { hidden: true, fallback: first, extra: focus ? undefined : first.choices })
  }
  useEffect(() => {
    const id = window.setTimeout(() => connect.current(), 1800)
    return () => window.clearTimeout(id)
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])

  const calling = phase === 'calling'
  useEffect(() => {
    if (calling) return
    const id = window.setInterval(() => setSeconds((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [calling])
  const toggleMute = () => {
    const next = !muted
    mutedNow.current = next
    setMuted(next)
    if (next) { stopListening(); if (phaseNow.current === 'listening') go('idle') }
    else if (phaseNow.current === 'idle') { misses.current = 0; listen() }
  }
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const lastLine = lines[lines.length - 1]
  const saved = [...lines].reverse().find((l) => l.from === 'you')?.note
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    send(text)
  }
  const spoken = [...lines].reverse().find((l) => l.from === 'doctor')
  /** Answers to tap, while the doctor's last words are still the latest thing said. */
  const choices = lastLine?.from === 'doctor' && !proc && phase !== 'thinking' ? lastLine.choices : undefined
  const choose = (c: Choice) => {
    if (c.start) { startProcedure(c.start); return }
    if (c.other && modelNow.current) {
      // "Something else" says only what it is not. The model asks what it is, and nothing is started on this turn.
      const not = (lastLine?.choices ?? []).filter((x) => x.about).map((x) => x.label.toLowerCase())
      send(c.label, {
        talkOnly: true,
        extra: WHERE,
        fallback: { text: 'Where is it?', choices: WHERE },
        note: `They tapped "Something else"${not.length ? `, so it is not ${not.join(' or ')}: do not bring ${not.length === 1 ? 'that' : 'those'} up` : ''}. They have not said what it is yet. Ask where the trouble is or what they notice, in one short question. Start no procedure and give no options: the app offers the parts of the body to tap.`,
      })
      return
    }
    if (c.other) {
      setLines((ls) => [...ls, { id: nextId.current++, from: 'you', text: c.label }])
      announce('Where is it?', undefined, WHERE)
      return
    }
    const f = c.about ? focusOn(state, viewer, c.about) : undefined
    if (!f) { send(c.say ?? c.label); return }
    // A problem was picked: the call is about it from here on, and the doctor leads with what it found.
    setFocus(f)
    step.current = 0
    if (modelNow.current) { send(`It is ${f.title}.`, { focus: f }); return }
    setLines((ls) => [...ls, { id: nextId.current++, from: 'you', text: c.label }])
    announce(`${f.finding} ${f.steps[0]}`, `This call is about ${f.title}`, FEEL)
  }

  const status = calling ? 'Calling…'
    : phase === 'speaking' ? 'Speaking'
    : phase === 'thinking' ? 'Thinking…'
    : phase === 'listening' ? 'Listening'
    : muted ? 'You are muted' : 'Connected'

  return (
    <div className={`doctor-backdrop ${small ? 'is-small' : ''}`}>
      <div className={`doctor-call is-${phase} ${small ? 'is-small' : ''}`} role="dialog" aria-modal={!small} aria-label="Call with the doctor">
        <header className="doctor-call-head">
          <span><i className="doctor-live" aria-hidden="true" />ORBIT doctor <em>Simulated</em></span>
          <span className="doctor-clock">{calling ? '' : clock}</span>
          <button className="doctor-size" aria-expanded={!small} aria-label={small ? 'Expand the call' : 'Minimise the call'} title={small ? 'Expand' : 'Minimise'} onClick={() => setSmall((s) => !s)}>
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d={small ? 'M3 9l4-4 4 4' : 'M3 5l4 4 4-4'} /></svg>
          </button>
        </header>

        {stream && (
          <div className="doctor-self">
            <video ref={video} autoPlay muted playsInline aria-label="Your camera" />
          </div>
        )}

        <div className="doctor-face">
          {proc && !calling
            ? <div className="doctor-scene"><Astronaut key={`${proc.id}:${at}`} scene={sceneFor(proc.steps[at])} size={190} /></div>
            : <div className="doctor-avatar" aria-hidden="true"><Mark size={52} /></div>}
          <p className="doctor-phase" role="status">{status}</p>
        </div>

        <div className="doctor-words" aria-live="polite">
          {calling
            ? <p className="doctor-caption is-quiet">{focus ? `About ${focus.title}` : 'Connecting you now'}</p>
            : <>
                {lastLine?.from === 'you' && <p className="doctor-said">{lastLine.text}</p>}
                {spoken && <p className={`doctor-caption ${spoken.urgent ? 'is-urgent' : ''}`}>{spoken.text || '…'}</p>}
                {hearing && <p className="doctor-said">{hearing}</p>}
                {spoken?.note && <p className="doctor-saved is-did">{spoken.note}</p>}
                {saved && !hearing && <p className="doctor-saved">{saved}</p>}
              </>}
          <span ref={end} aria-hidden="true" />
        </div>

        {choices && !calling && (
          <div className="doctor-choices" role="group" aria-label="Answers you can tap">
            {choices.map((c) => <button key={c.label} onClick={() => choose(c)}>{c.label}</button>)}
          </div>
        )}

        {proc && !calling && (
          <div className="doctor-guide" role="group" aria-label={`${proc.title}, step ${at + 1} of ${proc.steps.length}`}>
            <div className="doctor-guide-bar" aria-hidden="true">{proc.steps.map((s, n) => <i key={s + n} className={n < at ? 'is-done' : n === at ? 'is-now' : ''} />)}</div>
            <button className="doctor-guide-next" onClick={() => moveTo(at + 1)}>{at === proc.steps.length - 1 ? 'Done, finish' : `Done, next step (${at + 2} of ${proc.steps.length})`}</button>
          </div>
        )}

        {notice && <p className="doctor-notice" role="alert">{notice}</p>}

        {typing && !calling && (
          <form className="doctor-form" onSubmit={submit}>
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type instead of speaking" aria-label="Message to the doctor" />
            <button className="btn btn-primary" type="submit" disabled={!draft.trim()}>Send</button>
          </form>
        )}

        <div className="doctor-controls">
          <button className="doctor-round" aria-pressed={muted} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} title={muted ? 'Unmute' : 'Mute'} disabled={calling} onClick={toggleMute}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />{muted && <path d="M4 4l16 16" />}</svg>
          </button>
          <button className="doctor-round" aria-pressed={!stream} aria-label={stream ? 'Turn camera off' : 'Turn camera on'} title={stream ? 'Camera off' : 'Camera on'} disabled={calling} onClick={stream ? cameraStop : () => void cameraStart()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6.5" width="12" height="11" rx="2.5" /><path d="m15 10.5 6-3v9l-6-3" />{!stream && <path d="M4 4l16 16" />}</svg>
          </button>
          <button className="doctor-round" aria-pressed={typing} aria-label="Type a message" title="Type" disabled={calling} onClick={() => setTyping((t) => !t)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9" /></svg>
          </button>
          <button className="doctor-round doctor-end" aria-label="End call" title="End call" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 13.5c5-4.5 12-4.5 17 0l-2.2 2.6-3.1-1.3v-2.4a9 9 0 0 0-6.4 0v2.4l-3.1 1.3Z" /></svg>
          </button>
        </div>
        <p className="doctor-fine">{model ? 'Runs on this device. Not a real clinician.' : 'Not a real clinician.'}{stream && sees ? ' Show something to the camera and ask it to look.' : ''}</p>
      </div>
    </div>
  )
}
