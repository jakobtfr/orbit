import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { FAMILY, MESSAGES, OPT_IN_DEFAULT, arrived, callScript, familyLock, incomingCall } from './family'
import { actionFor, attention, now } from './judge'
import type { AppState, CheckIn } from './types'

const checkin = (t: number): CheckIn => ({ t, feel: 'Fine', symptoms: [], mood: 4, team: 4 })

/** The demo state after today's check-in was saved. */
function checked(): AppState {
  const s = initialState()
  return { ...s, checkins: { ...s.checkins, [LENA.id]: [...(s.checkins[LENA.id] ?? []), checkin(now(s))] } }
}

describe('family call as the reward for today\'s check', () => {
  it('starts the demo day locked, with one clear thing left to do', () => {
    const lock = familyLock(initialState(), LENA)
    expect(lock.locked).toBe(true)
    expect(lock.todo).toBe('Do today\'s check-in to unlock your messages.')
    expect(lock.to).toBe('/body/lena/check-in')
  })

  it('unlocks the moment today\'s check-in is saved', () => {
    expect(familyLock(checked(), LENA).locked).toBe(false)
  })

  it('does not unlock on yesterday\'s check-in', () => {
    const s = initialState()
    const old: AppState = { ...s, checkins: { ...s.checkins, [LENA.id]: [checkin(now(s) - 1)] } }
    expect(familyLock(old, LENA).locked).toBe(true)
  })

  it('still shows who has sent something while locked', () => {
    expect(arrived(initialState(), MESSAGES, OPT_IN_DEFAULT).map((m) => m.from)).toEqual(['marta', 'jonas', 'priya'])
  })

  it('does not ring while locked', () => {
    expect(incomingCall(initialState(), LENA, OPT_IN_DEFAULT)).toBeUndefined()
  })

  it('rings with the newest message once unlocked', () => {
    expect(incomingCall(checked(), LENA, OPT_IN_DEFAULT)?.id).toBe('marta-100')
  })

  it('lets opting out win over an unlocked day', () => {
    expect(incomingCall(checked(), LENA, { ...OPT_IN_DEFAULT, astronaut: false })).toBeUndefined()
    const withoutMarta = incomingCall(checked(), LENA, { ...OPT_IN_DEFAULT, people: { ...OPT_IN_DEFAULT.people, marta: false } })
    expect(withoutMarta?.from).toBe('jonas')
  })

  it('does not ring outside off-duty time, check done or not', () => {
    const s = checked()
    const noon: AppState = { ...s, checkins: { ...s.checkins, [LENA.id]: [checkin(now(s))] } }
    expect(incomingCall(noon, LENA, OPT_IN_DEFAULT, now(s) - 8.25 / 24 + 11 / 24)).toBeUndefined()
  })

  it('leaves the call itself unchanged once unlocked: the recording first, then ORBIT\'s rule word for word', () => {
    const s = checked()
    const m = incomingCall(s, LENA, OPT_IN_DEFAULT)!
    const script = callScript(s, LENA, m)
    const a = actionFor(s, LENA, attention(s, LENA)[0])
    expect(script[0].kind).toBe('recorded')
    expect(script[0].text).toBe(MESSAGES[0].parts[0].text)
    expect(script.filter((x) => x.kind === 'health').map((x) => x.text)).toEqual([a.observed, a.next])
    expect(FAMILY[0].id).toBe(m.from)
  })
})
