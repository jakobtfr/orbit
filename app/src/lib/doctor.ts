import { CREW } from '../data/demo'
import { age } from './format'
import { STATUS } from '../components/Status'
import { INDICATORS, INDICATOR_ORDER, formatValue } from './indicators'
import { actionFor, activeSymptoms, attention, judge, now, regionIndicators, risksAtAttention, type AttentionItem } from './judge'
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

export const SUGGESTIONS = ['How are my results?', 'What should I do next?', 'I have a headache', 'Can you look at this rash?']

const AREA: Record<IndicatorKey, string> = {
  hr: 'your chest',
  bp: 'your chest',
  standing: 'your chest',
  spo2: 'your chest',
  rr: 'your breathing',
  temp: 'your temperature',
  glucose: 'your blood sugar',
  intake: 'your food',
  hydration: 'how much you drink',
  hearing: 'your hearing',
  cognition: 'your thinking',
  balance: 'your balance',
  o2: 'the cabin oxygen',
  noise: 'the cabin noise',
  water: 'the drinking water',
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
export function opening(state: AppState, person: Person, focus?: Focus): DoctorReply {
  if (focus) {
    const latest = focus.key ? judge(state, person, focus.key).latest : undefined
    const last = focus.key && latest ? ` Your last reading was ${withUnit(focus.key, latest)}, ${age(now(state), latest.t)}.` : ''
    return {
      status: focus.status,
      text: `Hello ${firstName(person)}. I am here about ${focus.title}. ${focus.finding}${last} Let us sort it out together, one step at a time. ${focus.steps[0]}`,
    }
  }
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

/** True when what was said must go to a person at once. These are never left to a language model. */
export function isUrgent(said: string): boolean {
  return RED_FLAGS.test(said.toLowerCase().replace(/[’‘]/g, "'"))
}

interface Topic {
  match: RegExp
  keys: IndicatorKey[]
}

const TOPICS: Topic[] = [
  { match: /blood pressure|\bpressure\b|\bbp\b/, keys: ['bp', 'standing'] },
  { match: /saturation|spo2|blood oxygen/, keys: ['spo2'] },
  { match: /breath|respir/, keys: ['rr', 'spo2'] },
  { match: /heart|pulse|\bbpm\b|cardiac/, keys: ['hr', 'bp'] },
  { match: /chest|lung/, keys: ['hr', 'bp', 'spo2', 'rr'] },
  { match: /temperature|fever|\bhot\b|\bcold\b/, keys: ['temp'] },
  { match: /weight|\bkilos?\b|eating|appetite|food|meal|nutrition/, keys: ['weight', 'intake'] },
  { match: /blood sugar|glucose/, keys: ['glucose'] },
  { match: /thirst|hydrat|drink|urine|kidney/, keys: ['hydration'] },
  { match: /\bhearing\b|deaf/, keys: ['hearing'] },
  { match: /think|focus|cognit|memory|concentrat/, keys: ['cognition'] },
  { match: /balance|unsteady|gait/, keys: ['balance'] },
  { match: /noise|loud/, keys: ['noise', 'hearing'] },
  { match: /vision|eyes?\b|sight|\bsee\b/, keys: ['vision'] },
  { match: /\bhead\b/, keys: ['vision', 'cabin'] },
  { match: /bones?\b|hips?\b|spine|\bback\b|muscles?/, keys: ['bone', 'exercise'] },
  { match: /exercise|training|workout|treadmill/, keys: ['exercise', 'bone'] },
  { match: /sleep|slept/, keys: ['sleep'] },
  { match: /radiation|dose|solar/, keys: ['radiation'] },
  { match: /\bair\b|carbon dioxide|\bco2\b|co₂|cabin/, keys: ['cabin', 'o2'] },
  { match: /drinking water|potable|biocide/, keys: ['water'] },
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
  { match: /rash|itch|skin (is|feels|looks)|\b(bumps?|lumps?|swelling|swollen|bruise|blister|spots?|cut|wound|scratch|sore)\b/, name: 'something on the skin', keys: [], advice: 'Skin problems are the most common complaint in a closed cabin. Keep the area clean and dry, do not scratch or squeeze it, and note its size so you can tell whether it changes.' },
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

  if (isUrgent(q)) {
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
    .replace(/breaths\/min/g, 'breaths per minute')
    .replace(/mg\/dL/g, 'milligrams per decilitre')
    .replace(/mg\/L/g, 'milligrams per litre')
    .replace(/dBA/g, 'decibels')
    .replace(/\bdB\b/g, 'decibels')
    .replace(/°C/g, 'degrees Celsius')
    .replace(/\bmSv\b/g, 'millisieverts')
    .replace(/CO₂/g, 'carbon dioxide')
    .replace(/(\d) h\b/g, '$1 hours')
    .replace(/(\d) min\b/g, '$1 minutes')
    .replace(/(\d) kg\b/g, '$1 kilograms')
    .replace(/−/g, 'minus ')
    .replace(/ORBIT/g, 'Orbit')
}

/**
 * What the on-device language model is told before the conversation. It gets the same findings the
 * built-in answers use, so it can choose the words but not the facts.
 */
export function briefing(state: AppState, person: Person, call: { focus?: Focus; camera?: 'off' | 'on' | 'picture'; note?: string } = {}): string {
  const readings = INDICATOR_ORDER.filter((k) => k !== 'mood').map((key) => {
    const def = INDICATORS[key]
    const j = judge(state, person, key)
    if (j.status === 'unavailable') return `- ${def.name}: cannot be measured here. ${j.reason ?? ''}`.trim()
    if (!j.latest) return `- ${def.name}: no reading yet.`
    const pre = person.preflight[key]
    const before = pre && key !== 'vision' ? `, before flight ${formatValue(key, pre)}` : ''
    const line = `- ${def.name}: ${withUnit(key, j.latest)}, taken ${age(now(state), j.latest.t)}${before}. Status: ${STATUS[j.status].label}.`
    if (j.status === 'ok') return line
    const a = actionFor(state, person, { kind: 'indicator', key, status: j.status, label: def.name })
    return `${line} Finding: ${a.observed} Next step: ${a.next}${a.risk ? ` Spaceflight risk it bears on: ${a.risk}.` : ''}`
  })
  const symptoms = activeSymptoms(state, person.id).map((s) => s.name.toLowerCase())
  const atRisk = risksAtAttention(state, person)
  return [
    `You are the ORBIT doctor, a simulated doctor on a video call with ${person.name} (${person.role}), a crew member on a long space mission. It is mission day ${state.day}. You are a simulation, not a real clinician, and you say so if asked.`,
    'How to talk: warm, calm, and plain, like a good family doctor who knows this person. Your words are read aloud, so answer in two or three short sentences with no lists, no headings, no markdown, and no emojis. Ask at most one question. Do not repeat advice you have already given in this call, and do not read their readings back unless they ask or one has changed.',
    `Rules: every number and finding you mention must come from the readings below. Never invent a value; if something is not listed, say it is not measured. Go by the status given for each reading: it is judged against this person's own normal, not against Earth limits. Do not name a diagnosis and do not suggest medicines or doses. If something sounds serious, tell them to call ${medicalLead()}. Mood and the diary are private and you cannot see them. If asked about something unrelated, answer briefly and come back to how they are.`,
    `Your overall read of today: ${assessment(state, person).text}`,
    `Readings:\n${readings.join('\n')}`,
    `Symptoms logged in the last two days: ${symptoms.length ? symptoms.join(', ') : 'none'}.`,
    atRisk.length ? `Spaceflight risks with a finding behind them today: ${atRisk.map((r) => `${r.risk.name} (${r.risk.what})`).join(' ')}` : '',
    'How to help with a problem, whatever it is: a reading that is off, a rash, a bump, a pain, a cut, poor sleep, or anything else they bring up. First find out what they notice and how they feel. If it is something that can be seen, ask them to show it to the camera. Then give one practical, safe, first-aid level thing to do, wait for their answer, and go on from what they say. Never give a list of steps at once. If it is about a reading, have them rest and take it again and tell you the numbers: a reading they say aloud is saved and appears above with its status, so go by that status. Finish by saying plainly what to watch for and when to tell the medical lead, and suggest logging it in the daily check-in so it stays on their record.',
    call.focus
      ? `This call was opened about ${call.focus.title}. ${call.focus.finding} The usual next step for it: ${call.focus.next} Start there, but help just as readily with anything else they raise.`
      : '',
    call.camera === 'picture'
      ? 'Their latest message comes with one still picture from their camera, because they are showing you something. Say plainly what you can actually see in it: where it is, its colour, its rough size, how a sensor or dressing sits. If the picture is dark, blurred, or does not show what they mean, say so and ask them to hold it closer or turn towards the light. Describe, do not diagnose, and never judge their health from how they look.'
      : call.camera === 'on'
        ? 'Their camera is on, but you only get a picture when they show you something. Do not describe or guess what they look like. If something is worth seeing, ask them to hold it up to the camera.'
        : 'Their camera is off, so you cannot see them. If something is worth seeing, ask them to turn the camera on, or to describe it.',
    call.note ?? '',
  ].filter(Boolean).join('\n\n')
}

/* ---------- a call about one thing ---------- */

/** What a call was opened about: any reading that is off or any symptom that was logged. */
export interface Focus {
  /** Set when the call is about a reading. */
  key?: IndicatorKey
  /** How it is named in a sentence: "your blood pressure", "the skin rash you logged". */
  title: string
  status: StatusKey
  finding: string
  next: string
  /** What the built-in doctor walks through when no language model is running. */
  steps: string[]
}

/**
 * What a call should be about: the reading or body region asked for, or else the most serious thing
 * that is off. Nothing here is written for one condition; it all comes from the rules and the
 * measuring instructions. Undefined when nothing is off, and then the doctor just talks.
 */
export function focusOn(state: AppState, person: Person, about?: string | null): Focus | undefined {
  const items = attention(state, person).filter((i) => isOff(i.status) || i.status === 'repeat')
  const item = about ? items.find((i) => i.key === about || (i.kind === 'symptom' && i.region === about)) : items.find((i) => isOff(i.status))
  if (!item) return undefined
  const a = actionFor(state, person, item)
  const feel = 'First, how do you feel right now?'
  if (item.kind === 'symptom') {
    return {
      status: item.status,
      title: `the ${item.label.toLowerCase()} you logged`,
      finding: a.observed,
      next: a.next,
      steps: [feel, 'Tell me about it: where it is, when it started, and whether it is getting better or worse. If it is something that can be seen, describe its size and colour.', a.next],
    }
  }
  const def = INDICATORS[item.key as IndicatorKey]
  return {
    key: item.key,
    status: item.status,
    title: `your ${def.name.toLowerCase()}`,
    finding: a.observed,
    next: a.next,
    steps: [feel, ...def.steps, 'Now take the reading again and tell me the result.', a.next],
  }
}

/**
 * A reading the person says out loud: "it is 104 over 68", "pulse is 64", "37.2 degrees".
 * The words say which reading it is; a bare number counts only for the reading the call is about.
 */
export function heardReading(said: string, hint?: IndicatorKey): { key: IndicatorKey; v: number; v2?: number } | undefined {
  const q = said.toLowerCase().replace(/(\d),(\d)/g, '$1.$2')
  const within = (n: number, lo: number, hi: number) => n >= lo && n <= hi
  const pair = q.match(/(\d{2,3})\s*(?:over|\/|on|by)\s*(\d{2,3})/)
  if (pair) {
    const [v, v2] = [Number(pair[1]), Number(pair[2])]
    return within(v, 50, 250) && within(v2, 30, 150) && v > v2 ? { key: 'bp', v, v2 } : undefined
  }
  const n = Number(q.match(/\d{2,3}(?:\.\d)?/)?.[0])
  if (!Number.isFinite(n)) return undefined
  const range: Partial<Record<IndicatorKey, [number, number]>> = { hr: [30, 220], spo2: [50, 100], temp: [34, 42], weight: [35, 150], sleep: [0, 14] }
  const named: IndicatorKey | undefined =
    /bpm|beats|pulse|heart rate/.test(q) ? 'hr'
    : /percent|%|oxygen|saturation/.test(q) ? 'spo2'
    : /degrees|celsius|°|temperature/.test(q) ? 'temp'
    : /kilos?\b|kilograms?|\bkg\b|weigh/.test(q) ? 'weight'
    : undefined
  const key = named ?? (hint && /\b(reading|result|it is|it's|it says|shows|now)\b/.test(q) ? hint : undefined)
  const r = key && range[key]
  return key && r && within(n, r[0], r[1]) ? { key, v: n } : undefined
}

/** The state with one more reading in it, taken now. */
export function withReading(state: AppState, person: Person, key: IndicatorKey, r: Pick<Reading, 'v' | 'v2'>): { state: AppState; reading: Reading } {
  const reading: Reading = { t: now(state), v: r.v, v2: r.v2, activity: 'rest', source: 'Told to the doctor', provenance: 'SELF-REPORTED' }
  const mine = state.readings[person.id] ?? {}
  return { reading, state: { ...state, readings: { ...state.readings, [person.id]: { ...mine, [key]: [...(mine[key] ?? []), reading] } } } }
}

/** What the built-in doctor says after a new reading in a focused call. */
export function afterReading(state: AppState, person: Person, key: IndicatorKey): DoctorReply {
  const j = judge(state, person, key)
  const value = j.latest ? withUnit(key, j.latest) : 'that'
  if (j.status === 'ok') return { status: 'ok', text: `Thank you. ${value} is back in your usual range. Take it easy for the next hour, get up slowly, and check again this evening.` }
  return { status: j.status, text: `Thank you. ${value} is still outside your usual range. Stay resting and tell ${medicalLead()}, today. I will be here if anything changes.` }
}

/** The built-in doctor's next step in a focused call, when no language model is running. */
export function nextStep(focus: Focus, index: number): DoctorReply {
  const step = focus.steps[index]
  return step
    ? { status: focus.status, text: index === focus.steps.length - 1 ? `Last step. ${step}` : `Good. ${step}` }
    : { text: 'That is the whole plan. Tell me the new reading whenever you have it, or ask me anything else.' }
}

/**
 * True when the person is showing something, so a picture from the camera should go with their message:
 * they say so, or the doctor has just asked to see it.
 */
export function wantsLook(said: string, doctorSaid = ''): boolean {
  const q = said.toLowerCase()
  if (/\b(look|see|seeing|show|showing|camera|picture|visible|here it is|like this|this (rash|bump|spot|cut|mark|lump|bruise|swelling|sensor|cuff))\b/.test(q)) return true
  return /\b(show me|let me see|hold (it|that|the|your)[^.?!]*\b(up|camera)|to the camera|can i see|turn (it|towards))\b/i.test(doctorSaid)
}
