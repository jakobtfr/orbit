import { CREW } from '../data/demo'
import { age } from './format'
import { afterReading, heardReading, isUrgent, reply, speakable } from './doctor'
import { actionFor, attention, now } from './judge'
import { ARRIVAL_DAY } from './mission'
import type { AppState, IndicatorKey, Person, Reading } from './types'

/**
 * The family call. People on Earth who opted in record a message each day. A live call is not
 * possible at Mars distance, so ORBIT plays the recordings as a call in the astronaut's off-duty time.
 *
 * Three voices, always labelled: the person's real recording, an AI voice that only links the
 * recordings, and ORBIT. Every health sentence is ORBIT's: it is taken word for word from the fixed
 * rules in judge.ts. The language model never writes one.
 */

export interface FamilyMember {
  id: string
  name: string
  relation: string
  /** What this person agreed to, shown in the app. */
  consent: string
  /** The date they agreed. */
  since: string
}

export type Topic = 'hello' | 'day' | 'story' | 'care' | 'bye'

/** One recorded piece of a message. The call plays these; it never rewrites them. */
export interface Part {
  topic: Topic
  text: string
  audio?: string
  /** True when the audio is not the person's recording but AI-generated speech standing in for it, as in the demo. */
  standIn?: boolean
}

export interface EarthMessage {
  id: string
  from: string
  /** When it was recorded on Earth, in mission days. */
  recorded: number
  parts: Part[]
}

const CONSENT = 'Agreed to record daily messages and to an AI voice that links them. Every call is labelled AI.'

/** The demo astronaut's people. Invented, like the astronaut. */
export const FAMILY: FamilyMember[] = [
  { id: 'marta', name: 'Marta Brandt', relation: 'Mother', consent: CONSENT, since: '12 days before launch' },
  { id: 'jonas', name: 'Jonas Brandt', relation: 'Brother', consent: CONSENT, since: '12 days before launch' },
  { id: 'priya', name: 'Priya Nair', relation: 'Friend and colleague', consent: CONSENT, since: '9 days before launch' },
]

const at = (day: number, hour: number, minute = 0) => day + (hour * 60 + minute) / 1440

/**
 * Demo messages for the day the app opens on (mission day 100, 08:15 on board). The people are invented,
 * so their audio is AI-generated speech standing in for a recording, and the call says so.
 */
const DEMO: EarthMessage[] = [
  {
    id: 'marta-100', from: 'marta', recorded: at(100, 7, 28),
    parts: [
      { topic: 'hello', audio: 'family/marta-100-hello.m4a', text: 'Good morning, Lena. It is me. I am sitting in the kitchen with your coffee cup, the blue one. I use it now, I hope that is all right.' },
      { topic: 'day', audio: 'family/marta-100-day.m4a', text: 'Yesterday I picked the last apples from the tree behind the house. Your father says there are too many, and then he eats four.' },
      { topic: 'story', audio: 'family/marta-100-story.m4a', text: 'Do you remember the night we slept in the garden to count shooting stars? You counted eleven. I think about that when I look up now.' },
      { topic: 'care', audio: 'family/marta-100-care.m4a', text: 'Look after yourself up there. Do the small things, even the boring ones. I want you back just as you left.' },
      { topic: 'bye', audio: 'family/marta-100-bye.m4a', text: 'I will record again tomorrow morning. I love you. Goodbye for now.' },
    ],
  },
  {
    id: 'jonas-100', from: 'jonas', recorded: at(99, 21, 40),
    parts: [
      { topic: 'hello', audio: 'family/jonas-100-hello.m4a', text: 'Hey Lena, Jonas here. The kids drew your ship again. This time it has six windows and a dog.' },
      { topic: 'day', audio: 'family/jonas-100-day.m4a', text: 'I finally fixed your old bike. It is waiting in the garage for when you are back.' },
      { topic: 'bye', audio: 'family/jonas-100-bye.m4a', text: 'Talk tomorrow. Well, you know what I mean. Bye.' },
    ],
  },
  {
    id: 'priya-100', from: 'priya', recorded: at(99, 18, 5),
    parts: [
      { topic: 'hello', audio: 'family/priya-100-hello.m4a', text: 'Lena, it is Priya. The whole simulator team watched your docking replay at lunch. Nobody touched their food.' },
      { topic: 'story', audio: 'family/priya-100-story.m4a', text: 'Your desk plant is alive. I am as surprised as you are.' },
      { topic: 'bye', audio: 'family/priya-100-bye.m4a', text: 'More tomorrow. Fly safe.' },
    ],
  },
]

export const MESSAGES: EarthMessage[] = DEMO.map((m) => ({ ...m, parts: m.parts.map((p) => ({ ...p, standIn: true })) }))

/* ---------- when a message can be heard ---------- */

/**
 * NASA gives about 4 minutes one way at Mars' closest approach and around 24 at its farthest
 * ("Space Communications: 7 Things You Need to Know", nasa.gov, 2020). Other NASA papers give 20 to 22 as the most.
 */
export const DELAY_MIN = 4
export const DELAY_MAX = 24
const SYNODIC_DAYS = 780

/**
 * One-way signal time in minutes for a mission day. Illustrative, not an ephemeris: it grows from
 * zero at launch to the Mars value on arrival, then follows the Earth to Mars distance over one
 * 780-day cycle, always inside NASA's 4 to 24 minutes.
 */
export function signalDelayMin(day: number): number {
  const mars = (d: number) => {
    const mid = (DELAY_MIN + DELAY_MAX) / 2
    const half = (DELAY_MAX - DELAY_MIN) / 2
    return mid + half * Math.sin((2 * Math.PI * (d - ARRIVAL_DAY)) / SYNODIC_DAYS)
  }
  if (day <= 0) return 0
  const v = day < ARRIVAL_DAY ? (day / ARRIVAL_DAY) * mars(ARRIVAL_DAY) : mars(day)
  return Math.round(v * 10) / 10
}

/** Who has opted in. A message is only ever shown when both the astronaut and its sender have. */
export interface OptIn { astronaut: boolean; people: Record<string, boolean> }

export const OPT_IN_DEFAULT: OptIn = { astronaut: true, people: Object.fromEntries(FAMILY.map((f) => [f.id, true])) }

/** The messages that have reached the ship and that both sides agreed to, newest first. */
export function arrived(state: AppState, messages: EarthMessage[], optIn: OptIn): EarthMessage[] {
  if (!optIn.astronaut) return []
  const t = now(state)
  const delay = signalDelayMin(state.day) / 1440
  return messages
    .filter((m) => optIn.people[m.from] && m.recorded + delay <= t && t - m.recorded <= 1.5)
    .sort((a, b) => b.recorded - a.recorded)
}

export function recordedLabel(state: AppState, message: EarthMessage): string {
  return `Message from Earth, recorded ${age(now(state), message.recorded)}`
}

/** Personal time on board: after waking and before sleep. Calls are offered only then. */
export function offDuty(t: number): boolean {
  const hour = (t - Math.floor(t)) * 24
  return (hour >= 6 && hour < 8.5) || (hour >= 19.5 && hour < 21.5)
}

export function memberOf(message: EarthMessage): FamilyMember {
  return FAMILY.find((f) => f.id === message.from) ?? FAMILY[0]
}

/* ---------- what is said in a call ---------- */

export type SegmentLabel = 'Recorded on Earth' | 'AI voice' | 'ORBIT'

export interface Segment {
  /** recorded: the person's own words. link: fixed joining words in the AI voice. health: an ORBIT rule, word for word. */
  kind: 'recorded' | 'link' | 'health'
  label: SegmentLabel
  text: string
  audio?: string
  /** A recorded part whose audio is an AI-generated stand-in. */
  standIn?: boolean
  /** The reading a health sentence is about. */
  key?: IndicatorKey
}

const firstName = (name: string) => name.split(' ')[0]
const isOff = (s: string) => s === 'warning' || s === 'caution'

/** The one finding a call passes on: the most serious reading that is off. */
function finding(state: AppState, person: Person) {
  const item = attention(state, person).find((i) => i.kind === 'indicator' && isOff(i.status))
  return item ? { item, action: actionFor(state, person, item) } : undefined
}

/** Every sentence ORBIT's rules give for this person now. A health segment must be one of these. */
export function healthTexts(state: AppState, person: Person): string[] {
  return attention(state, person).flatMap((i) => { const a = actionFor(state, person, i); return [a.observed, a.next] })
}

/** Fixed joining words. They carry no health content; the finding itself follows in ORBIT's words. */
export const LINK = {
  handOver: 'One thing before the next message. ORBIT asked to say this to you in its own words.',
  ask: 'When you have taken it, tell me the numbers. Then we go on.',
}

/** The call as it opens: the person's greeting as recorded, then the one thing ORBIT wants said. */
export function callScript(state: AppState, person: Person, message: EarthMessage): Segment[] {
  const hello = message.parts[0]
  const out: Segment[] = [{ kind: 'recorded', label: 'Recorded on Earth', text: hello.text, audio: hello.audio, standIn: hello.standIn }]
  const f = finding(state, person)
  if (!f) return out
  out.push({ kind: 'link', label: 'AI voice', text: LINK.handOver })
  out.push({ kind: 'health', label: 'ORBIT', text: f.action.observed, key: f.item.key })
  out.push({ kind: 'health', label: 'ORBIT', text: f.action.next, key: f.item.key })
  out.push({ kind: 'link', label: 'AI voice', text: LINK.ask })
  return out
}

export interface Turn {
  kind: 'escalate' | 'reading' | 'nudge' | 'recorded' | 'smalltalk'
  segments: Segment[]
  /** The role-play is over: the call shows ORBIT only and points to a person. */
  endsRolePlay?: boolean
  /** The state with the new reading in it. */
  state?: AppState
  reading?: Reading
  saved?: { key: IndicatorKey; v: number; v2?: number }
  /** The recorded part that was played. */
  topic?: Topic
}

export interface CallContext {
  member: FamilyMember
  message: EarthMessage
  /** Recorded parts already played in this call. */
  played: Topic[]
  /** The reading the health part was about, so a bare number counts for it. */
  focus?: IndicatorKey
}

const FINE = /\b(i'?m|i am|i feel|feeling|doing) (fine|good|great|ok|okay|well|alright|all right)\b|^(fine|good|great|ok|okay|all good|not bad)\b|\b(do not|don'?t) (worry|need)\b|\b(later|not now|tomorrow)\b/

const WANTS: [RegExp, Topic][] = [
  [/\b(your day|today|yesterday|what did you|what have you|how are you|how is everyone|how was)\b/, 'day'],
  [/\b(remember|story|tell me (about|more|something)|when i was|miss)\b/, 'story'],
  [/\b(bye|goodbye|good night|goodnight|have to go|talk (soon|tomorrow|later))\b/, 'bye'],
]

/** The recorded part that best answers what was said, among those not played yet. */
export function pickPart(said: string, message: EarthMessage, played: Topic[]): Part | undefined {
  const left = message.parts.filter((p) => !played.includes(p.topic))
  const q = said.toLowerCase()
  const wanted = WANTS.find(([re]) => re.test(q))?.[1]
  return left.find((p) => p.topic === wanted) ?? left.find((p) => p.topic !== 'bye') ?? left[0]
}

function medicalLead(): string {
  return CREW.find((c) => /medical lead/i.test(c.role))?.name ?? 'the medical lead'
}

/** What happens after the astronaut says something in a family call. Nothing here comes from a language model. */
export function familyTurn(state: AppState, person: Person, said: string, ctx: CallContext): Turn {
  if (isUrgent(said)) {
    return { kind: 'escalate', endsRolePlay: true, segments: [{ kind: 'health', label: 'ORBIT', text: reply(state, person, said).text }] }
  }
  const heard = heardReading(said, ctx.focus)
  if (heard) {
    const reading: Reading = { t: now(state), v: heard.v, v2: heard.v2, activity: 'rest', source: 'Told in a family call', provenance: 'SELF-REPORTED' }
    const mine = state.readings[person.id] ?? {}
    const next: AppState = { ...state, readings: { ...state.readings, [person.id]: { ...mine, [heard.key]: [...(mine[heard.key] ?? []), reading] } } }
    return {
      kind: 'reading',
      state: next,
      reading,
      saved: { key: heard.key, v: heard.v, ...(heard.v2 !== undefined ? { v2: heard.v2 } : {}) },
      segments: [{ kind: 'health', label: 'ORBIT', text: afterReading(next, person, heard.key).text, key: heard.key }],
    }
  }
  const f = finding(state, person)
  if (f && ctx.focus && FINE.test(said.toLowerCase().trim())) {
    return {
      kind: 'nudge',
      segments: [
        { kind: 'link', label: 'AI voice', text: NUDGE },
        { kind: 'health', label: 'ORBIT', text: f.action.next, key: f.item.key },
      ],
    }
  }
  const part = pickPart(said, ctx.message, ctx.played)
  if (part) return { kind: 'recorded', topic: part.topic, segments: [{ kind: 'recorded', label: 'Recorded on Earth', text: part.text, audio: part.audio, standIn: part.standIn }] }
  return { kind: 'smalltalk', segments: [{ kind: 'link', label: 'AI voice', text: noMore(state, ctx.member) }] }
}

export const NUDGE = 'Good to hear. ORBIT goes by the reading, not by how you feel, so it asks again.'

/** Said when every recorded part has been played. */
export function noMore(state: AppState, member: FamilyMember): string {
  const delay = Math.max(1, Math.round(signalDelayMin(state.day)))
  return `That is all ${firstName(member.name)} recorded today. What you just said is saved as your reply and reaches Earth in about ${delay} min.`
}

/* ---------- the language model, when one is running ---------- */

export const SMALL_TALK_FALLBACK = 'I only have what was recorded today. Say anything you like: it goes to Earth as your reply.'

/** Words a family voice must never say on its own: anything about health, and any claim to be the real person. */
const HEALTH_WORDS =
  /\d|blood|pressure|pulse|heart|bpm|oxygen|temperature|fever|reading|measure|symptom|dizz|faint|pain|ache|hurt|sick|ill\b|medic|doctor|pill|aspirin|tablet|drug|dose|diagnos|dehydrat|rest\b|sleep|exercise|radiation|healthy|health|worry about it|medical|treat|cure|\bnot an? ai\b|\bi am (your )?real\b|\bi'?m (your )?real\b|\breally (me|your)\b/i

/** Lets a model's small talk through only when it says nothing about health and does not claim to be real. */
export function safeSmallTalk(text: string): string {
  const clean = text.replace(/\[\[[^\]]*\]\]?/g, '').replace(/[*_#`]/g, '').trim()
  return clean && !HEALTH_WORDS.test(clean) ? clean : SMALL_TALK_FALLBACK
}

/**
 * What the on-device language model is told. It gets the recorded words and nothing about the
 * astronaut's health: no readings, no findings. Its answer still goes through safeSmallTalk.
 */
export function personaBriefing(member: FamilyMember, person: Person, message: EarthMessage): string {
  return [
    `You are an AI stand-in in ORBIT's family call. ${firstName(person.name)}, an astronaut far from Earth, is listening to today's recorded message from ${member.name} (${member.relation.toLowerCase()}). You are not ${firstName(member.name)} and you never claim to be: if asked, say you are an AI that links the recordings.`,
    `Today ${firstName(member.name)} recorded: ${message.parts.map((p) => `"${p.text}"`).join(' ')}`,
    `Your only job: one short, warm sentence, 20 words at most, that reacts to what ${firstName(person.name)} just said, using only things from the recording above. Do not invent news, memories, or promises.`,
    'You never speak about health, the body, readings, medicine, rest, or sleep, and you never give advice. ORBIT says those parts itself. If they bring up health, say only that ORBIT will answer that.',
    `If something sounds serious, say only: tell ${medicalLead()} now.`,
  ].join('\n\n')
}

/* ---------- speech rendered ahead of time ---------- */

/** One line of speech to render to a file: who speaks, the words shown, and the words as a voice should read them. */
export interface VoiceLine { file: string; voice: string; text: string; say: string }

/**
 * Every line of the demo call that can be rendered ahead of time: the demo messages, the fixed linking
 * words, and ORBIT's rule sentences for the demo day. scripts/render_family_voice.py turns this list
 * into audio, and a test keeps the list equal to what the rules say today.
 */
export function voiceLines(state: AppState, person: Person): VoiceLine[] {
  const out: VoiceLine[] = []
  for (const m of MESSAGES) for (const p of m.parts) if (p.audio) out.push({ file: p.audio, voice: m.from, text: p.text, say: speakable(p.text) })
  const fixed: [string, string][] = [['ai', LINK.handOver], ['ai', LINK.ask], ['ai', NUDGE], ['ai', SMALL_TALK_FALLBACK], ...FAMILY.map((f): [string, string] => ['ai', noMore(state, f)])]
  const f = finding(state, person)
  if (f) {
    fixed.push(['orbit', f.action.observed], ['orbit', f.action.next])
    if (f.item.key === 'bp') {
      const after = familyTurn(state, person, 'It is 112 over 70 now', { member: FAMILY[0], message: MESSAGES[0], played: [], focus: 'bp' })
      fixed.push(['orbit', after.segments[0].text])
    }
  }
  fixed.forEach(([voice, text], n) => out.push({ file: `family/${voice}-${String(n + 1).padStart(2, '0')}.m4a`, voice, text, say: speakable(text) }))
  return out
}
