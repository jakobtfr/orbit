import { describe, expect, it } from 'vitest'
import { judgeSubject, mainVital, subjectById, totals } from './replay'

const count = (id: string) => {
  const j = judgeSubject(subjectById(id)!)
  return { days: j.length, earth: j.filter((d) => d.earthAlarm).length, orbit: j.filter((d) => d.orbitAlarm).length }
}

describe('replay of the UTMB bed-rest data', () => {
  it('reproduces the data check: 25.5% of days for Earth cutoffs, 5.9% for personal rules', () => {
    const t = totals()
    expect(t.subjects).toBe(29)
    expect(t.days).toBe(2184)
    expect((t.earth / t.days) * 100).toBeCloseTo(25.5, 1)
    expect((t.orbit / t.days) * 100).toBeCloseTo(5.9, 1)
  })

  it('compares like with like: both rule sets on single days and on 2 days in a row', () => {
    const t = totals()
    const share = (n: number) => (n / t.days) * 100
    expect(share(t.earth)).toBeCloseTo(25.5, 1)
    expect(share(t.earthConfirmed)).toBeCloseTo(13.5, 1)
    expect(share(t.orbitSingle)).toBeCloseTo(16.5, 1)
    expect(share(t.orbit)).toBeCloseTo(5.9, 1)
    // Same 2-day rule on both sides: about 2.3 times fewer alarms.
    expect(t.earthConfirmed / t.orbit).toBeGreaterThan(2.2)
    expect(t.earthConfirmed / t.orbit).toBeLessThan(2.4)
  })

  it('a stricter Earth cutoff (140/90) alarms on about 5.4% of days but still misses the slow heart-rate rise', () => {
    const t = totals()
    expect((t.earthStrict / t.days) * 100).toBeCloseTo(5.4, 1)
    const forty = judgeSubject(subjectById('UTMB-40')!)
    expect(forty.filter((d) => d.earthStrict).length).toBe(1)
    expect(forty.filter((d) => d.earthConfirmed).length).toBe(0)
    expect(forty.filter((d) => d.orbitAlarm).length).toBe(10)
  })

  it('with the same two-day rule, the volunteer whose normal runs high still gets 30 Earth alarms in 90 days and 1 from ORBIT', () => {
    const j = judgeSubject(subjectById('UTMB-01')!)
    expect(j.filter((d) => d.earthConfirmed).length).toBe(30)
    expect(j.filter((d) => d.orbitAlarm).length).toBe(1)
  })

  it('a subject whose normal runs high is flooded by Earth cutoffs', () => {
    expect(count('UTMB-01')).toEqual({ days: 90, earth: 54, orbit: 1 })
    expect(mainVital(judgeSubject(subjectById('UTMB-01')!))).toBe('dia')
  })

  it('a slow heart-rate rise is seen only against the personal baseline', () => {
    expect(count('UTMB-40')).toEqual({ days: 60, earth: 1, orbit: 10 })
    expect(mainVital(judgeSubject(subjectById('UTMB-40')!))).toBe('hr')
  })
})
