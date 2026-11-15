import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { reply } from './doctor'
import { FAMILY, MESSAGES, familyTurn, voiceLines } from './family'
import { GUIDE, GUIDE_NOTICE, guidedReply, startChips } from './familyGuide'
import { privateLines } from './familyPrivate'

const [marta, jonas, priya] = FAMILY
const s = initialState()
const free = { member: marta, message: MESSAGES[0], played: ['hello' as const], focus: 'bp' as const, talkFreely: true, said: [] as string[] }
const HEALTH = /\d|blood|pressure|pulse|heart rate|oxygen|temperature|fever|reading|measure|symptom|dizz|faint|pain|ache|hurt|sick|\bill\b|medic|doctor|pill|tablet|drug|dose|diagnos|dehydrat|\brest\b|sleep|exercise|radiation|health|treat|cure/i

describe('guided conversation: it always works', () => {
  it('offers 5 or 6 things to say for the first caller, and at least 4 for the others', () => {
    expect(startChips(marta).length).toBeGreaterThanOrEqual(5)
    expect(startChips(marta).length).toBeLessThanOrEqual(6)
    for (const f of [jonas, priya]) expect(startChips(f).length).toBeGreaterThanOrEqual(4)
  })

  it('has a written reply with a rendered voice file for every suggestion of every person', () => {
    for (const f of FAMILY) {
      for (const chip of GUIDE[f.id].map((n) => n.say)) {
        const r = guidedReply(chip, f)
        expect(r, `${f.id}: ${chip}`).toBeTruthy()
        expect(r!.text.length).toBeGreaterThan(40)
        expect(r!.audio).toMatch(new RegExp(`^family/${f.id}-talk-[a-z]+\\.m4a$`))
      }
    }
  })

  it.each([
    ['How is everyone at home?', 'home'],
    ['how is everybody at home', 'home'],
    ['I miss you', 'miss'],
    ['i miss you so much mum', 'miss'],
    ['What did you do today?', 'today'],
    ['Tell me about the dog', 'dog'],
    ['how is bruno', 'dog'],
    ['Say good night', 'night'],
    ['good night mum', 'night'],
  ])('gives the same reply whether "%s" is tapped, typed or said', (said, id) => {
    expect(guidedReply(said, marta)!.id).toBe(id)
  })

  it('builds on what the person recorded that day', () => {
    expect(guidedReply('I miss you', marta)!.text).toMatch(/blue cup/)
    expect(guidedReply('What did you do today?', marta)!.text).toMatch(/apples/)
    expect(guidedReply('How is my bike?', jonas)!.text).toMatch(/garage/)
    expect(guidedReply('How is my plant?', priya)!.text).toMatch(/alive/i)
  })

  it('changes the suggestions after each reply, and never offers what was just said', () => {
    for (const f of FAMILY) for (const node of GUIDE[f.id]) {
      expect(node.next).not.toContain(node.id)
      for (const id of node.next) expect(GUIDE[f.id].some((n) => n.id === id), `${f.id}.${node.id} -> ${id}`).toBe(true)
    }
    const a = guidedReply('How is everyone at home?', marta)!
    const b = guidedReply('I miss you', marta)!
    expect(a.next).not.toEqual(b.next)
    expect(a.next.length).toBeGreaterThanOrEqual(2)
  })

  it('ends on good night, with nothing more to tap', () => {
    for (const f of FAMILY) expect(guidedReply('Say good night', f)!.next).toEqual([])
  })

  it('has no health content and no numbers in any written reply', () => {
    for (const f of FAMILY) for (const node of GUIDE[f.id]) expect(node.reply, node.reply).not.toMatch(HEALTH)
  })
})

describe('guided conversation: in the call', () => {
  it('answers a suggestion with the written reply, in the person\'s rendered voice, labelled as scripted', () => {
    const t = familyTurn(s, LENA, 'I miss you', free)
    expect(t.kind).toBe('preview')
    expect(t.forModel).toBeUndefined()
    expect(t.segments[0].label).toBe('Scripted preview')
    expect(t.segments[0].text).toBe(guidedReply('I miss you', marta)!.text)
    expect(t.segments[0].audio).toBe('family/marta-talk-miss.m4a')
    expect(t.next).toEqual(guidedReply('I miss you', marta)!.next.map((id) => GUIDE.marta.find((n) => n.id === id)!.say))
  })

  it('still sends health, readings and urgent words to ORBIT first', () => {
    expect(familyTurn(s, LENA, 'I miss you but my chest hurts', free).kind).toBe('escalate')
    expect(familyTurn(s, LENA, 'good night, it is 112 over 70', free).kind).toBe('reading')
    const t = familyTurn(s, LENA, 'tell me about the dog, I feel dizzy', free)
    expect(t.kind).toBe('symptom')
    expect(t.segments[0].text).toBe(reply(s, LENA, 'tell me about the dog, I feel dizzy').text)
  })

  it('leaves the call as it was when talk freely is off', () => {
    expect(familyTurn(s, LENA, 'I miss you', { ...free, talkFreely: false }).kind).toBe('recorded')
  })

  it('keeps the exchange in the private conversation', () => {
    const t = familyTurn(s, LENA, 'Tell me about the dog', free)
    expect(privateLines(s, marta, 'Tell me about the dog', t).map((l) => l.from)).toEqual(['you', 'ai'])
  })

  it('has every written reply in the list of speech to render, in that person\'s voice', () => {
    const lines = voiceLines(s, LENA)
    for (const f of FAMILY) for (const node of GUIDE[f.id]) {
      const line = lines.find((l) => l.file === `family/${f.id}-talk-${node.id}.m4a`)
      expect(line, `${f.id}-${node.id}`).toBeTruthy()
      expect(line!.voice).toBe(f.id)
      expect(line!.text).toBe(node.reply)
    }
  })

  it('says on screen, in plain words, that this part is staged', () => {
    expect(GUIDE_NOTICE).toMatch(/staged/i)
    expect(GUIDE_NOTICE).toMatch(/written by the team/i)
    expect(GUIDE_NOTICE).toMatch(/AI voice/)
    expect(GUIDE_NOTICE).toMatch(/not live/i)
  })
})
