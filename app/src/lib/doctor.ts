import { CREW } from '../data/demo'
import { age } from './format'
import { INDICATORS, formatValue } from './indicators'
import { actionFor, attention, judge, now, regionIndicators, type AttentionItem } from './judge'
import type { AppState, IndicatorKey, Person, Reading, RegionKey, StatusKey } from './types'

/**
 * The virtual doctor. It is simulated: every answer is put together on the device from the
 * person's own readings and the prototype rules in judge.ts. It never diagnoses, and anything
 * that sounds urgent is handed to a person.
 */

export interface DoctorReply {
  text: string
  /** Worst status the reply talks about, shown as a shape next to the message. */
  status?: StatusKey
  actions?: { label: string; to: string }[]
  /** The reply tells the person to get a crewmate now. */
  urgent?: boolean
}

export const SUGGESTIONS = ['How are my results?', 'How is my heart?', 'What should I do next?', 'I have a headache']

const AREA: Record<IndicatorKey, string> = {
  hr: 'your chest',
  bp: 'your chest',
  standing: 'your chest',
  spo2: 'your chest',
  temp: 'your temperature',
  weight: 'your weight',
  vision: 'your eyes',
  bone: 'your bones',
  sleep: 'your sleep',
  exercise: 'your exercise',
  radiation: 'your radiation dose',
  cabin: 'the cabin air',
  mood: 'your mood',
}

const SYMPTOM_AREA: Record<RegionKey, string> = {
  head: 'your head',
  chest: 'your chest',
  skin: 'your skin',
  hips: 'your hips and spine',
  whole: 'how you feel',
}

function areaOf(item: AttentionItem): string {
  if (item.kind === 'symptom' && item.region) return SYMPTOM_AREA[item.region]
  return AREA[item.key as IndicatorKey]
}

function firstName(person: Person): string {
  return person.name.split(' ')[0]
}

function medicalLead(): string {
  const lead = CREW.find((c) => /medical lead/i.test(c.role))
  return lead ? `the medical lead, ${lead.name}` : 'the medical lead'
}

const isOff = (s: StatusKey) => s === 'warning' || s === 'caution'

function buttons(state: AppState, person: Person, items: AttentionItem[]): DoctorReply['actions'] {
  const out: NonNullable<DoctorReply['actions']> = []
  for (const item of items) {
    const b = actionFor(state, person, item).button
    if (b && !out.some((o) => o.to === b.to)) out.push(b)
  }
  return out.length ? out.slice(0, 3) : undefined
}

/** The doctor's read of everything, without a greeting. */
export function assessment(state: AppState, person: Person): DoctorReply {
  const items = attention(state, person)
  const off = items.filter((i) => isOff(i.status))
  const minor = items.filter((i) => !isOff(i.status))

  if (!items.length) {
    return {
      status: 'ok',
      text: 'Your results look fine. Everything I can see is in your usual range, and nothing was reported in your check-ins.',
    }
  }

  if (!off.length) {
    const parts = minor.map((i) => actionFor(state, person, i).observed)
    parts[0] = parts[0].charAt(0).toLowerCase() + parts[0].slice(1)
    return {
      status: 'ok',
      text: `Your results look fine. Nothing I can see is outside your usual range. ${minor.length === 1 ? 'One small thing' : 'A few small things'}: ${parts.join(' ')} It is worth sorting out when you have a moment.`,
      actions: buttons(state, person, minor),
    }
  }

  const [first, ...rest] = off
  const a = actionFor(state, person, first)
  const more = rest.length
    ? ` I would also keep an eye on ${[...new Set(rest.map(areaOf))].filter((x) => x !== areaOf(first)).join(' and ') || 'one more reading there'}.`
    : ''
  const lead = first.status === 'warning' ? 'Something is off with' : 'Something seems a little off with'
  return {
    status: first.status,
    text: `${lead} ${areaOf(first)}. ${a.observed} ${a.next}${more}`,
    actions: buttons(state, person, off),
  }
}

/** What the doctor says when the conversation opens. */
export function opening(state: AppState, person: Person): DoctorReply {
  const a = assessment(state, person)
  const ask = a.status === 'ok' ? 'How are you feeling today?' : 'How do you feel right now?'
  return { ...a, text: `Hello ${firstName(person)}. I have looked at your readings for day ${state.day}. ${a.text} ${ask}` }
}

function withUnit(key: IndicatorKey, r: Pick<Reading, 'v' | 'v2'>): string {
  const unit = INDICATORS[key].unit
  return `${formatValue(key, r)}${unit.startsWith('%') ? '' : ' '}${unit}`.trim()
}

/** Heart rate, blood pressure, and blood oxygen in one line, for handing over to a person. */
function vitals(state: AppState, person: Person): string {
  const parts = (['hr', 'bp', 'spo2'] as IndicatorKey[]).flatMap((k) => {
    const latest = judge(state, person, k).latest
    return latest ? [`${INDICATORS[k].name.toLowerCase()} ${withUnit(k, latest)}, ${age(now(state), latest.t)}`] : []
  })
  return parts.length ? `Your latest readings, for them: ${parts.join('; ')}.` : 'There are no recent chest readings to pass on.'
}

/** One indicator in a sentence or two. */
function describe(state: AppState, person: Person, key: IndicatorKey): { text: string; status: StatusKey; item?: AttentionItem } {
  const def = INDICATORS[key]
  const j = judge(state, person, key)
  const lower = def.name.toLowerCase()
  if (j.status === 'unavailable') return { status: j.status, text: `${def.name} is not available here. ${j.reason ?? ''}`.trim() }
  if (!j.latest) {
    return { status: j.status, text: `There is no ${lower} reading yet.`, item: { kind: 'indicator', key, status: j.status, label: def.name } }
  }
  const value = withUnit(key, j.latest)
  const said = `${def.name}: ${value}, ${age(now(state), j.latest.t)}.`
  if (j.status === 'ok') {
    const pre = person.preflight[key]
    const before = pre && key !== 'vision' ? ` Before flight it was ${formatValue(key, pre)}.` : ''
    return { status: 'ok', text: `${said} That is in your usual range.${before}` }
  }
  const item: AttentionItem = { kind: 'indicator', key, status: j.status, label: def.name }
  const a = actionFor(state, person, item)
  return { status: j.status, text: `${said} ${a.observed} ${a.next}`, item }
}

function describeAll(state: AppState, person: Person, keys: IndicatorKey[], intro?: string): DoctorReply {
  const parts = keys.map((k) => describe(state, person, k)).filter((p) => p.status !== 'unavailable' || keys.length === 1)
  const items = parts.flatMap((p) => (p.item ? [p.item] : []))
  const worstFirst = [...parts].sort((a, b) => rank(b.status) - rank(a.status))
  return {
    status: worstFirst[0]?.status ?? 'ok',
    text: [intro, ...parts.map((p) => p.text)].filter(Boolean).join(' '),
    actions: buttons(state, person, items),
  }
}

function rank(s: StatusKey): number {
  return { warning: 5, caution: 4, repeat: 3, stale: 2, ok: 1, unavailable: 0 }[s]
}

/** Things a person might say that must go to a human at once. */
const RED_FLAGS =
  /chest (pain|hurts|is tight|tightness|pressure)|pain in (my|the) chest|(can'?t|cannot|can ?not|hard to|trouble|struggling to) breath|short(ness)? of breath|faint(ed|ing)?\b|pass(ed|ing) out|black(ed|ing)? out|collaps|(can'?t|cannot) see|lost my (vision|sight)|sudden(ly)? (lost|loss|weak|numb)|numb(ness)? in|worst headache|coughing (up )?blood|seizure|heart attack|stroke/

interface Topic {
  match: RegExp
  keys: IndicatorKey[]
}

const TOPICS: Topic[] = [
  { match: /blood pressure|\bpressure\b|\bbp\b/, keys: ['bp', 'standing'] },
  { match: /oxygen|saturation|spo2|breath/, keys: ['spo2'] },
  { match: /heart|pulse|\bbpm\b|cardiac/, keys: ['hr', 'bp'] },
  { match: /chest|lung/, keys: ['hr', 'bp', 'spo2'] },
  { match: /temperature|fever|\bhot\b|\bcold\b/, keys: ['temp'] },
  { match: /weight|\bkilos?\b|eating|appetite/, keys: ['weight'] },
  { match: /vision|eyes?\b|sight|\bsee\b/, keys: ['vision'] },
  { match: /\bhead\b/, keys: ['vision', 'cabin'] },
  { match: /bones?\b|hips?\b|spine|\bback\b|muscles?/, keys: ['bone', 'exercise'] },
  { match: /exercise|training|workout|treadmill/, keys: ['exercise', 'bone'] },
  { match: /sleep|slept/, keys: ['sleep'] },
  { match: /radiation|dose|solar/, keys: ['radiation'] },
  { match: /\bair\b|carbon dioxide|\bco2\b|co₂|cabin/, keys: ['cabin'] },
]

interface Complaint {
  match: RegExp
  name: string
  keys: IndicatorKey[]
  advice: string
}

const COMPLAINTS: Complaint[] = [
  { match: /headache|head (hurts|aches|is pounding)|migraine/, name: 'a headache', keys: ['cabin', 'sleep'], advice: 'Headaches are common here, and stale air or short sleep are the usual reasons. Drink water and rest for a while.' },
  { match: /dizz|light.?headed|vertigo|spinning/, name: 'dizziness', keys: ['bp', 'hr'], advice: 'Sit or hold on to something until it passes, and drink water.' },
  { match: /rash|itch|skin (is|feels|looks)/, name: 'a skin rash', keys: [], advice: 'Rashes are the most common complaint in a closed cabin. Keep the area clean and dry, and do not scratch it.' },
  { match: /cough|sore throat|runny nose|a cold\b|congest/, name: 'a cold or cough', keys: ['temp', 'spo2'], advice: 'Rest, drink water, and keep your distance from the others where you can.' },
  { match: /feverish|i have a fever|shiver|chills|burning up/, name: 'feeling feverish', keys: ['temp'], advice: 'Rest and drink water, and take your temperature again in an hour.' },
  { match: /tired|exhaust|fatigue|no energy|can'?t sleep|cannot sleep|insomnia|sleepy/, name: 'tiredness', keys: ['sleep', 'cabin'], advice: 'Protect tonight’s sleep: dim the lights and stop work an hour before.' },
  { match: /stomach|nause|sick to|vomit|threw up|diarr|digest/, name: 'a stomach complaint', keys: ['weight', 'temp'], advice: 'Take small sips of water and eat lightly.' },
  { match: /(my|the) (hips?|back|spine|knee|leg|arm|shoulder|neck)s? (hurts?|aches?|is sore|are sore)|back pain|sore muscles?/, name: 'an ache', keys: ['exercise'], advice: 'Ease off the load on that area today, but keep moving gently.' },
  { match: /\b(sad|lonely|anxious|stressed|depressed|homesick|low mood|feel(ing)? (down|low))\b/, name: 'a low mood', keys: [], advice: 'That is a normal thing to feel this far from home, and it matters as much as any reading. Your diary is private to you, and a quiet talk with a crewmate often helps.' },
]

/** Answers one thing the person said or typed. */
export function reply(state: AppState, person: Person, said: string): DoctorReply {
  const q = said.toLowerCase().replace(/[’‘]/g, "'").trim()
  const base = `/body/${person.id}`
  if (!q) return { text: 'I did not catch that. Could you say it once more?' }

  if (RED_FLAGS.test(q)) {
    return {
      urgent: true,
      status: 'warning',
      text: `That needs a person, not me. Stop what you are doing, stay still, and call ${medicalLead()}, on the crew channel now. Do not wait for me or for the ground. ${vitals(state, person)}`,
    }
  }

  const complaint = COMPLAINTS.find((c) => c.match.test(q))
  if (complaint) {
    const facts = complaint.keys.length ? ` Looking at your data: ${describeAll(state, person, complaint.keys).text}` : ''
    const mood = complaint.name === 'a low mood'
    return {
      status: 'caution',
      text: `I am sorry to hear that. ${complaint.advice}${facts} ${mood ? '' : `Log it in a check-in so it stays on your record, and tell ${medicalLead()}, if it gets worse or lasts three days.`}`.trim(),
      actions: [mood ? { label: 'Open my diary', to: '/mental-health' } : { label: 'Log it in a check-in', to: `${base}/check-in` }],
    }
  }

  if (/what (should|can|do) i do|what now|what next|next step|advice|advise|recommend|should i (do|worry)/.test(q)) {
    const items = attention(state, person)
    if (!items.length) {
      return { status: 'ok', text: 'Nothing needs doing right now. Keep to the exercise plan, drink enough, and do your check-in this evening.', actions: [{ label: 'Daily check-in', to: `${base}/check-in` }] }
    }
    const steps = items.slice(0, 3).map((i) => { const a = actionFor(state, person, i); return `${a.observed} ${a.next}` })
    return {
      status: items[0].status,
      text: `${items.length === 1 ? 'One thing.' : 'In order.'} ${[...new Set(steps)].join(' After that: ')}`,
      actions: buttons(state, person, items),
    }
  }

  const topics = TOPICS.filter((t) => t.match.test(q))
  if (topics.length) {
    const keys = [...new Set(topics.flatMap((t) => t.keys))]
    return describeAll(state, person, keys)
  }

  if (/\bmood\b|my feelings|mental|diary/.test(q)) {
    return { text: 'Your mood and diary are private, so I do not read them. They are there whenever you want them.', actions: [{ label: 'Open my diary', to: '/mental-health' }] }
  }

  if (/\b(all|everything|every reading|each reading|full list)\b/.test(q)) {
    const keys: IndicatorKey[] = [...regionIndicators('chest'), ...regionIndicators('whole'), 'sleep', 'exercise']
    return describeAll(state, person, keys)
  }

  if (/results?|readings?|numbers|how am i|am i (ok|okay|fine|healthy|well|sick|ill)|anything (wrong|off)|is (something|anything)|summary|overview|check.?up|my health|how do i look|worried|warnings?/.test(q)) {
    return assessment(state, person)
  }

  if (/are you (real|human|a real|an ai|a robot|a doctor)|who are you|what are you/.test(q)) {
    return { text: `I am ORBIT’s virtual doctor: a simulation, not a real clinician. I read your own readings and check-ins on this device and tell you what stands out and what to do next. For anything serious, ${medicalLead()}, and the ground are the ones to ask.` }
  }

  if (/not (so |very |too |feeling )?(good|great|well|right|ok|okay|fine)|unwell|(?<!not )\bbad\b|awful|terrible|\bsick\b|\bill\b|something('?s| is) (wrong|off)|\bhurts?\b|\bpain\b|\bache/.test(q)) {
    return { status: 'caution', text: 'I am sorry. Tell me where: is it your head, your chest, your stomach, your skin, or more a tired, feverish feeling?' }
  }

  if (/\b(i'?m|i am|i feel|feeling|doing) (fine|good|great|ok|okay|well|alright|all right)\b|^(fine|good|great|ok|okay|all good|not bad)\b/.test(q)) {
    const a = assessment(state, person)
    return a.status === 'ok'
      ? { status: 'ok', text: 'Good. That matches what I see in your readings. Is there anything you would like me to go through?' }
      : { ...a, text: `I am glad you feel well. I would still act on what the readings show. ${a.text}` }
  }

  if (/^(hi|hello|hey|good (morning|evening|afternoon))\b/.test(q)) return opening(state, person)
  if (/thank|thanks|cheers/.test(q)) return { text: 'You are welcome. I am here whenever you want to check in.' }
  if (/\b(bye|goodbye|that'?s all|that is all|see you|end (the )?call)\b/.test(q)) return { text: `Take care, ${firstName(person)}. Come back any time.` }

  return {
    text: 'I can only speak about what ORBIT measures. Ask me how your results look, about your heart, blood pressure, oxygen, temperature, sleep, exercise, or radiation, or tell me how you feel.',
  }
}

/** Rewrites symbols and short units so a speech voice reads them the way a person would. */
export function speakable(text: string): string {
  return text
    .replace(/(\d+)\/(\d+)/g, '$1 over $2')
    .replace(/mmHg CO₂/g, 'millimetres of mercury of carbon dioxide')
    .replace(/mmHg/g, 'millimetres of mercury')
    .replace(/\bbpm\b/g, 'beats per minute')
    .replace(/°C/g, 'degrees Celsius')
    .replace(/\bmSv\b/g, 'millisieverts')
    .replace(/CO₂/g, 'carbon dioxide')
    .replace(/(\d) h\b/g, '$1 hours')
    .replace(/(\d) min\b/g, '$1 minutes')
    .replace(/(\d) kg\b/g, '$1 kilograms')
    .replace(/−/g, 'minus ')
    .replace(/ORBIT/g, 'Orbit')
}
