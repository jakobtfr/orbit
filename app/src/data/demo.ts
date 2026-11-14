import { INDICATORS } from '../lib/indicators'
import { SIM_END, doseRate, phaseFor } from '../lib/mission'
import type { AppState, CheckIn, CrewMember, IndicatorKey, Person, Reading } from '../lib/types'
import residuals from './utmb-residuals.json'

/**
 * Demo data (SPEC.md, "Fake data"). One invented crew member, Lena Brandt.
 * Nothing here is a flight measurement.
 *
 * The day-to-day variation of heart rate, blood pressure, temperature, and weight
 * is replayed from a NASA UTMB bed-rest subject (data/utmb/daily_vitals.csv).
 * Levels, trends, correlated drift, and all other indicators are invented.
 */

export const FIRST_DAY = -30
/** The day the scripted events happen, and the day the app opens on. */
export const SCENE_DAY = 100
/** Readings exist for the whole mission. */
export const LAST_DAY = SIM_END

/** The crew member the app belongs to. */
export const LENA: Person = {
  id: 'lena',
  name: 'Lena Brandt',
  role: 'Pilot',
  preflight: pre({ hr: 62, sys: 120, dia: 72, temp: 36.8, weight: 68.4, sleep: 7.4, dose: 0 }),
}

/** Everyone on board, by name only. The virtual doctor uses it to name the medical lead. */
export const CREW: CrewMember[] = [
  LENA,
  { id: 'tomas', name: 'Tomás Rivera', role: 'Flight engineer' },
  { id: 'aiko', name: 'Aiko Mori', role: 'Mission specialist' },
  { id: 'samir', name: 'Samir Haddad', role: 'Commander · Medical lead' },
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

const SUBJECT = 'UTMB-20'
type ResKey = 'hr' | 'sys' | 'dia' | 'temp' | 'weight'

function noise(k: ResKey, d: number, scale: number, cap: number): number {
  const series = (residuals.subjects as Record<string, Record<ResKey, number[]>>)[SUBJECT][k]
  const raw = series[(d - FIRST_DAY) % series.length] * scale
  return Math.max(-cap, Math.min(cap, raw))
}

/** Repeatable pseudo-random number in [0, 1). */
function rand(d: number, salt: number): number {
  let x = 374761393 ^ Math.imul(d + 1000, 668265263) ^ Math.imul(salt + 7, 2246822519)
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
    v: round(v, key === 'radiation' ? 3 : def.decimals),
    v2: v2 === undefined ? undefined : Math.round(v2),
    activity: 'rest',
    source: def.source,
    provenance: def.provenance,
  }
}

function buildReadings(p: Person): Partial<Record<IndicatorKey, Reading[]>> {
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
    rr: [],
    glucose: [],
    intake: [],
    hydration: [],
    hearing: [],
    cognition: [],
    balance: [],
    o2: [],
    noise: [],
    water: [],
  }
  let dose = pf.radiation!.v
  // Illustrative correlated drift, not a calibrated physiology or radiation model.
  let recoveryDrift = 0
  let thermalDrift = 0
  let exposureDrift = 0
  for (let d = FIRST_DAY; d <= LAST_DAY; d++) {
    const flight = d >= 0
    const settle = flight ? 1 - Math.exp(-d / 10) : 0

    recoveryDrift = .78 * recoveryDrift + (rand(d, 21) - .5) * 3.2
    thermalDrift = .82 * thermalDrift + (rand(d, 22) - .5) * .14
    exposureDrift = .85 * exposureDrift + (rand(d, 23) - .5) * .075
    const hr = pf.hr!.v + (flight ? 2 : 0) + noise('hr', d, 0.55, 4) + recoveryDrift
    out.hr!.push(reading('hr', d + 0.3125, hr))

    // Blood pressure runs lower in flight.
    let sys = pf.bp!.v - 9 * settle + noise('sys', d, 0.4, 4)
    let dia = pf.bp!.v2! - 6 * settle + noise('dia', d, 0.4, 4)
    // The scene: blood pressure has been low for two mornings, so there is something to talk to the doctor about.
    if (d === SCENE_DAY - 1) { sys = 89; dia = 58 }
    if (d === SCENE_DAY) { sys = 86; dia = 54 }
    out.bp!.push(reading('bp', d + 0.3125, sys, dia))

    out.spo2!.push(reading('spo2', d + 0.3125, 97 + Math.floor(rand(d, 1) * 3)))
    out.rr!.push(reading('rr', d + 0.33, 13 + Math.floor(rand(d, 31) * 4)))
    if ((d - FIRST_DAY) % 3 === 1) out.glucose!.push(reading('glucose', d + 0.27, 86 + Math.floor(rand(d, 32) * 8)))
    out.intake!.push(reading('intake', d + 0.7, 92 + Math.floor(rand(d, 33) * 10)))
    out.hydration!.push(reading('hydration', d + 0.72, 2.4 + rand(d, 34) * 0.5))
    if (d % 14 === 0) out.hearing!.push(reading('hearing', d + 0.4, Math.floor(rand(d, 37) * 4)))
    if (d % 7 === 0) out.cognition!.push(reading('cognition', d + 0.45, 90 + Math.floor(rand(d, 36) * 6)))
    out.o2!.push(reading('o2', d + 0.2, 156 + Math.floor(rand(d, 35) * 8)))
    out.noise!.push(reading('noise', d + 0.21, 48 + Math.floor(rand(d, 38) * 6)))
    if (d % 7 === 0) out.water!.push(reading('water', d + 0.22, 0.25 + rand(d, 39) * 0.15))

    // Body temperature rises about 1 °C in flight and levels off near day 75.
    let temp = pf.temp!.v + (flight ? 1.0 * (1 - Math.exp(-d / 22)) : 0) + noise('temp', d, 0.4, 0.15) + thermalDrift
    if (d === SCENE_DAY) temp = 38.0
    out.temp!.push(reading('temp', d + 0.3, temp))

    // Weight every third day.
    if ((d - FIRST_DAY) % 3 === 1) {
      const w = pf.weight!.v - (flight ? 1.4 * (1 - Math.exp(-d / 120)) : 0) + noise('weight', d, 0.5, 0.4)
      out.weight!.push(reading('weight', d + 0.28, w))
    }

    if ((SCENE_DAY - d) % 14 === 0) out.vision!.push(reading('vision', d + 0.31, 0))

    let sleep = pf.sleep!.v - (flight ? 0.5 : 0) + (rand(d, 2) - 0.5)
    sleep = Math.max(6.1, sleep)
    out.sleep!.push(reading('sleep', d + 0.29, sleep))

    if (d >= 1) out.exercise!.push(reading('exercise', d, 118 + Math.floor(rand(d, 3) * 30)))

    // Radiation adds up: faster in deep space, slower on the surface of Mars.
    dose += doseRate(d) * (1 + exposureDrift)
    out.radiation!.push(reading('radiation', d, dose))

    // The standing test is only done where there is gravity, once a week.
    if (flight && phaseFor(d).place !== 'spacecraft' && d % 7 === 0) {
      out.standing!.push(reading('standing', d + 0.33, 6 + Math.floor(rand(d, 6) * 9)))
      out.balance!.push(reading('balance', d + 0.35, 26 + Math.floor(rand(d, 40) * 5)))
    }
  }
  return out
}

function buildCheckIns(): CheckIn[] {
  const list: CheckIn[] = []
  for (let d = 0; d <= LAST_DAY; d++) {
    // Lena checks in during the evening, so today's check-in is always still open.
    list.push({ t: d + 0.875, feel: 'Fine', symptoms: [], mood: 3 + Math.floor(rand(d, 4) * 2), team: 3 + Math.floor(rand(d, 9) * 3) })
  }
  return list
}

/** One simulated daily sample of a 1-hour mean cabin ppCO2. */
function buildCabin(): Reading[] {
  const out: Reading[] = []
  for (let d = 0; d <= LAST_DAY; d++) {
    out.push(reading('cabin', d + 8 / 24, 2.2 + rand(d, 5) * 0.6))
  }
  return out
}

export function initialState(): AppState {
  return {
    day: SCENE_DAY,
    place: phaseFor(SCENE_DAY).place,
    readings: { [LENA.id]: buildReadings(LENA) },
    cabin: buildCabin(),
    checkins: { [LENA.id]: buildCheckIns() },
  }
}
