import { describe, expect, it } from 'vitest'
import { doctorVoice, rankVoices } from './voices'

const v = (name: string, lang = 'en-US', localService = true) => ({ name, lang, localService })

describe('doctor voices', () => {
  it('drops novelty and non-English voices and puts the most natural first', () => {
    const ranked = rankVoices([v('Albert'), v('Zarvox'), v('Zosia', 'pl-PL'), v('Karen', 'en-AU'), v('Google UK English Female', 'en-GB', false), v('Samantha'), v('Ava (Premium)')])
    expect(ranked.map((x) => x.name)).toEqual(['Ava (Premium)', 'Google UK English Female', 'Samantha', 'Karen'])
  })

  it('uses the neutral Google US English voice when the browser has it, and the best English voice when not', () => {
    const mac = [v('Albert'), v('Samantha'), v('Daniel', 'en-GB')]
    expect(doctorVoice([...mac, v('Google US English', 'en-US', false), v('Google UK English Male', 'en-GB', false)])?.name).toBe('Google US English')
    expect(doctorVoice(mac)?.name).toBe('Samantha')
    expect(doctorVoice([])).toBeUndefined()
  })
})
