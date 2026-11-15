import { SUBJECTS, earthOver, personalLimit, strictOver, type Day, type Subject, type Vital } from './replay'

/**
 * How many real problems each rule set misses.
 *
 * The NASA bed-rest data has no real illness, so known problems are planted on top of each
 * volunteer's real readings: a fever, a heart-rate jump, a slow heart-rate drift, a blood-pressure
 * rise and a blood-pressure drop, each in several sizes. A rule "catches" a problem when it
 * alarms on that vital inside the problem window. The same window without the planted problem is
 * scored too ("background"): an alarm that would have happened anyway is not a real catch.
 */

export type RuleKey = 'earth1' | 'earth2' | 'strict' | 'orbit1' | 'orbit2'

export const RULES: { key: RuleKey; name: string }[] = [
  { key: 'earth1', name: 'Earth limits, single day' },
  { key: 'earth2', name: 'Earth limits, 2 days in a row' },
  { key: 'strict', name: 'Stricter Earth (140/90), single day' },
  { key: 'orbit1', name: 'ORBIT, single day' },
  { key: 'orbit2', name: 'ORBIT, 2 days in a row' },
]

export interface Problem {
  key: string
  name: string
  /** Days the problem lasts. */
  days: number
  /** Vitals whose alarm counts as catching it. */
  vitals: Vital[]
  /** Change added to the real reading on day i of the problem (0-based). */
  change: (v: Vital, i: number) => number
}

const only = (target: Vital[], size: (v: Vital) => number) => (v: Vital) => (target.includes(v) ? size(v) : 0)

function steady(key: string, name: string, days: number, vitals: Vital[], size: (v: Vital) => number): Problem {
  const f = only(vitals, size)
  return { key, name, days, vitals, change: (v) => f(v) }
}

export const PROBLEMS: Problem[] = [
  steady('fever-0.5', 'Fever +0.5 °C, 3 days', 3, ['temp'], () => 0.5),
  steady('fever-1.0', 'Fever +1.0 °C, 3 days', 3, ['temp'], () => 1.0),
  steady('fever-1.5', 'Fever +1.5 °C, 3 days', 3, ['temp'], () => 1.5),
  steady('hr-10', 'Heart rate +10 bpm, 5 days', 5, ['hr'], () => 10),
  steady('hr-20', 'Heart rate +20 bpm, 5 days', 5, ['hr'], () => 20),
  steady('hr-30', 'Heart rate +30 bpm, 5 days', 5, ['hr'], () => 30),
  { key: 'drift-0.5', name: 'Heart rate drifts up 0.5 bpm a day, 30 days', days: 30, vitals: ['hr'], change: (v, i) => (v === 'hr' ? 0.5 * (i + 1) : 0) },
  { key: 'drift-1.0', name: 'Heart rate drifts up 1 bpm a day, 30 days', days: 30, vitals: ['hr'], change: (v, i) => (v === 'hr' ? 1.0 * (i + 1) : 0) },
  steady('bp-up-15', 'Blood pressure +15/+9, 3 days', 3, ['sys', 'dia'], (v) => (v === 'sys' ? 15 : 9)),
  steady('bp-up-25', 'Blood pressure +25/+15, 3 days', 3, ['sys', 'dia'], (v) => (v === 'sys' ? 25 : 15)),
  steady('bp-up-35', 'Blood pressure +35/+21, 3 days', 3, ['sys', 'dia'], (v) => (v === 'sys' ? 35 : 21)),
  steady('bp-down-20', 'Blood pressure −20/−12, 3 days', 3, ['sys', 'dia'], (v) => (v === 'sys' ? -20 : -12)),
  steady('bp-down-30', 'Blood pressure −30/−18, 3 days', 3, ['sys', 'dia'], (v) => (v === 'sys' ? -30 : -18)),
]

/** Bed-rest days (0-based positions in a volunteer's record) where problems start. */
export const STARTS = [20, 35, 50]

/** Whether one vital is over a rule's line on one day. */
function over(rule: RuleKey, s: Subject, d: Day, v: Vital): boolean {
  const x = d.values[v]
  if (x === null) return false
  if (rule === 'earth1' || rule === 'earth2') return earthOver(v, x)
  if (rule === 'strict') return strictOver(v, x)
  const limit = personalLimit(v, s.baseline)
  return limit !== null && x >= limit
}

/**
 * The first position inside the window (0-based from its start) where the rule alarms on one of
 * the vitals, or -1. Two-day rules need the same vital over on that day and the day before, both
 * inside the window.
 */
export function firstAlarm(rule: RuleKey, s: Subject, window: Day[], vitals: Vital[]): number {
  const twoDay = rule === 'earth2' || rule === 'orbit2'
  for (let k = twoDay ? 1 : 0; k < window.length; k++) {
    if (vitals.some((v) => over(rule, s, window[k], v) && (!twoDay || over(rule, s, window[k - 1], v)))) return k
  }
  return -1
}

/** A copy of the volunteer with the problem added to their real readings from position `start`. */
export function plant(s: Subject, p: Problem, start: number): Subject {
  return {
    ...s,
    days: s.days.map((d, i) => {
      const k = i - start
      if (k < 0 || k >= p.days) return d
      const values = { ...d.values }
      for (const v of p.vitals) if (values[v] !== null) values[v] = values[v]! + p.change(v, k)
      return { ...d, values }
    }),
  }
}

export interface Score {
  /** Problems planted. */
  n: number
  /** Share caught: an alarm on a problem vital inside the window. */
  caught: Record<RuleKey, number>
  /** Share of the same windows that alarm on those vitals with nothing planted. */
  background: Record<RuleKey, number>
  /**
   * The fair measure: among windows with no alarm before anything was planted, the share caught.
   * No free catches from alarms that would have happened anyway.
   */
  caughtClean: Record<RuleKey, number>
  /** Number of clean windows per rule. */
  nClean: Record<RuleKey, number>
  /** Mean days from the start of the problem to the first alarm, over clean catches only. */
  delay: Record<RuleKey, number | null>
}

const zero = (): Record<RuleKey, number> => ({ earth1: 0, earth2: 0, strict: 0, orbit1: 0, orbit2: 0 })

export function score(p: Problem, subjects: Subject[] = SUBJECTS, starts: number[] = STARTS): Score {
  const caught = zero()
  const background = zero()
  const cleanN = zero()
  const cleanCaught = zero()
  const delaySum = zero()
  let n = 0
  for (const s of subjects) {
    for (const start of starts) {
      if (start + p.days > s.days.length) continue
      // Skip what no rule could judge, so all rules see the same cases: a volunteer without a
      // baseline for a problem vital, or a window with no reading of any problem vital.
      if (p.vitals.some((v) => s.baseline[v] === null)) continue
      const cleanWindow = s.days.slice(start, start + p.days)
      if (!cleanWindow.some((d) => p.vitals.some((v) => d.values[v] !== null))) continue
      n++
      const sickWindow = plant(s, p, start).days.slice(start, start + p.days)
      for (const { key } of RULES) {
        const first = firstAlarm(key, s, sickWindow, p.vitals)
        if (first >= 0) caught[key]++
        if (firstAlarm(key, s, cleanWindow, p.vitals) >= 0) background[key]++
        else {
          cleanN[key]++
          if (first >= 0) {
            cleanCaught[key]++
            delaySum[key] += first
          }
        }
      }
    }
  }
  const share = (r: Record<RuleKey, number>) => Object.fromEntries(RULES.map(({ key }) => [key, n ? r[key] / n : 0])) as Record<RuleKey, number>
  const delay = Object.fromEntries(RULES.map(({ key }) => [key, cleanCaught[key] ? delaySum[key] / cleanCaught[key] : null])) as Record<RuleKey, number | null>
  const caughtClean = Object.fromEntries(RULES.map(({ key }) => [key, cleanN[key] ? cleanCaught[key] / cleanN[key] : 0])) as Record<RuleKey, number>
  return { n, caught: share(caught), background: share(background), caughtClean, nClean: cleanN, delay }
}
