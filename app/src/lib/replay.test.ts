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

  it('a subject whose normal runs high is flooded by Earth cutoffs', () => {
    expect(count('UTMB-01')).toEqual({ days: 90, earth: 54, orbit: 1 })
    expect(mainVital(judgeSubject(subjectById('UTMB-01')!))).toBe('dia')
  })

  it('a slow heart-rate rise is seen only against the personal baseline', () => {
    expect(count('UTMB-40')).toEqual({ days: 60, earth: 1, orbit: 10 })
    expect(mainVital(judgeSubject(subjectById('UTMB-40')!))).toBe('hr')
  })
})
