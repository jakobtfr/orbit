import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { wantsLook, greeting, guideCommand, declined, stepLine, wantsProcedure, afterReading, assessment, briefing, focusOn, heardReading, isUrgent, nextStep, opening, reply, speakable, withReading } from './doctor'
import { now } from './judge'
import type { AppState, Reading } from './types'

/** The demo state without its low blood pressure: everything in range. */
function base(): AppState {
  const s = initialState()
  s.readings[LENA.id].bp!.filter((r) => r.t > 99).forEach((r) => { r.v = 110; r.v2 = 66 })
  return s
}

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

  it('opens the call about whatever is off, a reading or a logged symptom, with nothing written per condition', () => {
    const s = initialState()
    const focus = focusOn(s, LENA)
    expect(focus?.key).toBe('bp')
    const o = opening(s, LENA, focus)
    expect(o.text).toContain('I am here about your blood pressure')
    expect(o.text).toContain('86/54 mmHg')
    expect(o.text).toContain('how do you feel right now')

    const rash = base()
    rash.checkins[LENA.id].push({ t: 100.32, feel: 'Not quite right', symptoms: [{ name: 'Skin rash', region: 'skin' }], mood: 3 })
    const skin = focusOn(rash, LENA)
    expect(skin?.title).toBe('the skin rash you logged')
    expect(focusOn(rash, LENA, 'skin')?.title).toBe('the skin rash you logged')
    expect(opening(rash, LENA, skin).text).toContain('I am here about the skin rash you logged')

    expect(focusOn(base(), LENA)).toBeUndefined()
    expect(focusOn(base(), LENA, 'bp')).toBeUndefined()
  })

  it('hears any reading said aloud, saves it, and says whether it is back in range', () => {
    expect(heardReading('ok it says 104 over 68 now')).toEqual({ key: 'bp', v: 104, v2: 68 })
    expect(heardReading('my pulse is 64')).toEqual({ key: 'hr', v: 64 })
    expect(heardReading('temperature 37,2 degrees')).toEqual({ key: 'temp', v: 37.2 })
    expect(heardReading('the reading is 97', 'spo2')).toEqual({ key: 'spo2', v: 97 })
    expect(heardReading('I rested for 5 minutes', 'bp')).toBeUndefined()
    expect(heardReading('I have had it for 10 days')).toBeUndefined()
    const s = initialState()
    const better = withReading(s, LENA, 'bp', { v: 104, v2: 68 }).state
    expect(afterReading(better, LENA, 'bp').text).toContain('104/68 mmHg is back in your usual range')
    const same = withReading(s, LENA, 'bp', { v: 85, v2: 52 }).state
    expect(afterReading(same, LENA, 'bp').text).toContain('Samir Haddad')
  })

  it('walks through the measuring steps one at a time without a model', () => {
    const focus = focusOn(initialState(), LENA)!
    expect(nextStep(focus, 1).text).toContain('Rest for 5 minutes first')
    expect(nextStep(focus, focus.steps.length - 1).text).toMatch(/^Last step\./)
    expect(nextStep(focus, 99).text).toContain('whole plan')
  })

  it('gives the model one way of helping with anything, what the call was opened about, and whether it can see', () => {
    const s = initialState()
    const seeing = briefing(s, LENA, { focus: focusOn(s, LENA), camera: 'picture' })
    expect(seeing).toContain('whatever it is: a reading that is off, a rash, a bump')
    expect(seeing).toContain('This call was opened about your blood pressure')
    expect(seeing).toContain('one still picture')
    expect(briefing(base(), LENA)).toContain('whatever it is')
    expect(briefing(base(), LENA)).toContain('you cannot see them')
    expect(briefing(base(), LENA, { camera: 'on' })).toContain('only get a picture when they show you something')
  })

  it('sends a picture only when something is being shown', () => {
    expect(wantsLook('Can you look at this rash?')).toBe(true)
    expect(wantsLook('here', 'Could you hold it up to the camera?')).toBe(true)
    expect(wantsLook('I feel a little dizzy')).toBe(false)
    expect(wantsLook('How is my heart?', 'Your heart rate is fine.')).toBe(false)
  })

  it('understands the words used while going through a procedure', () => {
    expect(guideCommand('Done.')).toBe('next')
    expect(guideCommand('ok next step')).toBe('next')
    expect(guideCommand('go back')).toBe('back')
    expect(guideCommand('say that again')).toBe('repeat')
    expect(guideCommand('stop the procedure')).toBe('stop')
    expect(guideCommand('ok but my arm hurts')).toBeUndefined()
    expect(guideCommand('it says 104 over 68')).toBeUndefined()
  })

  it('finds the procedure someone asks to go through', () => {
    const list = [
      { id: 'now-bp', title: 'Blood pressure', kind: 'now' as const },
      { id: 'measure-bp', title: 'Blood pressure', kind: 'measure' as const },
      { id: 'measure-spo2', title: 'Blood oxygen', kind: 'measure' as const },
    ]
    expect(wantsProcedure('How do I measure my blood pressure?', list)).toBe('measure-bp')
    expect(wantsProcedure('walk me through the blood pressure task', list)).toBe('now-bp')
    expect(wantsProcedure('guide me through blood oxygen', list)).toBe('measure-spo2')
    expect(wantsProcedure("ok let's start", list, 'now-bp')).toBe('now-bp')
    expect(wantsProcedure('when did it start?', list, 'now-bp')).toBeUndefined()
    expect(wantsProcedure('How is my blood pressure?', list, 'now-bp')).toBeUndefined()
  })

  it('knows what someone does not want to deal with', () => {
    const list = [
      { id: 'now-bp', title: 'Blood pressure' },
      { id: 'measure-bp', title: 'Blood pressure' },
      { id: 'measure-spo2', title: 'Blood oxygen' },
    ]
    expect(declined("I don't want to talk about blood pressure", list)).toEqual(['now-bp', 'measure-bp'])
    expect(declined('I said I dont want to talk about blood pressure.', list, 'measure-spo2')).toEqual(['now-bp', 'measure-bp'])
    expect(declined('skip this', list, 'measure-spo2')).toEqual(['measure-spo2'])
    expect(declined('not now', list, 'now-bp')).toEqual(['now-bp', 'measure-bp'])
    expect(declined("I'd rather talk about something else", list, 'now-bp')).toEqual(['now-bp', 'measure-bp'])
    expect(declined('not now', list)).toEqual([])
    expect(declined('How is my blood pressure?', list, 'now-bp')).toEqual([])
    expect(declined('Done.', list, 'now-bp')).toEqual([])
    expect(declined("I don't feel dizzy", list, 'now-bp')).toEqual([])
    expect(declined('should I leave the cuff on?', list, 'now-bp')).toEqual([])
  })

  it('opens a call from the header with an open question and the problems to pick from', () => {
    const g = greeting(highPressure(), LENA)
    expect(g.text).toBe('Hello Lena. What is the problem?')
    expect(g.problems[0]).toEqual({ label: 'Blood pressure', about: 'bp' })
    expect(greeting(base(), LENA).problems.every((p) => p.about)).toBe(true)
  })

  it('reads out one step at a time', () => {
    expect(stepLine(['Sit down.', 'Fit the cuff.', 'Press start.'], 0)).toBe('Step 1 of 3. Sit down.')
    expect(stepLine(['Sit down.', 'Fit the cuff.', 'Press start.'], 2)).toBe('Last step. Press start.')
  })
})
