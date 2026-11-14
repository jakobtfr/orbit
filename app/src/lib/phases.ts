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
 * never be learned as the new normal. Sources: research_notes "phase-envelopes" (Norsk 2015,
 * Stahn 2017, Fritsch-Yelle 1996, Baevsky 2007, Lee 2015).
 */

export type Gravity = 'earth' | 'micro' | 'mars'
export type PhaseVital = 'hr' | 'sys' | 'dia' | 'temp'
export type Evidence = 'strong' | 'medium' | 'modelled'

/** Days after a gravity change in which the body is still adapting and the limits are wider. */
export const ADAPT_DAYS = 14
/** Days, after adapting, in which the person's own offset is learned. */
export const LEARN_DAYS = 14
/** Fewest readings that may set a personal offset (Coskun et al. 2021: at least three results). */
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
  /** How far one person's settled value may sit from the expected one, either way. */
  spread: number
  /** Days for about two thirds of the change to happen. */
  tau: number
  evidence: Evidence
  source: string
}

const EARTH = 'Own pre-flight value; values return to it after flight (Norsk et al. 2015, doi:10.1113/jphysiol.2014.284869)'
const NORSK = 'Norsk et al. 2015, 24-h values on the ISS, doi:10.1113/jphysiol.2014.284869'
const MARS = 'No human data for long stays at 0.38 g. Estimated halfway between weightlessness and Earth.'

export const ENVELOPES: Record<Gravity, Record<PhaseVital, Envelope>> = {
  earth: {
    hr: { shift: 0, spread: 5, tau: 5, evidence: 'strong', source: EARTH },
    sys: { shift: 0, spread: 8, tau: 5, evidence: 'strong', source: EARTH },
    dia: { shift: 0, spread: 6, tau: 5, evidence: 'strong', source: EARTH },
    temp: { shift: 0, spread: 0.3, tau: 10, evidence: 'strong', source: EARTH },
  },
  micro: {
    hr: { shift: 0, spread: 7, tau: 5, evidence: 'strong', source: `${NORSK}; Hughson et al. 2012, doi:10.1152/japplphysiol.01196.2011` },
    sys: { shift: -8, spread: 7, tau: 5, evidence: 'strong', source: NORSK },
    dia: { shift: -9, spread: 6, tau: 5, evidence: 'strong', source: `${NORSK}; Fritsch-Yelle 1996: −5 within 2 weeks, doi:10.1152/jappl.1996.80.3.910` },
    temp: { shift: 1.0, spread: 0.4, tau: 25, evidence: 'strong', source: 'Stahn et al. 2017: +1 °C, level after about 75 days, doi:10.1038/s41598-017-15560-w' },
  },
  mars: {
    hr: { shift: 0, spread: 8, tau: 5, evidence: 'modelled', source: MARS },
    sys: { shift: -4, spread: 8, tau: 5, evidence: 'modelled', source: MARS },
    dia: { shift: -4, spread: 8, tau: 5, evidence: 'modelled', source: MARS },
    temp: { shift: 0.5, spread: 0.6, tau: 25, evidence: 'modelled', source: MARS },
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
  const before = ENVELOPES[SEGMENTS[p.index - 1].gravity][v].shift
  return now.shift + (before - now.shift) * Math.exp(-p.daysIn / now.tau)
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
function offsetFor(v: PhaseVital, pre: number, samples: Sample[], index: number): { offset: number; learned: boolean } {
  if (index === 0) return { offset: 0, learned: false }
  const seg = SEGMENTS[index]
  const from = seg.start + ADAPT_DAYS
  const to = from + LEARN_DAYS
  const window = samples.filter((s) => s.t >= from && s.t < to)
  const spread = ENVELOPES[seg.gravity][v].spread
  if (window.length >= MIN_LEARN) {
    const raw = window.reduce((a, s) => a + (s.v - pre - modelShift(v, s.t)), 0) / window.length
    return { offset: clamp(raw, -spread, spread), learned: true }
  }
  const carried = offsetFor(v, pre, samples, index - 1).offset
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
  const { offset, learned } = offsetFor(v, pre, samples.filter((s) => s.t < t), p.index)
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
