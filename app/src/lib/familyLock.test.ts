import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { FAMILY, MESSAGES, OPT_IN_DEFAULT, ROUTINE_CHECK_EVERY_DAYS, arrived, callScript, familyLock, incomingCall, pendingChecks } from './family'
import { INDICATORS } from './indicators'
import { actionFor, attention, judge, now } from './judge'
import type { AppState, CheckIn, IndicatorKey, Reading } from './types'

const checkin = (t: number): CheckIn => ({ t, feel: 'Fine', symptoms: [], mood: 4, team: 4 })
const withCheckin = (s: AppState, t = now(s)): AppState => ({ ...s, checkins: { ...s.checkins, [LENA.id]: [...(s.checkins[LENA.id] ?? []), checkin(t)] } })

/** One more reading: taken by hand unless a sensor is named. */
function withReading(s: AppState, key: IndicatorKey, v: number, v2?: number, source = 'Entered by hand', t = now(s)): AppState {
  const r: Reading = { t, v, v2, activity: 'rest', source, provenance: 'MEASURED' }
  const mine = s.readings[LENA.id] ?? {}
  return { ...s, readings: { ...s.readings, [LENA.id]: { ...mine, [key]: [...(mine[key] ?? []), r] } } }
}

/** The demo day with blood pressure in range, so no sensor asks for anything. */
function calm(): AppState {
  const s = initialState()
  s.readings[LENA.id].bp!.filter((r) => r.t > 99).forEach((r) => { r.v = 110; r.v2 = 66 })
  return s
}

describe('a health check is pending: triggered by the worn sensors', () => {
  it('starts the demo day locked because the smart shirt recorded blood pressure outside her own limits', () => {
    const s = initialState()
    expect(judge(s, LENA, 'bp').status).toBe('caution')
    const lock = familyLock(s, LENA)
    expect(lock.locked).toBe(true)
    expect(lock.pending[0].kind).toBe('triggered')
    expect(lock.pending[0].key).toBe('bp')
    expect(lock.why).toBe(`Your ${INDICATORS.bp.source.toLowerCase()} recorded blood pressure outside your own limits (86/54 mmHg).`)
    expect(lock.todo).toBe('Repeat the reading to unlock your messages.')
    expect(lock.to).toBe('/body/lena/measure/bp')
  })

  it('unlocks when the repeat reading has been taken by hand', () => {
    const s = withReading(initialState(), 'bp', 112, 70)
    expect(pendingChecks(s, LENA)).toEqual([])
    expect(familyLock(s, LENA).locked).toBe(false)
  })

  it('unlocks on the repeat reading even when it is still low: the call is not withheld, ORBIT\'s rule goes with it', () => {
    const s = withReading(initialState(), 'bp', 85, 53)
    expect(judge(s, LENA, 'bp').status).not.toBe('ok')
    expect(familyLock(s, LENA).locked).toBe(false)
  })

  it('does not accept the check-in in place of the repeat reading', () => {
    const lock = familyLock(withCheckin(initialState()), LENA)
    expect(lock.locked).toBe(true)
    expect(lock.pending.map((p) => p.kind)).toEqual(['triggered'])
  })

  it('makes a repeat check pending at once when a sensor records a new reading outside her limits', () => {
    const fine = withCheckin(calm())
    expect(familyLock(fine, LENA).locked).toBe(false)
    const off = withReading(withReading(fine, 'temp', 39.6, undefined, INDICATORS.temp.source), 'temp', 39.6, undefined, INDICATORS.temp.source)
    const lock = familyLock(off, LENA)
    expect(lock.locked).toBe(true)
    expect(lock.pending[0]).toMatchObject({ kind: 'triggered', key: 'temp' })
  })

  it('does not lock for a reading the astronaut took herself, however it looks: she has just checked', () => {
    const s = withCheckin(withReading(calm(), 'bp', 84, 52))
    expect(familyLock(s, LENA).locked).toBe(false)
  })
})

describe('a health check is pending: the routine check', () => {
  it('is due every day', () => {
    expect(ROUTINE_CHECK_EVERY_DAYS).toBe(1)
  })

  it('locks when nothing was checked today, and says so', () => {
    const lock = familyLock(calm(), LENA)
    expect(lock.locked).toBe(true)
    expect(lock.pending.map((p) => p.kind)).toEqual(['routine'])
    expect(lock.why).toBe('Today\'s health check is still to do.')
    expect(lock.todo).toBe('Do today\'s check-in to unlock your messages.')
    expect(lock.to).toBe('/body/lena/check-in')
  })

  it('is done by today\'s check-in', () => {
    expect(familyLock(withCheckin(calm()), LENA).locked).toBe(false)
  })

  it('is done by a reading taken by hand today', () => {
    expect(familyLock(withReading(calm(), 'hr', 60), LENA).locked).toBe(false)
  })

  it('is not done by yesterday\'s check-in', () => {
    const s = calm()
    expect(familyLock(withCheckin(s, now(s) - 1), LENA).locked).toBe(true)
  })

  it('puts the triggered check first when both are pending', () => {
    expect(pendingChecks(initialState(), LENA).map((p) => p.kind)).toEqual(['triggered', 'routine'])
  })
})

describe('family call as the reward for the check', () => {
  const done = () => withReading(initialState(), 'bp', 112, 70)

  it('still shows who has sent something while locked', () => {
    expect(arrived(initialState(), MESSAGES, OPT_IN_DEFAULT).map((m) => m.from)).toEqual(['marta', 'jonas', 'priya'])
  })

  it('does not ring while a check is pending', () => {
    expect(incomingCall(initialState(), LENA, OPT_IN_DEFAULT)).toBeUndefined()
  })

  it('rings with the newest message once nothing is pending', () => {
    expect(incomingCall(done(), LENA, OPT_IN_DEFAULT)?.id).toBe('marta-100')
  })

  it('lets opting out win over an unlocked day', () => {
    expect(incomingCall(done(), LENA, { ...OPT_IN_DEFAULT, astronaut: false })).toBeUndefined()
    expect(incomingCall(done(), LENA, { ...OPT_IN_DEFAULT, people: { ...OPT_IN_DEFAULT.people, marta: false } })?.from).toBe('jonas')
  })

  it('does not ring outside off-duty time, check done or not', () => {
    const s = done()
    expect(incomingCall(s, LENA, OPT_IN_DEFAULT, now(s) - 8.25 / 24 + 11 / 24)).toBeUndefined()
  })

  it('leaves the call itself unchanged: the recording first, then ORBIT\'s rule word for word when a reading is still off', () => {
    const s = withReading(initialState(), 'bp', 85, 53)
    const m = incomingCall(s, LENA, OPT_IN_DEFAULT)!
    const script = callScript(s, LENA, m)
    const a = actionFor(s, LENA, attention(s, LENA)[0])
    expect(script[0].kind).toBe('recorded')
    expect(script[0].text).toBe(MESSAGES[0].parts[0].text)
    expect(script.filter((x) => x.kind === 'health').map((x) => x.text)).toEqual([a.observed, a.next])
    expect(FAMILY[0].id).toBe(m.from)
  })
})
