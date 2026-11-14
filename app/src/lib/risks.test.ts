import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { briefing } from './doctor'
import { INDICATORS, INDICATOR_ORDER } from './indicators'
import { actionFor, attention, riskStatus, risksAtAttention } from './judge'
import { RISKS, risksForIndicator } from './risks'

const risk = (id: string) => RISKS.find((r) => r.id === id)!

describe('HRP risks in the logic', () => {
  it('covers all 17 risks with something measured or reported', () => {
    expect(RISKS).toHaveLength(17)
    expect(new Set(RISKS.map((r) => r.id)).size).toBe(17)
    for (const r of RISKS) {
      expect(r.indicators.length + r.symptoms.length + (r.privateAnswer ? 1 : 0), r.id).toBeGreaterThan(0)
      for (const k of r.indicators) expect(INDICATORS[k], `${r.id}: ${k}`).toBeDefined()
    }
  })
  it('ties every indicator to at least one risk', () => {
    for (const k of INDICATOR_ORDER) expect(risksForIndicator(k).length, k).toBeGreaterThan(0)
  })
  it('raises decompression sickness to a warning when joint pain follows suit work, and tells the doctor', () => {
    const s = initialState()
    expect(riskStatus(s, LENA, risk('dcs'))).toBe('ok')
    s.checkins.lena.push({ t: 100.32, feel: 'Unwell', symptoms: [{ name: 'Joint pain after suit work', region: 'whole' }], mood: 3, team: 4 })
    expect(riskStatus(s, LENA, risk('dcs'))).toBe('warning')
    expect(risksAtAttention(s, LENA)[0].status).toBe('warning')
    const item = attention(s, LENA).find((a) => a.kind === 'symptom')!
    expect(item.status).toBe('warning')
    const action = actionFor(s, LENA, item)
    expect(action.next).toContain('medical lead now')
    expect(action.risk).toContain('Decompression sickness')
    expect(briefing(s, LENA)).toContain('Decompression sickness')
  })
  it('names the risk a reading bears on in its next action', () => {
    const s = initialState()
    const action = actionFor(s, LENA, { kind: 'indicator', key: 'bone', status: 'caution', label: 'Bone protection' })
    expect(action.risk).toBe('Bone loss')
  })
  it('flags teamwork only after two low answers in a row, and keeps it out of what others see', () => {
    const s = initialState()
    expect(riskStatus(s, LENA, risk('team'))).toBe('ok')
    s.checkins.lena.push({ t: 100.1, feel: 'Fine', symptoms: [], mood: 4, team: 2 })
    expect(riskStatus(s, LENA, risk('team'))).toBe('ok')
    s.checkins.lena.push({ t: 100.3, feel: 'Fine', symptoms: [], mood: 4, team: 1 })
    expect(riskStatus(s, LENA, risk('team'))).toBe('caution')
    expect(risksAtAttention(s, LENA).map((r) => r.risk.id)).not.toContain('team')
  })
})
