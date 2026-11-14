import { describe, expect, it } from 'vitest'
import { ARRIVAL_DAY, DEPARTURE_DAY, LANDING_DAY, craftAt, earthAt, marsAt, phaseFor, positionAt } from './mission'

const gap = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

describe('mission plan', () => {
  it('has the shape of a conjunction-class Mars mission', () => {
    expect(ARRIVAL_DAY).toBe(259)
    expect(DEPARTURE_DAY).toBeGreaterThan(680)
    expect(DEPARTURE_DAY).toBeLessThan(740)
    expect(LANDING_DAY).toBeGreaterThan(940)
    expect(LANDING_DAY).toBeLessThan(1000)
  })

  it('the spacecraft meets Mars on arrival and Earth on landing', () => {
    expect(gap(craftAt(ARRIVAL_DAY - 0.5), marsAt(ARRIVAL_DAY - 0.5))).toBeLessThan(0.02)
    expect(gap(craftAt(DEPARTURE_DAY + 0.6), marsAt(DEPARTURE_DAY + 0.6))).toBeLessThan(0.02)
    expect(gap(craftAt(LANDING_DAY - 0.6), earthAt(LANDING_DAY - 0.6))).toBeLessThan(0.02)
  })

  it('knows the phase, place, and signal delay for a day', () => {
    expect(phaseFor(100).key).toBe('outbound')
    expect(phaseFor(300).place).toBe('surface')
    expect(phaseFor(800).key).toBe('return')
    expect(positionAt(0).delayMin).toBeCloseTo(0, 1)
    const worst = Math.max(...Array.from({ length: 973 }, (_, d) => positionAt(d).delayMin))
    expect(worst).toBeGreaterThan(20)
    expect(worst).toBeLessThan(22.5)
  })
})
