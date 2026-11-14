import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { metrics } from './dashboard'
import { judge } from './judge'
import { phaseFor } from './mission'

describe('mission place', () => {
  it('follows the mission day, so day 100 is the outbound spacecraft', () => {
    const state = initialState()
    expect(state.place).toBe(phaseFor(state.day).place)
    expect(state.place).toBe('spacecraft')
    expect(judge(state, LENA, 'standing').status).toBe('unavailable')
    expect(metrics(state, LENA).find((m) => m.key === 'radiation')?.warning).toBe(1.3)
  })
})
