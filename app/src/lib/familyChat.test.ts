import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { reply } from './doctor'
import { FAMILY, MESSAGES, familyTurn } from './family'
import { DEFLECT, HONEST, PREVIEW_NOTICE, TOPICS, UNKNOWN, chatReply, linesFor } from './familyChat'
import { privateLines } from './familyPrivate'

const [marta, jonas, priya] = FAMILY
const s = initialState()
const free = { member: marta, message: MESSAGES[0], played: ['hello' as const], focus: 'bp' as const, talkFreely: true, said: [] as string[] }

/** Anything a preset line must never touch: the body, readings, medicine, advice on them, and numbers. */
const HEALTH = /\d|blood|pressure|pulse|heart rate|oxygen|temperature|fever|reading|measure|symptom|dizz|faint|pain|ache|hurt|sick|\bill\b|medic|doctor|pill|tablet|drug|dose|diagnos|dehydrat|\brest\b|sleep|exercise|radiation|health|treat|cure/i
const everyLine = () => [...TOPICS.flatMap((t) => FAMILY.flatMap((f) => linesFor(t, f))), ...DEFLECT, HONEST, UNKNOWN]

describe('talk freely preview: preset topics', () => {
  it('has at least 20 topics, each with 2 or more lines for every person', () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(20)
    for (const t of TOPICS) for (const f of FAMILY) expect(linesFor(t, f).length, `${t.id} for ${f.id}`).toBeGreaterThanOrEqual(2)
  })

  it.each([
    ['How are you?', 'howareyou'],
    ['What did you do today?', 'today'],
    ['I miss you', 'miss'],
    ['How is the weather at home?', 'weather'],
    ['Tell me about the dog', 'dog'],
    ['what are you cooking tonight', 'food'],
    ['how is dad', 'father'],
    ['tell me a joke', 'joke'],
    ['I love you', 'love'],
    ['when I come home I want pancakes', 'return'],
  ])('matches "%s" to the topic %s', (said, id) => {
    expect(chatReply(said, marta, []).topic).toBe(id)
  })

  it('answers in the person\'s character: the same question, different people, different words', () => {
    const a = chatReply('Tell me about the dog', marta, []).text
    const b = chatReply('Tell me about the dog', jonas, []).text
    const c = chatReply('How is work?', priya, []).text
    expect(a).not.toBe(b)
    expect(linesFor(TOPICS.find((t) => t.id === 'dog')!, marta)).toContain(a)
    expect(c).toMatch(/simulator|team|office|desk/i)
  })

  it('does not repeat a line while another is left', () => {
    const first = chatReply('How are you?', marta, [])
    const second = chatReply('How are you?', marta, [first.text])
    expect(second.text).not.toBe(first.text)
    expect(second.topic).toBe('howareyou')
  })
})

describe('talk freely preview: it is not an assistant', () => {
  it.each([
    'What is the perimeter of a circle?',
    'Write me some Python code',
    'Who is the president of France?',
    'Calculate 12 times 14',
    'Explain how a rocket engine works',
    'What is the capital of Peru?',
    'Translate hello into Spanish',
  ])('deflects in character and gives no answer: %s', (said) => {
    const r = chatReply(said, marta, [])
    expect(r.topic).toBe('deflect')
    expect(DEFLECT).toContain(r.text)
    expect(r.text).not.toMatch(/\d|radius|pi\b|paris|lima|hola|def |import /i)
  })

  it('says honestly that it cannot answer what no topic covers', () => {
    expect(chatReply('zxcv qwerty', marta, []).topic).toBe('unknown')
  })

  it('says honestly what it is when asked', () => {
    for (const q of ['Are you real?', 'Is this really you, mum?', 'Are you an AI?', 'Am I talking to a robot?']) {
      const r = chatReply(q, marta, [])
      expect(r.topic).toBe('honest')
      expect(r.text).toBe(HONEST)
    }
    expect(HONEST).toMatch(/not .*live/i)
    expect(HONEST).toMatch(/written by the team/i)
  })
})

describe('talk freely preview: health stays with ORBIT', () => {
  it('has no health content, no advice on the body, and no numbers in any preset line', () => {
    for (const line of everyLine()) expect(line, line).not.toMatch(HEALTH)
  })

  it('never claims to be the real person or a live call', () => {
    for (const line of everyLine()) expect(line, line).not.toMatch(/\b(i am|i'm|this is) (really|the real|your real)|\blive\b(?! model)|not an? ai/i)
  })

  it('sends a symptom to ORBIT\'s fixed rules, as before', () => {
    const said = 'I feel dizzy'
    const t = familyTurn(s, LENA, said, free)
    expect(t.kind).toBe('symptom')
    expect(t.segments[0].label).toBe('ORBIT')
    expect(t.segments[0].text).toBe(reply(s, LENA, said).text)
  })

  it('still saves a spoken reading and judges it again', () => {
    const t = familyTurn(s, LENA, 'it is 112 over 70', free)
    expect(t.kind).toBe('reading')
    expect(t.settled).toBe(true)
    expect(t.state!.readings[LENA.id].bp!.at(-1)!.v).toBe(112)
  })

  it('still ends the call on urgent words', () => {
    const t = familyTurn(s, LENA, 'my chest hurts, I can\'t breathe', free)
    expect(t.kind).toBe('escalate')
    expect(t.endsRolePlay).toBe(true)
    expect(t.segments[0].label).toBe('ORBIT')
  })

  it('still does not take "I am fine" for a reading', () => {
    expect(familyTurn(s, LENA, 'I am fine', free).kind).toBe('nudge')
  })
})

describe('talk freely preview: in the call', () => {
  it('answers small talk with a scripted line, labelled as a preview', () => {
    const t = familyTurn(s, LENA, 'How is the weather at home?', free)
    expect(t.kind).toBe('preview')
    expect(t.segments).toHaveLength(1)
    expect(t.segments[0].kind).toBe('preview')
    expect(t.segments[0].label).toBe('Scripted preview')
    expect(linesFor(TOPICS.find((x) => x.id === 'weather')!, marta)).toContain(t.segments[0].text)
  })

  it('answers a knowledge question with the deflection, never with a recording or an answer', () => {
    const t = familyTurn(s, LENA, 'What is the perimeter of a circle?', free)
    expect(t.kind).toBe('preview')
    expect(DEFLECT).toContain(t.segments[0].text)
  })

  it('leaves the call as it was when the preview is off', () => {
    const t = familyTurn(s, LENA, 'How is the weather at home?', { ...free, talkFreely: false })
    expect(t.kind).toBe('recorded')
    expect(t.segments[0].label).toBe('Recorded on Earth')
  })

  it('keeps the exchange in the private conversation', () => {
    const said = 'I miss you'
    const t = familyTurn(s, LENA, said, free)
    const lines = privateLines(s, marta, said, t)
    expect(lines.map((l) => l.from)).toEqual(['you', 'ai'])
    expect(lines[1].text).toBe(t.segments[0].text)
  })

  it('says in plain words what the preview is', () => {
    expect(PREVIEW_NOTICE).toMatch(/preview/i)
    expect(PREVIEW_NOTICE).toMatch(/written by the team/i)
    expect(PREVIEW_NOTICE).toMatch(/AI voice/)
    expect(PREVIEW_NOTICE).toMatch(/not .*live model/i)
  })
})
