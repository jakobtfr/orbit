import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { actionFor, attention } from './judge'
import { activeProcedures, allProcedures, measureProcedures, procedureFor, sceneFor } from './procedures'

describe('procedures', () => {
  it('picks a picture from the wording of a step', () => {
    expect(sceneFor('Sit or lie down, drink water, and repeat the reading after 5 minutes.')).toBe('rest')
    expect(sceneFor('Drink a large glass of water, slowly.')).toBe('drink')
    expect(sceneFor('Take a new reading.')).toBe('measure')
    expect(sceneFor('Tell the medical lead today.')).toBe('report')
    expect(sceneFor('Report the daily dose to the ground at the next contact.')).toBe('report')
    expect(sceneFor('Follow the shelter plan during solar events.')).toBe('shelter')
    expect(sceneFor('Book today’s session now.')).toBe('exercise')
    expect(sceneFor('Cover one eye and read the smallest line you can.')).toBe('look')
  })

  it('holds a procedure for everything that is off today and for every reading with steps', () => {
    const s = initialState()
    const now = activeProcedures(s, LENA)
    expect(now.length).toBe(attention(s, LENA).length)
    expect(now.some((p) => p.id === 'now-bp')).toBe(true)
    const measure = measureProcedures(s, LENA)
    expect(measure.some((p) => p.id === 'measure-bp')).toBe(true)
    for (const p of allProcedures(s, LENA)) expect(p.steps.length).toBeGreaterThan(0)
    expect(new Set(allProcedures(s, LENA).map((p) => p.id)).size).toBe(allProcedures(s, LENA).length)
  })

  it('finds the Resources entry behind a next-action card', () => {
    const s = initialState()
    const item = attention(s, LENA).find((i) => i.key === 'bp')!
    expect(procedureFor(s, LENA, actionFor(s, LENA, item))?.id).toBe('now-bp')
  })
})
