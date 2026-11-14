import { ARRIVAL_DAY, DEPARTURE_DAY, LANDING_DAY } from './mission'

/**
 * Where a person's normal should be in each mission phase.
 *
 * The body changes with gravity: in weightlessness blood pressure falls and core temperature
 * rises; on landing both head back. So "your normal" is not one number. For every vital and
 * every gravity level this file holds the expected change from the person's own pre-flight
 * value, how fast it settles, and how far one person may sit from that expectation.
 *
 * The app learns each person's own offset from the expectation in the two weeks after the
 * body has settled, and then holds it. The offset is clamped, so a slow real problem can
 * never be learned as the new normal. Values come from NASA's UTMB bed-rest data wherever it
 * has them; every value says where it comes from (docs/research/phase-limits.md).
 */

export type Gravity = 'earth' | 'micro' | 'mars'
export type PhaseVital = 'hr' | 'sys' | 'dia' | 'temp'
/** Where a value comes from: NASA's own data, a study outside NASA, or an estimate with no data behind it. */
export type Evidence = 'NASA data' | 'outside NASA' | 'estimate'

/** Days after a gravity change in which the body is still adapting and the limits are wider. */
export const ADAPT_DAYS = 14
/** Days, after adapting, in which the person's own offset is learned. */
export const LEARN_DAYS = 14
/** Fewest readings that may set a personal offset. */
export const MIN_LEARN = 3
/** How much wider the personal limits are while the body adapts. */
export const ADAPT_WIDEN = 1.5

export interface Segment {
  start: number
  gravity: Gravity
  label: string
}

export const SEGMENTS: Segment[] = [
  { start: -Infinity, gravity: 'earth', label: 'Before flight' },
  { start: 0, gravity: 'micro', label: 'Outbound to Mars' },
  { start: ARRIVAL_DAY, gravity: 'mars', label: 'On Mars' },
  { start: DEPARTURE_DAY, gravity: 'micro', label: 'Return to Earth' },
  { start: LANDING_DAY, gravity: 'earth', label: 'Back on Earth' },
]

export interface Envelope {
  /** Expected settled change from the pre-flight value. */
  shift: number
  /** How far one person's settled value may sit from the expected one, either way: 2 SD between people. */
  spread: number
  /** Days for about two thirds of the change to happen. */
  tau: number
  /** Extra change right after arriving in gravity from weightlessness, which fades over days. */
  reentry?: { size: number; tau: number }
  evidence: Evidence
  source: string
}

/**
 * NASA UTMB head-down bed-rest study, NASA Life Sciences Portal, doi:10.83263/wjw1-ta27: 29 volunteers,
 * change of each person's mean from their own pre-bed-rest mean. Computed from data/utmb/daily_vitals.csv
 * (see docs/research/phase-limits.md). Bed rest is NASA's standard ground stand-in for weightlessness.
 */
const UTMB = 'NASA UTMB bed-rest study, 29 volunteers (NASA Life Sciences Portal, doi:10.83263/wjw1-ta27)'
const UTMB_POST = 'NASA UTMB bed-rest study, first days after bed rest: heart rate +11.7 bpm on days 0–3, +6.7 on days 4–7 (doi:10.83263/wjw1-ta27)'
const STAHN = 'Outside NASA: ESA/Charité study of ISS crew, +1 °C after about 75 days (Stahn et al. 2017, doi:10.1038/s41598-017-15560-w). Bed rest shows no rise, so NASA data cannot confirm it.'
const MARS = 'Estimate: NASA has no data for long stays at 0.38 g. Uses the bed-rest values.'

export const ENVELOPES: Record<Gravity, Record<PhaseVital, Envelope>> = {
  earth: {
    // Spreads: 2 SD of the change between volunteers from day 8 after bed rest (NASA data).
    hr: { shift: 0, spread: 15, tau: 5, reentry: { size: 12, tau: 10 }, evidence: 'NASA data', source: UTMB_POST },
    sys: { shift: 0, spread: 13, tau: 5, evidence: 'NASA data', source: UTMB },
    dia: { shift: 0, spread: 13, tau: 5, evidence: 'NASA data', source: UTMB },
    temp: { shift: 0, spread: 0.4, tau: 10, evidence: 'NASA data', source: UTMB },
  },
  micro: {
    hr: { shift: 2, spread: 9, tau: 5, evidence: 'NASA data', source: UTMB },
    sys: { shift: 0, spread: 10, tau: 5, evidence: 'NASA data', source: UTMB },
    dia: { shift: 1, spread: 10, tau: 5, evidence: 'NASA data', source: UTMB },
    temp: { shift: 1.0, spread: 0.3, tau: 25, evidence: 'outside NASA', source: STAHN },
  },
  mars: {
    // Estimate: the wider of the weightlessness and after-bed-rest spreads.
    hr: { shift: 2, spread: 15, tau: 5, reentry: { size: 12, tau: 10 }, evidence: 'estimate', source: MARS },
    sys: { shift: 0, spread: 13, tau: 5, evidence: 'estimate', source: MARS },
    dia: { shift: 1, spread: 13, tau: 5, evidence: 'estimate', source: MARS },
    temp: { shift: 0.5, spread: 0.6, tau: 25, evidence: 'estimate', source: 'Estimate: no data on Mars. Halfway between the in-flight rise and Earth.' },
  },
}

export interface PhaseAt {
  index: number
  segment: Segment
  /** Days since the last gravity change. Infinity before flight. */
  daysIn: number
  adapting: boolean
}

export function phaseAt(t: number): PhaseAt {
  let index = 0
  SEGMENTS.forEach((s, i) => { if (t >= s.start) index = i })
  const segment = SEGMENTS[index]
  const daysIn = t - segment.start
  return { index, segment, daysIn, adapting: daysIn < ADAPT_DAYS }
}

/** Expected change from the pre-flight value at time t: it moves from the old level to the new one over days. */
export function modelShift(v: PhaseVital, t: number): number {
  const p = phaseAt(t)
  if (p.index === 0) return 0
  const now = ENVELOPES[p.segment.gravity][v]
  const fromGravity = SEGMENTS[p.index - 1].gravity
  const before = ENVELOPES[fromGravity][v].shift
  const settle = now.shift + (before - now.shift) * Math.exp(-p.daysIn / now.tau)
  const reentry = fromGravity === 'micro' && now.reentry ? now.reentry.size * Math.exp(-p.daysIn / now.reentry.tau) : 0
  return settle + reentry
}

export interface Sample {
  t: number
  v: number
}

export interface Normal {
  /** The person's expected value at this time. */
  value: number
  /** Expected change from pre-flight for anyone in this phase. */
  shift: number
  /** This person's own learned offset from that expectation. */
  offset: number
  /** True when the offset comes from this phase's readings, false when it is carried over. */
  learned: boolean
  /** Lowest and highest value the normal may take here. */
  range: [number, number]
  adapting: boolean
  label: string
  evidence: Evidence
  source: string
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

/** The person's offset learned in a phase, or the one carried over from the phase before. */
function offsetFor(v: PhaseVital, pre: number, samples: Sample[], index: number, t: number): { offset: number; learned: boolean } {
  if (index === 0) return { offset: 0, learned: false }
  const seg = SEGMENTS[index]
  const from = seg.start + ADAPT_DAYS
  const to = from + LEARN_DAYS
  const window = samples.filter((s) => s.t >= from && s.t < to)
  const spread = ENVELOPES[seg.gravity][v].spread
  // Learned only once the whole window is over, then held: a few early readings never set it.
  const windowDone = t >= to
  if (windowDone && window.length >= MIN_LEARN) {
    const raw = window.reduce((a, s) => a + (s.v - pre - modelShift(v, s.t)), 0) / window.length
    return { offset: clamp(raw, -spread, spread), learned: true }
  }
  const carried = offsetFor(v, pre, samples, index - 1, t).offset
  return { offset: clamp(carried, -spread, spread), learned: false }
}

/**
 * The person's normal for one vital at time t, from their pre-flight value and their own
 * resting readings. Only readings from before t are used.
 */
export function personalNormal(v: PhaseVital, pre: number, samples: Sample[], t: number): Normal {
  const p = phaseAt(t)
  const env = ENVELOPES[p.segment.gravity][v]
  const shift = modelShift(v, t)
  const { offset, learned } = offsetFor(v, pre, samples.filter((s) => s.t < t), p.index, t)
  return {
    value: pre + shift + offset,
    shift,
    offset,
    learned,
    range: [pre + shift - env.spread, pre + shift + env.spread],
    adapting: p.adapting,
    label: p.segment.label,
    evidence: env.evidence,
    source: env.source,
  }
}

/** How much wider the personal limits are at time t. */
export function widen(t: number): number {
  return phaseAt(t).adapting ? ADAPT_WIDEN : 1
}
