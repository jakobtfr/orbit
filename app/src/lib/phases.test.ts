import { describe, expect, it } from 'vitest'
import { ARRIVAL_DAY, DEPARTURE_DAY, LANDING_DAY } from './mission'
import { ADAPT_WIDEN, modelShift, personalNormal, phaseAt, widen } from './phases'

// Expected values come from NASA's UTMB bed-rest data (docs/research/phase-limits.md), not from the code.

describe('mission phase at a time', () => {
  it('knows the place and whether the body is still adapting', () => {
    expect(phaseAt(-5).segment.gravity).toBe('earth')
    expect(phaseAt(-5).adapting).toBe(false)
    expect(phaseAt(3).segment.gravity).toBe('micro')
    expect(phaseAt(3).adapting).toBe(true)
    expect(phaseAt(100).adapting).toBe(false)
    expect(phaseAt(ARRIVAL_DAY + 2).segment.gravity).toBe('mars')
    expect(phaseAt(ARRIVAL_DAY + 2).adapting).toBe(true)
    expect(phaseAt(DEPARTURE_DAY + 1).segment.gravity).toBe('micro')
    expect(phaseAt(LANDING_DAY + 1).segment.gravity).toBe('earth')
    expect(phaseAt(LANDING_DAY + 1).adapting).toBe(true)
    expect(widen(LANDING_DAY + 1)).toBe(ADAPT_WIDEN)
    expect(widen(100)).toBe(1)
  })
})

describe('expected change from pre-flight', () => {
  it('is zero before flight', () => {
    for (const v of ['hr', 'sys', 'dia', 'temp'] as const) expect(modelShift(v, -3)).toBe(0)
  })

  it('in months of weightlessness: heart rate +2 bpm, blood pressure unchanged (NASA bed rest), temperature +1 °C (outside NASA)', () => {
    expect(modelShift('hr', 100)).toBeCloseTo(2, 1)
    expect(modelShift('sys', 100)).toBeCloseTo(0, 1)
    expect(modelShift('dia', 100)).toBeCloseTo(1, 1)
    expect(modelShift('temp', 100)).toBeGreaterThan(0.95)
    expect(modelShift('temp', 100)).toBeLessThanOrEqual(1.0)
  })

  it('temperature rises slowly: small in the first days, most of it by day 75', () => {
    expect(modelShift('temp', 2)).toBeLessThan(0.15)
    expect(modelShift('temp', 75)).toBeGreaterThan(0.9)
  })

  it('after landing, heart rate runs high and fades: about +12 on days 0–3, +7 on days 4–7 (NASA bed rest)', () => {
    expect(modelShift('hr', LANDING_DAY + 1.5)).toBeGreaterThan(9)
    expect(modelShift('hr', LANDING_DAY + 1.5)).toBeLessThan(13)
    expect(modelShift('hr', LANDING_DAY + 5.5)).toBeGreaterThan(5)
    expect(modelShift('hr', LANDING_DAY + 5.5)).toBeLessThan(9)
    expect(modelShift('hr', LANDING_DAY + 60)).toBeCloseTo(0, 0)
    expect(modelShift('sys', LANDING_DAY + 60)).toBeCloseTo(0, 1)
  })

  it('every value says where it comes from', () => {
    for (const day of [-5, 100, ARRIVAL_DAY + 30, LANDING_DAY + 2]) {
      for (const v of ['hr', 'sys', 'dia', 'temp'] as const) {
        expect(personalNormal(v, 70, [], day).source.length).toBeGreaterThan(10)
      }
    }
    expect(personalNormal('temp', 36.8, [], 100).evidence).toBe('outside NASA')
    expect(personalNormal('hr', 62, [], 100).evidence).toBe('NASA data')
    expect(personalNormal('hr', 62, [], ARRIVAL_DAY + 30).evidence).toBe('estimate')
  })
})

describe('personal normal', () => {
  const pre = 72
  const flat = (from: number, to: number, v: (t: number) => number) =>
    Array.from({ length: to - from }, (_, i) => ({ t: from + i + 0.3, v: v(from + i) }))

  it('without readings, is the pre-flight value plus the expected change', () => {
    const n = personalNormal('dia', pre, [], 100)
    expect(n.value).toBeCloseTo(73, 0)
    expect(n.learned).toBe(false)
  })

  it('learns the person’s own offset after the body has settled', () => {
    const samples = flat(0, 100, (t) => pre + modelShift('dia', t) + 3)
    const n = personalNormal('dia', pre, samples, 100)
    expect(n.learned).toBe(true)
    expect(n.offset).toBeCloseTo(3, 1)
    expect(n.value).toBeCloseTo(76, 0)
  })

  it('never moves outside the research range, however far the readings sit', () => {
    const samples = flat(0, 100, (t) => pre + modelShift('dia', t) - 25)
    const n = personalNormal('dia', pre, samples, 100)
    expect(n.value).toBeGreaterThanOrEqual(n.range[0])
    expect(n.value).toBeCloseTo(n.range[0], 5)
  })

  it('does not learn a slow drift as the new normal', () => {
    // Settles at the expected value, then climbs 0.3 bpm a day from day 30.
    const hrPre = 62
    const samples = flat(0, 100, (t) => hrPre + (t > 30 ? (t - 30) * 0.3 : 0))
    const n = personalNormal('hr', hrPre, samples, 100)
    // The normal stays where the readings sat while it was learned (days 14–28), not where they drifted to (about 83).
    expect(n.value).toBeCloseTo(hrPre, 0)
  })

  it('carries the offset into the next phase until it can be learned again', () => {
    const samples = flat(0, ARRIVAL_DAY, (t) => pre + modelShift('dia', t) + 4)
    const n = personalNormal('dia', pre, samples, ARRIVAL_DAY + 5)
    expect(n.learned).toBe(false)
    expect(n.offset).toBeCloseTo(4, 1)
    expect(n.adapting).toBe(true)
  })

  it('learns only once the 14-day window is over, then holds the value', () => {
    const samples = flat(0, 40, (t) => pre + modelShift('dia', t) + 5)
    expect(personalNormal('dia', pre, samples, 20).learned).toBe(false)
    expect(personalNormal('dia', pre, samples, 20).offset).toBe(0)
    expect(personalNormal('dia', pre, samples, 30).learned).toBe(true)
    expect(personalNormal('dia', pre, samples, 30).offset).toBeCloseTo(5, 1)
  })

  it('ignores readings from after the time it is asked about', () => {
    const later = flat(14, 28, () => pre + 40)
    expect(personalNormal('dia', pre, later, 10).offset).toBe(0)
  })
})
