import { describe, expect, it } from 'vitest'
import { CREW, initialState } from '../data/demo'
import { INDICATOR_ORDER } from './indicators'
import { attention, canSee, checkedInToday, judge, overallStatus, regionStatus } from './judge'
import type { AppState, Person } from './types'

const person = (id: string): Person => CREW.find((p) => p.id === id)!
const statuses = (s: AppState, id: string) =>
  Object.fromEntries(INDICATOR_ORDER.map((k) => [k, judge(s, person(id), k).status]))

describe('demo crew on mission day 100', () => {
  const s = initialState()

  it('Lena: everything in range, 38.0 °C is not a fever (SH2)', () => {
    const st = statuses(s, 'lena')
    expect(judge(s, person('lena'), 'temp').latest?.v).toBe(38)
    expect(st.temp).toBe('ok')
    expect(st.standing).toBe('unavailable')
    expect(overallStatus(s, person('lena'))).toBe('ok')
    expect(attention(s, person('lena'))).toEqual([])
    expect(checkedInToday(s, 'lena')).toBe(false)
  })

  it('Tomás: heart rate caution and a headache on the head (SH3)', () => {
    expect(statuses(s, 'tomas').hr).toBe('caution')
    expect(regionStatus(s, person('tomas'), person('tomas'), 'head')).toBe('caution')
    expect(attention(s, person('tomas')).length).toBe(2)
  })

  it('Aiko: one high blood pressure is a repeat, old weight is not green (SH6, SH8)', () => {
    const st = statuses(s, 'aiko')
    expect(st.bp).toBe('repeat')
    expect(st.weight).toBe('stale')
    expect(overallStatus(s, person('aiko'))).toBe('repeat')
    expect(attention(s, person('aiko')).length).toBe(2)
  })

  it('Samir: short sleep caution, bone load modelled and in range (SH5)', () => {
    const st = statuses(s, 'samir')
    expect(st.sleep).toBe('caution')
    expect(st.bone).toBe('ok')
    expect(attention(s, person('samir')).length).toBe(1)
  })
})

describe('fake logic', () => {
  it('a second out-of-range reading confirms caution; an in-range one clears it', () => {
    const s = initialState()
    const add = (v: number, v2: number, t: number) =>
      s.readings.aiko.bp!.push({ t, v, v2, activity: 'rest', source: 'Entered by hand', provenance: 'SIMULATED' })
    add(136, 84, 100.33)
    expect(judge(s, person('aiko'), 'bp').status).toBe('caution')
    add(112, 70, 100.34)
    expect(judge(s, person('aiko'), 'bp').status).toBe('ok')
  })

  it('a reading after exercise is ignored by the resting rule (SH7)', () => {
    const s = initialState()
    s.readings.lena.temp!.push({ t: 100.33, v: 39.0, activity: 'after', source: 'Entered by hand', provenance: 'SIMULATED' })
    expect(judge(s, person('lena'), 'temp').status).toBe('ok')
  })

  it('a reading older than its maximum age is stale (SH8)', () => {
    const s = initialState()
    s.readings.lena.hr = s.readings.lena.hr!.filter((r) => r.t < 99)
    expect(judge(s, person('lena'), 'hr').status).toBe('stale')
  })

  it('the scripted events pass: a week later everyone is back in range', () => {
    const s = { ...initialState(), day: 110 }
    for (const p of CREW) expect(attention(s, p), p.id).toEqual([])
  })

  it('on Mars the standing test has readings', () => {
    const s = { ...initialState(), day: 300, place: 'surface' as const }
    expect(judge(s, person('lena'), 'standing').status).toBe('ok')
  })

  it('the standing test follows the place (SH4)', () => {
    const s = initialState()
    expect(judge(s, person('lena'), 'standing').status).toBe('unavailable')
    expect(judge({ ...s, place: 'surface' }, person('lena'), 'standing').status).toBe('stale')
    expect(judge({ ...s, place: 'landing' }, person('lena'), 'standing').status).not.toBe('unavailable')
  })

  it('mood is visible only to its author; the medical lead sees the rest', () => {
    expect(canSee(person('samir'), person('lena'), 'mood')).toBe(false)
    expect(canSee(person('samir'), person('lena'), 'hr')).toBe(true)
    expect(canSee(person('lena'), person('tomas'), 'hr')).toBe(true)
    expect(canSee(person('lena'), person('tomas'), 'bp')).toBe(false)
  })

  it('no one in the demo crew is flagged on earlier in-range days by noise alone', () => {
    const s = initialState()
    for (const day of [20, 40, 60, 80, 90]) {
      expect(attention({ ...s, day }, person('lena')), `day ${day}`).toEqual([])
    }
  })
})
