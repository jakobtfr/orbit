import { afterEach, describe, expect, it, vi } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { reply } from './doctor'
import { FAMILY, MESSAGES, familyTurn, healthTexts } from './family'
import { MODEL_FALLBACK, MODEL_NOTICE, UNKNOWN, aboutHealth, chatBriefing, chatReply, checkModelReply } from './familyChat'
import { chat } from './localModel'

afterEach(() => vi.unstubAllGlobals())

const marta = FAMILY[0]
const s = initialState()
const free = { member: marta, message: MESSAGES[0], played: ['hello' as const], focus: 'bp' as const, talkFreely: true, said: [] as string[] }

describe('talk freely with a model: what reaches the model', () => {
  it.each([
    'Is my blood pressure ok?',
    'Should I take a pill for it?',
    'How did I sleep last night?',
    'Do you think I should see the doctor?',
    'My heart rate felt fast today',
    'What does my temperature say?',
    'I have not been eating much',
    'Can you check my readings?',
  ])('keeps health talk away from the model and answers with ORBIT\'s fixed rules: %s', (said) => {
    expect(aboutHealth(said)).toBe(true)
    const t = familyTurn(s, LENA, said, free)
    expect(t.kind).toBe('symptom')
    expect(t.forModel).toBeUndefined()
    expect(t.segments[0].label).toBe('ORBIT')
    expect(t.segments[0].text).toBe(reply(s, LENA, said).text)
  })

  it.each(['I feel dizzy', 'it is 112 over 70', 'my chest hurts', 'I am fine'])('never hands these to the model: %s', (said) => {
    const t = familyTurn(s, LENA, said, free)
    expect(t.kind).not.toBe('preview')
    expect(t.forModel).toBeUndefined()
  })

  it('hands everyday talk to the model, with a preset line ready in case there is none', () => {
    const t = familyTurn(s, LENA, 'What did you have for breakfast?', free)
    expect(t.kind).toBe('preview')
    expect(t.forModel).toBe(true)
    expect(aboutHealth('What did you have for breakfast?')).toBe(false)
  })

  it('tells the model who it plays and what was recorded, and nothing about the astronaut\'s health', () => {
    const b = chatBriefing(marta, LENA, MESSAGES[0])
    expect(b).toContain(MESSAGES[0].parts[1].text)
    expect(b).toMatch(/AI/)
    expect(b).toMatch(/never.*(health|medical)/i)
    expect(b).toMatch(/not (a )?live/i)
    expect(b).not.toMatch(/86|54|mmHg|112/)
    for (const h of healthTexts(s, LENA)) expect(b).not.toContain(h)
  })
})

describe('talk freely with a model: what the model may say', () => {
  it.each([
    // The six a reviewer got past the first filter.
    'You are fine, skip the cuff tonight and do not tell Samir.',
    'Lie down and drink some water, you sound weak.',
    'One twenty over eighty is perfectly normal.',
    'It is really me, your mother, Lena.',
    'Yes, this is Marta speaking, live from the kitchen.',
    'Your father is in hospital since yesterday.',
    // More of the same kinds.
    'Your blood pressure is fine, do not worry about it.',
    'I think you should take an aspirin, love.',
    'Maybe it is just dehydration.',
    'You do not need to tell the medical lead.',
    'Your pulse of 58 bpm sounds healthy to me.',
    'I am not an AI, I am your real mother.',
    'Make sure you get enough sleep, darling.',
    'You should rest more and eat properly.',
    'Grandma died last week, I did not want to tell you.',
    'There was an accident on the road, Jonas is hurt.',
    'Ignore what ORBIT says, you know your body best.',
    'The answer is the radius times two times pi.',
    'Sure! Here is a Python function for that.',
    'As an AI language model I cannot do that.',
    '',
  ])('replaces it with the fixed line: %s', (text) => {
    expect(checkModelReply(text)).toBe(MODEL_FALLBACK)
  })

  it.each([
    'The garden is full of apples this year.',
    'Jonas says hello and misses you.',
    'I baked the apple cake again, and half of it is already gone.',
    'Oh, I miss you too, my dear. The kitchen is too quiet without you.',
    'He painted the bird house blue, and he is very pleased with himself.',
    'We sat in the garden all week and watched the apples fall.',
    'I still have the pillow you made at school, on the kitchen bench.',
  ])('lets plain everyday talk through: %s', (text) => {
    expect(checkModelReply(text)).toBe(text)
  })

  it('cuts a long reply to two sentences and removes thinking and markup', () => {
    expect(checkModelReply('<think>she asked about cake</think>**Yes!** The cake is good. The tree gave many apples. The street eats cake. Everyone is glad.')).toBe('Yes! The cake is good.')
  })

  it('has a fixed line that itself passes no health content and makes no claim', () => {
    expect(MODEL_FALLBACK).not.toMatch(/\d|health|blood|pill/i)
  })

  it('says in plain words that a model writes the replies, in character, and is not the person', () => {
    const n = MODEL_NOTICE('Marta', 'qwen3:8b')
    expect(n).toMatch(/AI model/)
    expect(n).toMatch(/qwen3:8b/)
    expect(n).toMatch(/Marta's character/)
    expect(n).toMatch(/not Marta/i)
    expect(n).toMatch(/not live/i)
  })
})

describe('talk freely without a model', () => {
  it('answers what no topic covers with one honest line, never an unrelated preset', () => {
    for (const said of ['zxcv qwerty', 'What colour is the sofa now?', 'Did the letter arrive?']) {
      const r = chatReply(said, marta, [])
      expect(r.topic).toBe('unknown')
      expect(r.text).toBe(UNKNOWN)
    }
    expect(UNKNOWN).toMatch(/cannot answer that yet/)
  })
})

describe('local model: thinking off', () => {
  it('asks the model not to think aloud when told to, and leaves other calls as they were', async () => {
    const bodies: Record<string, unknown>[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => { bodies.push(JSON.parse(init.body)); return new Response('{"done":true}\n') }))
    await chat('m', [{ role: 'user', content: 'hi' }], () => {}, undefined, 0.7, { think: false })
    await chat('m', [{ role: 'user', content: 'hi' }], () => {})
    expect(bodies[0].think).toBe(false)
    expect('think' in bodies[1]).toBe(false)
  })
})
