import type { Place } from './types'

/**
 * The mission plan: a conjunction-class Mars mission with fixed phase days.
 * The app only needs to know the phase and the place for a mission day.
 */

export const ARRIVAL_DAY = 259
export const DEPARTURE_DAY = 713
export const LANDING_DAY = 972
/** Last day the simulation covers: a short recovery period after landing. */
export const SIM_END = LANDING_DAY + 18

export type PhaseKey = 'outbound' | 'surface' | 'return' | 'home'

export interface Phase {
  key: PhaseKey
  label: string
  place: Place
  start: number
  end: number
}

export const PHASES: Phase[] = [
  { key: 'outbound', label: 'Outbound to Mars', place: 'spacecraft', start: 0, end: ARRIVAL_DAY },
  { key: 'surface', label: 'On Mars', place: 'surface', start: ARRIVAL_DAY, end: DEPARTURE_DAY },
  { key: 'return', label: 'Return to Earth', place: 'spacecraft', start: DEPARTURE_DAY, end: LANDING_DAY },
  { key: 'home', label: 'Back on Earth', place: 'landing', start: LANDING_DAY, end: SIM_END },
]

export function phaseFor(day: number): Phase {
  return PHASES.find((p) => day < p.end) ?? PHASES[PHASES.length - 1]
}

/** Radiation dose per day, in mSv: deep space while travelling, lower on the surface of Mars. */
export function doseRate(day: number): number {
  const p = phaseFor(day).key
  if (day < 0 || p === 'home') return 0
  return p === 'surface' ? 0.67 : 1.8
}
