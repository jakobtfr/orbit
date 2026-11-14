import type { Place } from './types'

/**
 * The mission plan and where the spacecraft is on a given mission day.
 *
 * A simplified conjunction-class Mars mission: a Hohmann transfer out, a stay on the
 * surface until the planets line up again, and a Hohmann transfer back. Orbits are
 * treated as circles in one plane. Good enough to show where we are; not flight dynamics.
 */

const TAU = Math.PI * 2
const AU_KM = 149.6e6
const LIGHT_S_PER_AU = 499.0
const R_EARTH = 1
const R_MARS = 1.524
const W_EARTH = TAU / 365.25
const W_MARS = TAU / 686.98

const A = (R_EARTH + R_MARS) / 2
const ECC = (R_MARS - R_EARTH) / (R_MARS + R_EARTH)
/** Days for half of the transfer ellipse. */
export const TRANSFER_DAYS = 0.5 * Math.sqrt(A ** 3) * 365.25
/** Mars must be half an orbit ahead of the launch point when the spacecraft arrives. */
const MARS_START = Math.PI - W_MARS * TRANSFER_DAYS

function earthAngle(day: number): number {
  return W_EARTH * day
}
function marsAngle(day: number): number {
  return MARS_START + W_MARS * day
}

/** Day the return leg starts: the first day after arrival when Earth will be at the far end of the ellipse on landing day. */
const RETURN_START = (() => {
  const base = MARS_START + Math.PI - W_EARTH * TRANSFER_DAYS
  for (let k = 0; ; k++) {
    const d = (base + TAU * k) / (W_EARTH - W_MARS)
    if (d > TRANSFER_DAYS + 30) return d
  }
})()

export const ARRIVAL_DAY = Math.round(TRANSFER_DAYS)
export const DEPARTURE_DAY = Math.round(RETURN_START)
export const LANDING_DAY = Math.round(RETURN_START + TRANSFER_DAYS)
/** Last day the simulation covers: a short recovery period after landing. */
export const SIM_END = LANDING_DAY + 18

export type PhaseKey = 'outbound' | 'surface' | 'return' | 'home'

export interface Phase {
  key: PhaseKey
  label: string
  place: Place
  placeLabel: string
  start: number
  end: number
}

export const PHASES: Phase[] = [
  { key: 'outbound', label: 'Outbound to Mars', place: 'spacecraft', placeLabel: 'Spacecraft', start: 0, end: ARRIVAL_DAY },
  { key: 'surface', label: 'On Mars', place: 'surface', placeLabel: 'Surface base', start: ARRIVAL_DAY, end: DEPARTURE_DAY },
  { key: 'return', label: 'Return to Earth', place: 'spacecraft', placeLabel: 'Spacecraft', start: DEPARTURE_DAY, end: LANDING_DAY },
  { key: 'home', label: 'Back on Earth', place: 'landing', placeLabel: 'After landing', start: LANDING_DAY, end: SIM_END },
]

export function phaseFor(day: number): Phase {
  return PHASES.find((p) => day < p.end) ?? PHASES[PHASES.length - 1]
}

export function nextMilestone(day: number): { label: string; inDays: number } | undefined {
  const marks = [
    { label: 'Arrival at Mars', day: ARRIVAL_DAY },
    { label: 'Departure from Mars', day: DEPARTURE_DAY },
    { label: 'Landing on Earth', day: LANDING_DAY },
  ]
  const m = marks.find((x) => x.day > day)
  return m ? { label: m.label, inDays: m.day - day } : undefined
}

export interface Point {
  x: number
  y: number
}

function polar(r: number, angle: number): Point {
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) }
}

/** Position on the transfer ellipse for a mean anomaly, measured from the point closest to the Sun. */
function onEllipse(mean: number, perihelionAngle: number): Point {
  let e = mean
  for (let i = 0; i < 8; i++) e -= (e - ECC * Math.sin(e) - mean) / (1 - ECC * Math.cos(e))
  const r = A * (1 - ECC * Math.cos(e))
  const nu = 2 * Math.atan2(Math.sqrt(1 + ECC) * Math.sin(e / 2), Math.sqrt(1 - ECC) * Math.cos(e / 2))
  return polar(r, perihelionAngle + nu)
}

export function earthAt(day: number): Point {
  return polar(R_EARTH, earthAngle(day))
}
export function marsAt(day: number): Point {
  return polar(R_MARS, marsAngle(day))
}

function outboundAt(day: number): Point {
  return onEllipse((Math.PI * day) / TRANSFER_DAYS, 0)
}
function returnAt(day: number): Point {
  return onEllipse(Math.PI + (Math.PI * (day - RETURN_START)) / TRANSFER_DAYS, marsAngle(RETURN_START) - Math.PI)
}

export function craftAt(day: number): Point {
  if (day <= 0) return earthAt(0)
  if (day < TRANSFER_DAYS) return outboundAt(day)
  if (day < RETURN_START) return marsAt(day)
  if (day < RETURN_START + TRANSFER_DAYS) return returnAt(day)
  return earthAt(day)
}

function path(from: number, to: number, at: (d: number) => Point, steps = 60): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => at(from + ((to - from) * i) / steps))
}

export const OUTBOUND_PATH = path(0, TRANSFER_DAYS, outboundAt)
export const RETURN_PATH = path(RETURN_START, RETURN_START + TRANSFER_DAYS, returnAt)
export const ORBIT_RADII = { earth: R_EARTH, mars: R_MARS }

export interface Position {
  craft: Point
  earth: Point
  mars: Point
  /** Million km from Earth. */
  fromEarth: number
  /** Million km from Mars. */
  fromMars: number
  /** One-way signal delay to Earth, in minutes. */
  delayMin: number
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function positionAt(day: number): Position {
  const craft = craftAt(day)
  const earth = earthAt(day)
  const mars = marsAt(day)
  const au = dist(craft, earth)
  return {
    craft,
    earth,
    mars,
    fromEarth: (au * AU_KM) / 1e6,
    fromMars: (dist(craft, mars) * AU_KM) / 1e6,
    delayMin: (au * LIGHT_S_PER_AU) / 60,
  }
}

/** Radiation dose per day, in mSv: deep space while travelling, lower on the surface of Mars. */
export function doseRate(day: number): number {
  const p = phaseFor(day).key
  if (day < 0 || p === 'home') return 0
  return p === 'surface' ? 0.67 : 1.8
}
