import { describe, expect, it } from 'vitest'
import { BREATHING_QUESTION, CHEST_PAIN_STEPS, CPR_STEPS, FIRST_STEPS, SOURCES } from './emergency'

describe('emergency steps', () => {
  it('cite at least one known source each (SH9)', () => {
    for (const step of [...FIRST_STEPS, BREATHING_QUESTION, ...CPR_STEPS, ...CHEST_PAIN_STEPS]) {
      expect(step.sources.length).toBeGreaterThan(0)
      for (const id of step.sources) expect(SOURCES[id]?.url).toMatch(/^https:\/\//)
    }
  })

  it('start compressions as the first step when breathing is not normal', () => {
    expect(CPR_STEPS[0].title).toMatch(/compressions/)
  })
})
