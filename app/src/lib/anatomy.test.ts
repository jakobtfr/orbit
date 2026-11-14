import { describe, expect, it } from 'vitest'
import { bodyBack } from '../components/anatomy/bodyBack'
import { bodyFront } from '../components/anatomy/bodyFront'
import { MUSCLE_GROUPS, muscleFor } from './anatomy'

describe('anatomical groups', () => {
  it('maps every muscle path to a named group; the head stays separate', () => {
    for (const part of [...bodyFront, ...bodyBack]) {
      if (part.slug.startsWith('head')) expect(muscleFor(part.slug)).toBeUndefined()
      else expect(MUSCLE_GROUPS[muscleFor(part.slug)!]).toBeDefined()
    }
  })
  it('distinguishes posterior arm muscles from back muscles', () => {
    expect(muscleFor('triceps-left-back')).toBe('triceps')
    expect(muscleFor('forearm-left-back')).toBe('forearms')
    expect(muscleFor('upper-back-left')).toBe('upperBack')
    expect(muscleFor('lower-back-right')).toBe('lowerBack')
    expect(muscleFor('hamstring-left')).toBe('hamstrings')
  })
})
