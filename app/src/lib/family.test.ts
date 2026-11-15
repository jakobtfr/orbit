import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { afterReading, reply } from './doctor'
import { FAMILY, MESSAGES, arrived, callScript, familyTurn, healthTexts, offDuty, personaBriefing, recordedLabel, safeSmallTalk, signalDelayMin, SMALL_TALK_FALLBACK } from './family'
import { actionFor, attention, judge, now } from './judge'
import { ARRIVAL_DAY } from './mission'
import type { AppState } from './types'

/** The demo state without its low blood pressure: everything in range. */
function calm(): AppState {
  const s = initialState()
  s.readings[LENA.id].bp!.filter((r) => r.t > 99).forEach((r) => { r.v = 110; r.v2 = 66 })
  return s
}

const marta = FAMILY[0]
const all = { astronaut: true, people: Object.fromEntries(FAMILY.map((f) => [f.id, true])) }
const first = (s: AppState) => arrived(s, MESSAGES, all)[0]

describe('family call: who and when', () => {
  it('has several people on Earth, each with a stated consent', () => {
    expect(FAMILY.length).toBeGreaterThanOrEqual(3)
    for (const f of FAMILY) {
      expect(f.name).toBeTruthy()
      expect(f.relation).toBeTruthy()
      expect(f.consent).toMatch(/AI/)
    }
  })

  it('keeps the signal delay inside the Earth to Mars range and grows it on the way out', () => {
    expect(signalDelayMin(0)).toBe(0)
    expect(signalDelayMin(100)).toBeGreaterThan(signalDelayMin(10))
    for (let d = 0; d <= 972; d += 7) {
      expect(signalDelayMin(d)).toBeGreaterThanOrEqual(0)
      expect(signalDelayMin(d)).toBeLessThanOrEqual(24)
    }
    expect(signalDelayMin(ARRIVAL_DAY)).toBeGreaterThanOrEqual(4)
  })

  it('shows a message only after its signal can have arrived', () => {
    const s = initialState()
    const late = { ...MESSAGES[0], id: 'late', recorded: now(s) - (signalDelayMin(s.day) - 1) / 1440 }
    expect(arrived(s, [late], all)).toHaveLength(0)
    const intime = { ...late, recorded: now(s) - (signalDelayMin(s.day) + 1) / 1440 }
    expect(arrived(s, [intime], all)).toHaveLength(1)
  })

  it('shows daily messages from several people on the demo day, newest first', () => {
    const list = arrived(initialState(), MESSAGES, all)
    expect(new Set(list.map((m) => m.from)).size).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < list.length; i++) expect(list[i - 1].recorded).toBeGreaterThanOrEqual(list[i].recorded)
  })

  it('shows nothing unless both sides have opted in', () => {
    const s = initialState()
    expect(arrived(s, MESSAGES, { astronaut: false, people: all.people })).toHaveLength(0)
    const withoutMarta = arrived(s, MESSAGES, { astronaut: true, people: { ...all.people, [marta.id]: false } })
    expect(withoutMarta.length).toBeGreaterThan(0)
    expect(withoutMarta.some((m) => m.from === marta.id)).toBe(false)
  })

  it('labels how long ago the message was recorded', () => {
    const s = initialState()
    const m = { ...MESSAGES[0], recorded: now(s) - 47 / 1440 }
    expect(recordedLabel(s, m)).toBe('Message from Earth, recorded 47 min ago')
  })

  it('offers calls only in off-duty time', () => {
    expect(offDuty(100 + 8.25 / 24)).toBe(true)
    expect(offDuty(100 + 20 / 24)).toBe(true)
    expect(offDuty(100 + 11 / 24)).toBe(false)
    expect(offDuty(100 + 3 / 24)).toBe(false)
  })
})

describe('family call: the health part is ORBIT\'s fixed rules, word for word', () => {
  it('plays the recorded message first, then the health part', () => {
    const s = initialState()
    const script = callScript(s, LENA, first(s))
    expect(script[0].kind).toBe('recorded')
    expect(script[0].text).toBe(first(s).parts[0].text)
    const kinds = script.map((x) => x.kind)
    expect(kinds.indexOf('health')).toBeGreaterThan(kinds.lastIndexOf('recorded'))
  })

  it('takes every health sentence from the rule that judged the reading', () => {
    const s = initialState()
    const top = attention(s, LENA)[0]
    expect(top.key).toBe('bp')
    const a = actionFor(s, LENA, top)
    const health = callScript(s, LENA, first(s)).filter((x) => x.kind === 'health').map((x) => x.text)
    expect(health).toEqual([a.observed, a.next])
  })

  it('never says a health sentence that is not in the rules, whatever the readings are', () => {
    for (const s of [initialState(), calm()]) {
      const allowed = healthTexts(s, LENA)
      for (const m of arrived(s, MESSAGES, all)) {
        for (const seg of callScript(s, LENA, m)) if (seg.kind === 'health') expect(allowed).toContain(seg.text)
      }
    }
  })

  it('has no health part at all when every reading is in range', () => {
    const s = calm()
    expect(attention(s, LENA).filter((i) => i.status === 'warning' || i.status === 'caution')).toHaveLength(0)
    const script = callScript(s, LENA, first(s))
    expect(script.some((x) => x.kind === 'health' && x.label !== 'ORBIT')).toBe(false)
  })

  it('marks who is speaking in every part: a recording, an AI voice, or ORBIT', () => {
    const s = initialState()
    for (const seg of callScript(s, LENA, first(s))) {
      expect(['Recorded on Earth', 'AI voice', 'ORBIT']).toContain(seg.label)
      if (seg.kind === 'recorded') expect(seg.label).toBe('Recorded on Earth')
      if (seg.kind === 'health') expect(seg.label).toBe('ORBIT')
    }
  })
})

describe('family call: what the astronaut says', () => {
  const ctx = (s: AppState) => ({ member: marta, message: first(s), played: [first(s).parts[0].topic], focus: 'bp' as const })

  it('ends the role-play and hands over to the medical lead on urgent words', () => {
    const s = initialState()
    const t = familyTurn(s, LENA, 'I have chest pain and I cannot breathe', ctx(s))
    expect(t.kind).toBe('escalate')
    expect(t.endsRolePlay).toBe(true)
    expect(t.segments).toHaveLength(1)
    expect(t.segments[0].label).toBe('ORBIT')
    expect(t.segments[0].text).toBe(reply(s, LENA, 'I have chest pain and I cannot breathe').text)
    expect(t.segments[0].text).toContain('Samir Haddad')
  })

  it('logs a spoken reading and judges it again', () => {
    const s = initialState()
    expect(judge(s, LENA, 'bp').status).toBe('caution')
    const t = familyTurn(s, LENA, 'ok it is 112 over 70 now', ctx(s))
    expect(t.kind).toBe('reading')
    expect(t.saved).toEqual({ key: 'bp', v: 112, v2: 70 })
    const latest = t.state!.readings[LENA.id].bp!.at(-1)!
    expect([latest.v, latest.v2]).toEqual([112, 70])
    expect(latest.source).toBe('Told in a family call')
    expect(latest.provenance).toBe('SELF-REPORTED')
    expect(judge(t.state!, LENA, 'bp').status).toBe('ok')
    const orbit = t.segments.find((x) => x.label === 'ORBIT')!
    expect(orbit.text).toBe(afterReading(t.state!, LENA, 'bp').text)
  })

  it('keeps a reading that is still off as off, in ORBIT\'s words', () => {
    const s = initialState()
    const t = familyTurn(s, LENA, 'it says 84 over 52', ctx(s))
    expect(judge(t.state!, LENA, 'bp').status).not.toBe('ok')
    expect(t.segments.find((x) => x.label === 'ORBIT')!.text).toBe(afterReading(t.state!, LENA, 'bp').text)
  })

  it('does not take "I am fine" for a reading: it asks for the measurement in the rule\'s words', () => {
    const s = initialState()
    const t = familyTurn(s, LENA, 'I am fine, really', ctx(s))
    expect(t.kind).toBe('nudge')
    expect(t.state).toBeUndefined()
    const a = actionFor(s, LENA, attention(s, LENA)[0])
    expect(t.segments.find((x) => x.kind === 'health')!.text).toBe(a.next)
  })

  it('answers small talk with the next real recorded part, not with invented words', () => {
    const s = initialState()
    const t = familyTurn(s, LENA, 'How was your day?', ctx(s))
    expect(t.kind).toBe('recorded')
    const part = first(s).parts.find((p) => p.text === t.segments[0].text)
    expect(part).toBeTruthy()
    expect(ctx(s).played).not.toContain(part!.topic)
    expect(t.segments[0].label).toBe('Recorded on Earth')
  })

  it('says so when there is no more recorded material, and that the reply goes to Earth', () => {
    const s = initialState()
    const m = first(s)
    const t = familyTurn(s, LENA, 'Tell me more', { member: marta, message: m, played: m.parts.map((p) => p.topic) })
    expect(t.kind).toBe('smalltalk')
    expect(t.segments[0].label).toBe('AI voice')
    expect(t.segments[0].text).toMatch(/Marta/)
    expect(t.segments[0].text).toMatch(/min/)
  })
})

describe('family call: the language model cannot speak about health', () => {
  it.each([
    'Your blood pressure is fine, do not worry about it.',
    'I think you should take an aspirin, love.',
    'It was 120 over 80 last time, right?',
    'Maybe it is just dehydration.',
    'You do not need to tell the medical lead.',
    'Your pulse of 58 bpm sounds healthy to me.',
    'Skip the reading tonight and rest.',
    'I am your real mother, not an AI.',
  ])('replaces model words about health or about being real: %s', (text) => {
    expect(safeSmallTalk(text)).toBe(SMALL_TALK_FALLBACK)
  })

  it.each(['The garden is full of apples this year.', 'Jonas says hello and misses you.'])('lets plain small talk through: %s', (text) => {
    expect(safeSmallTalk(text)).toBe(text)
  })

  it('tells the model it is an AI stand-in and gives it no readings', () => {
    const s = initialState()
    const b = personaBriefing(marta, LENA, first(s))
    expect(b).toMatch(/AI/)
    expect(b).toMatch(/never.*health/i)
    expect(b).not.toMatch(/86|54|mmHg/)
    for (const h of healthTexts(s, LENA)) expect(b).not.toContain(h)
  })
})
