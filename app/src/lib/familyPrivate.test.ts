import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { FAMILY, MESSAGES, familyTurn } from './family'
import { makeKey, privateLines, seal, unseal } from './familyPrivate'

const ctx = { member: FAMILY[0], message: MESSAGES[0], played: ['hello' as const], focus: 'bp' as const }

describe('private family conversation', () => {
  it('is encrypted on the device: the stored text cannot be read without the key', async () => {
    const key = await makeKey()
    const lines = [{ day: 100, with: 'marta', from: 'you' as const, text: 'I miss the apple tree.' }]
    const stored = await seal(key, lines)
    expect(stored).not.toContain('apple')
    expect(stored).not.toContain('marta')
    expect(await unseal(key, stored)).toEqual(lines)
    await expect(unseal(await makeKey(), stored)).rejects.toThrow()
  })

  it('uses a key that cannot be exported from the browser', async () => {
    const key = await makeKey()
    expect(key.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow()
  })

  it('gives a different stored text each time, so equal conversations do not look equal', async () => {
    const key = await makeKey()
    expect(await seal(key, ['a'])).not.toBe(await seal(key, ['a']))
  })

  it('keeps small talk in the private log and out of the health record', () => {
    const s = initialState()
    const said = 'How was your day?'
    const turn = familyTurn(s, LENA, said, ctx)
    const lines = privateLines(s, ctx.member, said, turn)
    expect(lines.map((l) => l.from)).toEqual(['you', 'recorded'])
    expect(lines[0].text).toBe(said)
    expect(turn.state).toBeUndefined()
    expect(JSON.stringify(s)).not.toContain(said)
  })

  it('keeps a reading in the health record and out of the private log', () => {
    const s = initialState()
    const turn = familyTurn(s, LENA, 'it is 112 over 70', ctx)
    expect(privateLines(s, ctx.member, 'it is 112 over 70', turn)).toEqual([])
    expect(turn.state!.readings[LENA.id].bp!.at(-1)!.v).toBe(112)
  })

  it('keeps urgent words out of the private log: they go to a person', () => {
    const s = initialState()
    const turn = familyTurn(s, LENA, 'my chest hurts', ctx)
    expect(privateLines(s, ctx.member, 'my chest hurts', turn)).toEqual([])
  })
})
