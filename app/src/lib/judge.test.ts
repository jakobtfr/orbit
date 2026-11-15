import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { INDICATOR_ORDER } from './indicators'
import { LANDING_DAY } from './mission'
import { metrics } from './dashboard'
import { attention, baselines, chartGuide, checkedInToday, classify, judge, regionStatus } from './judge'
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

describe('limits follow the mission phase (NASA bed-rest data, docs/research/phase-limits.md)', () => {
  const at = (day: number): AppState => ({ ...calm(), day })
  const twice = (s: AppState, k: IndicatorKey, v: number, v2?: number) => {
    add(s, k, s.day + 0.32, v, v2)
    add(s, k, s.day + 0.33, v, v2)
  }

  it('a blood pressure that is low against Earth’s limits but usual for this person in flight is not an alarm', () => {
    // Lena is 120/72 before flight; in the demo her pressure settles about 9/6 lower in flight, and the app learns that.
    const s = at(100)
    twice(s, 'bp', 100, 55)
    expect(judge(s, LENA, 'bp').status).toBe('ok')
  })

  it('the same reading before flight is an alarm', () => {
    const s = at(-5)
    twice(s, 'bp', 100, 55)
    expect(judge(s, LENA, 'bp').status).toBe('caution')
  })

  it('a high heart rate in the first days back on Earth is not an alarm (+11.7 bpm is usual, NASA bed rest)', () => {
    const s = at(LANDING_DAY + 2)
    twice(s, 'hr', 80)
    expect(judge(s, LENA, 'hr').status).toBe('ok')
  })

  it('the same heart rate in the middle of the flight is an alarm', () => {
    const s = at(100)
    twice(s, 'hr', 80)
    expect(judge(s, LENA, 'hr').status).toBe('caution')
  })

  it('limits are wider while the body adapts after landing, and normal again once it has', () => {
    const early = at(LANDING_DAY + 2)
    twice(early, 'hr', 90)
    expect(judge(early, LENA, 'hr').status).toBe('ok')
    const later = at(LANDING_DAY + 20)
    twice(later, 'hr', 90)
    expect(judge(later, LENA, 'hr').status).toBe('caution')
  })

  it('the dashboard plots and the indicator chart draw the same caution line the judge uses', () => {
    for (const day of [-5, 100, LANDING_DAY + 2]) {
      const s = at(day)
      for (const k of ['hr', 'temp'] as const) {
        const b = baselines(s, LENA, k)
        const plot = metrics(s, LENA).find((x) => x['key'] === k)!.caution
        expect(plot, `${k} day ${day}`).toBeCloseTo(chartGuide(k, b).limits[0].v, 6)
        expect(classify(k, { v: plot + 0.01 }, b).level, `${k} day ${day}`).toBe('caution')
        expect(classify(k, { v: plot - 0.01 }, b).level, `${k} day ${day}`).toBe('ok')
      }
    }
  })

  it('danger values never move with the phase', () => {
    for (const day of [-5, 5, 100, 300, LANDING_DAY + 2]) {
      const s = at(day)
      add(s, 'spo2', day + 0.32, 89)
      expect(judge(s, LENA, 'spo2').status, `SpO2 89 on day ${day}`).toBe('warning')
      add(s, 'rr', day + 0.34, 31)
      expect(judge(s, LENA, 'rr').status, `breathing 31 on day ${day}`).toBe('warning')
      twice(s, 'hr', 121)
      expect(judge(s, LENA, 'hr').status, `heart rate 121 on day ${day}`).toBe('warning')
    }
  })

  it('an upper blood pressure under 90 is flagged in every phase, whatever the person’s normal', () => {
    for (const day of [100, 300]) {
      const s = at(day)
      twice(s, 'bp', 89, 62)
      expect(judge(s, LENA, 'bp').status, `day ${day}`).toBe('caution')
    }
  })

  it('no vital sign is flagged on in-range days on Mars or on the way home', () => {
    // The mission radiation total is left out: on a Mars mission it is expected to climb toward the career limit.
    const s = initialState()
    for (const day of [300, 500, 800]) {
      const items = attention({ ...s, day, place: day < 713 ? 'surface' : 'spacecraft' }, LENA).filter((x) => x.key !== 'radiation')
      expect(items, `day ${day}`).toEqual([])
    }
  })
})
