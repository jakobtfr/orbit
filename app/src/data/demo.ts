import { INDICATORS } from '../lib/indicators'
import { SIM_END, doseRate, phaseFor } from '../lib/mission'
import type { AppState, CheckIn, IndicatorKey, Person, Reading } from '../lib/types'
import residuals from './utmb-residuals.json'

/**
 * Demo data (SPEC.md, "Fake data"). Four invented crew members, scripted so that
 * every status appears somewhere. Nothing here is a flight measurement.
 *
 * The day-to-day variation of heart rate, blood pressure, temperature, and weight
 * is replayed from four NASA UTMB bed-rest subjects (data/utmb/daily_vitals.csv).
 * Levels, trends, and all other indicators are invented.
 */

export const FIRST_DAY = -30
/** The day the scripted events happen, and the day the app opens on. */
export const SCENE_DAY = 100
/** Readings exist for the whole simulated mission. */
export const LAST_DAY = SIM_END

export const CREW: Person[] = [
  {
    id: 'lena',
    name: 'Lena Brandt',
    role: 'Pilot',
    lead: false,
    shared: [],
    preflight: pre({ hr: 62, sys: 120, dia: 72, temp: 36.8, weight: 68.4, sleep: 7.4, dose: 0 }),
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    role: 'Flight engineer',
    lead: false,
    shared: ['hr'],
    preflight: pre({ hr: 64, sys: 118, dia: 70, temp: 36.6, weight: 81.2, sleep: 7.1, dose: 62 }),
  },
  {
    id: 'aiko',
    name: 'Aiko Mori',
    role: 'Mission specialist',
    lead: false,
    shared: [],
    preflight: pre({ hr: 58, sys: 122, dia: 74, temp: 36.7, weight: 59.8, sleep: 7.6, dose: 0 }),
  },
  {
    id: 'samir',
    name: 'Samir Haddad',
    role: 'Commander · Medical lead',
    lead: true,
    shared: ['sleep'],
    preflight: pre({ hr: 66, sys: 116, dia: 68, temp: 36.9, weight: 77.5, sleep: 7.0, dose: 118 }),
  },
]

interface PreInput {
  hr: number
  sys: number
  dia: number
  temp: number
  weight: number
  sleep: number
  dose: number
}

function pre(p: PreInput): Person['preflight'] {
  return {
    hr: { v: p.hr, day: -14, n: 30 },
    bp: { v: p.sys, v2: p.dia, day: -14, n: 30 },
    spo2: { v: 98, day: -14, n: 30 },
    temp: { v: p.temp, day: -14, n: 30 },
    weight: { v: p.weight, day: -7, n: 10 },
    vision: { v: 0, day: -12, n: 2 },
    sleep: { v: p.sleep, day: -14, n: 30 },
    radiation: { v: p.dose, day: -1, n: 1 },
  }
}

const SUBJECTS = ['UTMB-20', 'UTMB-21', 'UTMB-03', 'UTMB-15'] as const
type ResKey = 'hr' | 'sys' | 'dia' | 'temp' | 'weight'

function noise(person: number, k: ResKey, d: number, scale: number, cap: number): number {
  const series = (residuals.subjects as Record<string, Record<ResKey, number[]>>)[SUBJECTS[person]][k]
  const raw = series[(d - FIRST_DAY) % series.length] * scale
  return Math.max(-cap, Math.min(cap, raw))
}

/** Repeatable pseudo-random number in [0, 1). */
function rand(person: number, d: number, salt: number): number {
  let x = Math.imul(person + 1, 374761393) ^ Math.imul(d + 1000, 668265263) ^ Math.imul(salt + 7, 2246822519)
  x = Math.imul(x ^ (x >>> 13), 1274126177)
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}

function round(v: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(v * f) / f
}

function reading(key: IndicatorKey, t: number, v: number, v2?: number): Reading {
  const def = INDICATORS[key]
  return {
    t,
    v: round(v, def.decimals),
    v2: v2 === undefined ? undefined : Math.round(v2),
    activity: 'rest',
    source: def.source,
    provenance: 'SIMULATED',
  }
}

function buildPerson(i: number, p: Person): Partial<Record<IndicatorKey, Reading[]>> {
  const pf = p.preflight
  const out: Partial<Record<IndicatorKey, Reading[]>> = {
    hr: [],
    bp: [],
    spo2: [],
    temp: [],
    weight: [],
    vision: [],
    standing: [],
    sleep: [],
    exercise: [],
    radiation: [],
  }
  let dose = pf.radiation!.v
  for (let d = FIRST_DAY; d <= LAST_DAY; d++) {
    const flight = d >= 0
    const settle = flight ? 1 - Math.exp(-d / 10) : 0

    // Heart rate. Tomás: a slow rise over the last 30 days.
    let hr = pf.hr!.v + (flight ? 2 : 0) + noise(i, 'hr', d, 0.4, 3)
    if (p.id === 'tomas' && d > 70) hr += d <= SCENE_DAY ? (d - 70) * 0.6 : Math.max(0, 18 - (d - SCENE_DAY) * 2)
    out.hr!.push(reading('hr', d + 0.3125, hr))

    // Blood pressure runs lower in flight. Aiko: one high reading today.
    let sys = pf.bp!.v - 9 * settle + noise(i, 'sys', d, 0.4, 4)
    let dia = pf.bp!.v2! - 6 * settle + noise(i, 'dia', d, 0.4, 4)
    if (p.id === 'aiko' && d === SCENE_DAY) {
      sys = 145
      dia = 92
    }
    out.bp!.push(reading('bp', d + 0.3125, sys, dia))

    out.spo2!.push(reading('spo2', d + 0.3125, 97 + Math.floor(rand(i, d, 1) * 3)))

    // Body temperature rises about 1 °C in flight and levels off near day 75.
    let temp = pf.temp!.v + (flight ? 1.0 * (1 - Math.exp(-d / 22)) : 0) + noise(i, 'temp', d, 0.4, 0.15)
    if (p.id === 'lena' && d === SCENE_DAY) temp = 38.0
    out.temp!.push(reading('temp', d + 0.3, temp))

    // Weight every third day. Aiko: not measured for 12 days.
    if ((d - FIRST_DAY) % 3 === 1 && !(p.id === 'aiko' && d > 88 && d <= SCENE_DAY)) {
      const w = pf.weight!.v - (flight ? 1.4 * (1 - Math.exp(-d / 120)) : 0) + noise(i, 'weight', d, 0.5, 0.4)
      out.weight!.push(reading('weight', d + 0.28, w))
    }

    if ((SCENE_DAY - d) % 14 === 0) out.vision!.push(reading('vision', d + 0.31, 0))

    // Sleep. Samir: under 6 hours for the last three nights.
    let sleep = pf.sleep!.v - (flight ? 0.5 : 0) + (rand(i, d, 2) - 0.5)
    sleep = Math.max(6.1, sleep)
    if (p.id === 'samir' && d >= SCENE_DAY - 2 && d <= SCENE_DAY) sleep = [5.4, 5.7, 5.2][d - (SCENE_DAY - 2)]
    out.sleep!.push(reading('sleep', d + 0.29, sleep))

    if (d >= 1) out.exercise!.push(reading('exercise', d, 118 + Math.floor(rand(i, d, 3) * 30)))

    // Radiation adds up: faster in deep space, slower on the surface of Mars.
    dose += doseRate(d)
    out.radiation!.push(reading('radiation', d, dose))

    // The standing test is only done where there is gravity, once a week.
    if (flight && phaseFor(d).place !== 'spacecraft' && d % 7 === 0) {
      out.standing!.push(reading('standing', d + 0.33, 6 + Math.floor(rand(i, d, 6) * 9)))
    }
  }
  return out
}

function buildCheckIns(i: number, p: Person): CheckIn[] {
  const list: CheckIn[] = []
  for (let d = 0; d <= LAST_DAY; d++) {
    if (d === SCENE_DAY && p.id === 'samir') continue
    // Lena checks in during the evening, so today's check-in is always still open for the viewer.
    const c: CheckIn = { t: d + (p.id === 'lena' ? 0.875 : 0.32), feel: 'Fine', symptoms: [], mood: 3 + Math.floor(rand(i, d, 4) * 2) }
    if (p.id === 'tomas' && d === SCENE_DAY) {
      c.feel = 'Not quite right'
      c.symptoms = [{ name: 'Headache', region: 'head' }]
    }
    list.push(c)
  }
  return list
}

function buildCabin(): Reading[] {
  const out: Reading[] = []
  for (let d = 0; d <= LAST_DAY; d++) {
    out.push(reading('cabin', d + 8 / 24, 2.2 + rand(9, d, 5) * 0.6))
  }
  return out
}

export function initialState(): AppState {
  const readings: AppState['readings'] = {}
  const checkins: AppState['checkins'] = {}
  CREW.forEach((p, i) => {
    readings[p.id] = buildPerson(i, p)
    checkins[p.id] = buildCheckIns(i, p)
  })
  return { day: SCENE_DAY, place: phaseFor(SCENE_DAY).place, viewerId: 'lena', readings, cabin: buildCabin(), checkins }
}
