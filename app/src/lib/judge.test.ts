import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { INDICATOR_ORDER } from './indicators'
import { attention, checkedInToday, judge, regionStatus } from './judge'
import type { AppState, IndicatorKey, Reading } from './types'

const statuses = (s: AppState) => Object.fromEntries(INDICATOR_ORDER.map((k) => [k, judge(s, LENA, k).status]))
/** The demo state without its low blood pressure, for tests that need everything in range. */
function calm(): AppState {
  const s = initialState()
  s.readings.lena.bp!.filter((r) => r.t > 99).forEach((r) => { r.v = 110; r.v2 = 66 })
  return s
}
const add = (s: AppState, k: IndicatorKey, t: number, v: number, v2?: number) =>
  s.readings.lena[k]!.push({ t, v, v2, activity: 'rest', source: 'Entered by hand', provenance: 'MEASURED' } satisfies Reading)

describe('Lena on mission day 100', () => {
  const s = initialState()

  it('only the low blood pressure stands out, and 38.0 °C is not a fever (SH2)', () => {
    const st = statuses(s)
    expect(judge(s, LENA, 'temp').latest?.v).toBe(38)
    expect(st.temp).toBe('ok')
    expect(st.standing).toBe('unavailable')
    expect(st.balance).toBe('unavailable')
    expect(st.rr).toBe('ok')
    expect(st.glucose).toBe('ok')
    expect(st.o2).toBe('ok')
    expect(st.bone).toBe('ok')
    expect(st.bp).toBe('caution')
    expect(judge(s, LENA, 'bp').arrow).toBe('↓')
    expect(attention(s, LENA).map((i) => i.key)).toEqual(['bp'])
    expect(attention(calm(), LENA)).toEqual([])
    expect(checkedInToday(s, 'lena')).toBe(false)
  })
})

describe('fake logic', () => {
  it('one high blood pressure is a repeat; a second confirms caution; an in-range one clears it (SH6)', () => {
    const s = calm()
    add(s, 'bp', 100.32, 145, 92)
    expect(judge(s, LENA, 'bp').status).toBe('repeat')
    expect(attention(s, LENA).length).toBe(1)
    add(s, 'bp', 100.33, 136, 84)
    expect(judge(s, LENA, 'bp').status).toBe('caution')
    add(s, 'bp', 100.34, 112, 70)
    expect(judge(s, LENA, 'bp').status).toBe('ok')
  })

  it('two low blood pressures in a row are a caution, and a high one after a low one is only a repeat', () => {
    const s = initialState()
    expect(judge(s, LENA, 'bp').status).toBe('caution')
    add(s, 'bp', 100.32, 145, 92)
    expect(judge(s, LENA, 'bp').status).toBe('repeat')
  })

  it('a reported headache marks the head (SH3)', () => {
    const s = calm()
    s.checkins.lena.push({ t: 100.32, feel: 'Not quite right', symptoms: [{ name: 'Headache', region: 'head' }], mood: 3 })
    expect(regionStatus(s, LENA, 'head')).toBe('caution')
    expect(attention(s, LENA).length).toBe(1)
  })

  it('three short nights are a sleep caution (SH5)', () => {
    const s = initialState()
    const last = s.readings.lena.sleep!.filter((r) => r.t > 98 && r.t < 101)
    expect(last.length).toBe(3)
    last.forEach((r, i) => (r.v = [5.4, 5.7, 5.2][i]))
    expect(judge(s, LENA, 'sleep').status).toBe('caution')
  })

  it('old weight is not green (SH8)', () => {
    const s = initialState()
    s.readings.lena.weight = s.readings.lena.weight!.filter((r) => r.t <= 88)
    expect(judge(s, LENA, 'weight').status).toBe('stale')
  })

  it('a reading after exercise is ignored by the resting rule (SH7)', () => {
    const s = initialState()
    s.readings.lena.temp!.push({ t: 100.33, v: 39.0, activity: 'after', source: 'Entered by hand', provenance: 'MEASURED' })
    expect(judge(s, LENA, 'temp').status).toBe('ok')
  })

  it('a reading older than its maximum age is stale (SH8)', () => {
    const s = initialState()
    s.readings.lena.hr = s.readings.lena.hr!.filter((r) => r.t < 99)
    expect(judge(s, LENA, 'hr').status).toBe('stale')
  })

  it('on Mars the standing test has readings', () => {
    const s = { ...initialState(), day: 300, place: 'surface' as const }
    expect(judge(s, LENA, 'standing').status).toBe('ok')
  })

  it('the standing test follows the place (SH4)', () => {
    const s = initialState()
    expect(judge(s, LENA, 'standing').status).toBe('unavailable')
    expect(judge({ ...s, place: 'surface' }, LENA, 'standing').status).toBe('stale')
    expect(judge({ ...s, place: 'landing' }, LENA, 'standing').status).not.toBe('unavailable')
  })

  it('nothing is flagged on other in-range days by noise alone', () => {
    const s = initialState()
    for (const day of [20, 40, 60, 80, 90, 110]) {
      expect(attention({ ...s, day }, LENA), `day ${day}`).toEqual([])
    }
  })
})
