import { describe, expect, it } from 'vitest'
import { PROBLEMS, RULES, score, type Problem } from './missRate'

const problem = (key: string): Problem => PROBLEMS.find((p) => p.key === key)!
const caughtOf = (key: string, rule: 'earth2' | 'orbit2') => {
  const s = score(problem(key))
  return [Math.round(s.caughtClean[rule] * s.nClean[rule]), s.nClean[rule]]
}

// Counts below come from app/scripts/miss_rate_check.py, a separate Python script on the same NASA data,
// not copied from this code. It matches this code in all 65 cells. Clean windows only: no alarm on that vital before the problem was planted.
describe('planted problems in NASA bed-rest data, same two-day rule on both sides', () => {
  it('fever +1.0 °C for 3 days: Earth catches 6 of 78, ORBIT 73 of 78', () => {
    expect(caughtOf('fever-1.0', 'earth2')).toEqual([6, 78])
    expect(caughtOf('fever-1.0', 'orbit2')).toEqual([73, 78])
  })

  it('heart rate +20 bpm for 5 days: Earth catches 17 of 84, ORBIT 74 of 80', () => {
    expect(caughtOf('hr-20', 'earth2')).toEqual([17, 84])
    expect(caughtOf('hr-20', 'orbit2')).toEqual([74, 80])
  })

  it('slow heart-rate drift of 0.5 bpm a day: Earth catches 8 of 57, ORBIT 29 of 41', () => {
    expect(caughtOf('drift-0.5', 'earth2')).toEqual([8, 57])
    expect(caughtOf('drift-0.5', 'orbit2')).toEqual([29, 41])
  })

  it('a small blood pressure rise (+15/+9) is where Earth limits do better: 36 of 72 against 22 of 84', () => {
    expect(caughtOf('bp-up-15', 'earth2')).toEqual([36, 72])
    expect(caughtOf('bp-up-15', 'orbit2')).toEqual([22, 84])
  })

  it('neither rule set in the Replay looks at drops: a blood pressure drop is missed by every rule', () => {
    for (const key of ['bp-down-20', 'bp-down-30']) {
      const s = score(problem(key))
      for (const { key: rule } of RULES) expect(s.caughtClean[rule], `${key} ${rule}`).toBe(0)
    }
  })
})

describe('scoring', () => {
  it('a planted problem of size zero is never "caught" in a clean window', () => {
    const nothing: Problem = { key: 'none', name: 'nothing', days: 3, vitals: ['temp'], change: () => 0 }
    const s = score(nothing)
    for (const { key } of RULES) {
      expect(s.caughtClean[key]).toBe(0)
      expect(s.caught[key]).toBeCloseTo(s.background[key], 10)
    }
  })

  it('a huge problem is caught by every rule; windows with no readings are left out', () => {
    const huge: Problem = { key: 'huge', name: 'huge', days: 3, vitals: ['temp'], change: () => 3 }
    const s = score(huge)
    for (const { key } of RULES) expect(s.caughtClean[key], key).toBe(1)
  })

  it('a two-day rule needs two days inside the window: a 1-day problem is never caught by it', () => {
    const oneDay: Problem = { key: 'one', name: 'one day', days: 1, vitals: ['temp'], change: () => 3 }
    const s = score(oneDay)
    expect(s.caughtClean.earth2).toBe(0)
    expect(s.caughtClean.orbit2).toBe(0)
    expect(s.caughtClean.earth1).toBe(1)
    expect(s.caughtClean.orbit1).toBe(1)
  })

  it('a two-day rule needs the same vital on both days', () => {
    // Temperature high on day 0 only, heart rate high on day 1 only; the other vital is pushed far
    // down on each day so a real reading cannot cross by itself. No vital is over twice.
    const swap: Problem = {
      key: 'swap', name: 'swap', days: 2, vitals: ['temp', 'hr'],
      change: (v, i) => (v === 'temp' ? (i === 0 ? 3 : -10) : i === 1 ? 60 : -100),
    }
    const s = score(swap)
    expect(s.caughtClean.orbit2).toBe(0)
    expect(s.caughtClean.earth2).toBe(0)
  })

  it('days to alarm: same day for single-day rules, at least one day later for two-day rules', () => {
    const huge: Problem = { key: 'huge', name: 'huge', days: 3, vitals: ['temp'], change: () => 3 }
    const s = score(huge)
    expect(s.delay.earth1).toBeLessThan(0.1)
    expect(s.delay.orbit1).toBeLessThan(0.1)
    expect(s.delay.earth2).toBeGreaterThanOrEqual(1)
    expect(s.delay.orbit2).toBeGreaterThanOrEqual(1)
  })

  it('bigger problems are caught at least as often as smaller ones', () => {
    for (const family of [['fever-0.5', 'fever-1.0', 'fever-1.5'], ['hr-10', 'hr-20', 'hr-30'], ['bp-up-15', 'bp-up-25', 'bp-up-35']]) {
      const scores = family.map((k) => score(problem(k)))
      for (const { key } of RULES) {
        for (let i = 1; i < scores.length; i++) expect(scores[i].caughtClean[key], `${family[i]} ${key}`).toBeGreaterThanOrEqual(scores[i - 1].caughtClean[key])
      }
    }
  })
})
