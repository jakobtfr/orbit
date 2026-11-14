import { describe, expect, it } from 'vitest'
import { bodyBack } from '../components/anatomy/bodyBack'
import { bodyFront } from '../components/anatomy/bodyFront'
import { LENA, initialState } from '../data/demo'
import { MUSCLE_GROUPS, muscleFor, muscleStatus, regionForPart, type MuscleKey } from './anatomy'

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
  it('colours each group by what is watched for it: the low blood pressure marks the chest, not the legs', () => {
    const s = initialState()
    expect(muscleStatus(s, LENA, 'chest')).toBe('caution')
    expect(muscleStatus(s, LENA, 'upperBack')).toBe('caution')
    expect(muscleStatus(s, LENA, 'quadriceps')).toBe('ok')
    s.readings.lena.exercise!.filter((r) => r.t > 97.5 && r.t < 100.5).forEach((r) => { r.v = 40 })
    expect(muscleStatus(s, LENA, 'quadriceps')).toBe('caution')
    expect(muscleStatus(s, LENA, 'calves')).toBe('caution')
  })
  it('gives every group a region, something said about flight, and a way to train it', () => {
    for (const key of Object.keys(MUSCLE_GROUPS) as MuscleKey[]) {
      const g = MUSCLE_GROUPS[key]
      expect(g.inFlight.length).toBeGreaterThan(20)
      expect(g.trainedBy.length).toBeGreaterThan(0)
    }
    expect(regionForPart('head-front')).toBe('head')
    expect(regionForPart('chest-left')).toBe('chest')
  })
})
