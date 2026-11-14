import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { metrics } from './dashboard'
import { judge } from './judge'
import { applyHealthSystem } from './store'

describe('health system selection', () => {
  it('changes environment and its rules without rewriting recorded measurements', () => {
    const original = initialState()
    const planet = applyHealthSystem(original, 'planet')
    expect(planet.place).toBe('surface')
    expect(planet.day).toBe(original.day)
    expect(planet.readings).toBe(original.readings)
    expect(planet.checkins).toBe(original.checkins)
    expect(judge(planet, LENA, 'standing').status).toBe('stale')
    expect(metrics(planet, LENA).find((m) => m.key === 'radiation')?.warning).toBe(.9)
    const flight = applyHealthSystem(planet, 'flight')
    expect(flight.place).toBe('spacecraft')
    expect(judge(flight, LENA, 'standing').status).toBe('unavailable')
    expect(metrics(flight, LENA).find((m) => m.key === 'radiation')?.warning).toBe(1.3)
    expect(flight.readings).toBe(original.readings)
  })
})
