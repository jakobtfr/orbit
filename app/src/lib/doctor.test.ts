import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { assessment, briefing, isUrgent, opening, reply, speakable } from './doctor'
import { now } from './judge'
import { applyHealthSystem } from './store'
import type { AppState, Reading } from './types'

const base = () => applyHealthSystem(initialState(), 'planet')

/** The demo state with blood pressure high on the last two readings. */
function highPressure(): AppState {
  const s = base()
  const t = now(s)
  const high = (dt: number): Reading => ({ t: t - dt, v: 148, v2: 94, activity: 'rest', source: 'Smart shirt', provenance: 'MEASURED' })
  const mine = s.readings[LENA.id] ?? {}
  return { ...s, readings: { ...s.readings, [LENA.id]: { ...mine, bp: [...(mine.bp ?? []), high(0.02), high(0.01)] } } }
}

describe('virtual doctor', () => {
  it('says the results look fine when nothing is out of range', () => {
    const o = opening(base(), LENA)
    expect(o.status).toBe('ok')
    expect(o.text).toMatch(/^Hello Lena\./)
    expect(o.text).toContain('Your results look fine')
  })

  it('says something is off with the chest when a chest reading is confirmed out of range', () => {
    const a = assessment(highPressure(), LENA)
    expect(a.status).toBe('warning')
    expect(a.text).toContain('Something is off with your chest')
    expect(a.actions?.[0].to).toBe('/body/lena/measure/bp')
  })

  it('answers a question about one part of the body from the readings', () => {
    const r = reply(base(), LENA, 'How is my heart?')
    expect(r.text).toContain('Heart rate at rest: 58 bpm')
    expect(r.text).toContain('in your usual range')
  })

  it('hands chest pain to a person at once', () => {
    const r = reply(base(), LENA, "I have a sharp pain in my chest and can't breathe")
    expect(r.urgent).toBe(true)
    expect(r.text).toContain('Samir Haddad')
    expect(r.text).toContain('now')
  })

  it('takes a symptom and points to the check-in', () => {
    const r = reply(base(), LENA, 'I have a headache')
    expect(r.text).toContain('Cabin air')
    expect(r.actions?.[0].to).toBe('/body/lena/check-in')
  })

  it('does not read "not feeling good" or "not bad" the wrong way round', () => {
    expect(reply(base(), LENA, "I'm not feeling good").status).toBe('caution')
    expect(reply(base(), LENA, 'not bad').status).toBe('ok')
  })

  it('never produces broken numbers', () => {
    for (const q of ['results', 'everything', 'what should I do next', 'blood pressure', 'radiation', 'sleep', 'bones', 'my eyes', 'hello', 'xyz']) {
      expect(reply(highPressure(), LENA, q).text).not.toMatch(/NaN|undefined|Infinity/)
    }
  })

  it('reads units aloud in words', () => {
    expect(speakable('Blood pressure: 110/66 mmHg, 3 h ago. 58 bpm.')).toBe('Blood pressure: 110 over 66 millimetres of mercury, 3 hours ago. 58 beats per minute.')
  })

  it('gives the on-device model the findings, not just the numbers', () => {
    const b = briefing(highPressure(), LENA)
    expect(b).toContain('Blood pressure: 148/94 mmHg')
    expect(b).toContain('Status: Warning.')
    expect(b).toContain('Something is off with your chest')
    expect(b).toContain('Samir Haddad')
    expect(b).not.toMatch(/Mood:|NaN|undefined/)
  })

  it('keeps urgent words away from the model', () => {
    expect(isUrgent('I can’t breathe')).toBe(true)
    expect(isUrgent('My chest is tight')).toBe(true)
    expect(isUrgent('How is my heart?')).toBe(false)
  })
})
