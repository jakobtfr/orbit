import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../data/demo'
import { binSamples, doseRates, metricLevel, metricSamples, metrics, statistics, windowSamples } from './dashboard'
import type { Reading } from './types'

describe('dashboard scientific statistics', () => {
  it('uses sample variance with n-1 and does not invent singleton uncertainty', () => {
    expect(statistics([2, 4, 6])).toEqual({ n: 3, mean: 4, variance: 4, sd: 2 })
    expect(statistics([5])).toEqual({ n: 1, mean: 5 })
    expect(statistics([])).toEqual({ n: 0 })
    expect(statistics([NaN, Infinity, 4])).toEqual({ n: 1, mean: 4 })
  })
  it('puts boundary samples in only one disjoint bin and preserves gaps', () => {
    const samples = [{ t: 87, v: 2 }, { t: 88.5, v: 4 }, { t: 89, v: 8 }, { t: 100, v: 10 }]
    const bins = binSamples(samples, 100, 14)
    expect(bins[0]).toMatchObject({ n: 2, mean: 3, variance: 2 })
    expect(bins[1]).toMatchObject({ n: 1, mean: 8 })
    expect(bins[1].sd).toBeUndefined()
    expect(bins[2].n).toBe(0)
    expect(bins.reduce((sum, b) => sum + b.n, 0)).toBe(samples.length)
  })
  it('calculates dose rate over elapsed days and ignores duplicate times and counter resets', () => {
    const reading = (t: number, v: number): Reading => ({ t, v, activity: 'rest', provenance: 'MODELLED', source: 'Test' })
    expect(doseRates([reading(0, 10), reading(2, 14), reading(2, 16), reading(3, 1), reading(4, 2)]))
      .toEqual([{ t: 2, v: 2 }, { t: 4, v: 1 }])
  })
  it('filters future data and computes all five plots from the same visible period', () => {
    const state = initialState()
    for (const metric of metrics(state, LENA)) {
      const samples = windowSamples(metricSamples(state, LENA, metric.key), state, 28)
      expect(samples).toHaveLength(28)
      expect(samples.every((s) => s.t <= 100 + 8.25 / 24 && s.t >= 73)).toBe(true)
      expect(binSamples(samples, 100, 28).every((b) => b.n === 4)).toBe(true)
    }
  })
  it('preserves radiation precision without whole-unit rate jumps', () => {
    const state = initialState()
    const rates = windowSamples(metricSamples(state, LENA, 'radiation'), state, 28)
    expect(rates.every((r) => r.v > 0)).toBe(true)
    expect(rates.slice(1).every((r, i) => Math.abs(r.v - rates[i].v) < .2)).toBe(true)
    expect(new Set(rates.map((r) => r.v.toFixed(3))).size).toBeGreaterThan(15)
  })
  it('uses reversed sleep bands, low-pulse alerts, and environment-specific radiation references', () => {
    const state = initialState()
    const all = metrics(state, LENA)
    const sleep = all.find((m) => m.key === 'sleep')!
    expect(metricLevel(sleep, 3.9)).toBe('warning')
    expect(metricLevel(sleep, 5.9)).toBe('caution')
    expect(metricLevel(sleep, 6)).toBe('ok')
    expect(metricLevel(all[0], 39)).toBe('warning')
    expect(metricLevel(all[0], 62)).toBe('ok')
    expect(all.find((m) => m.key === 'radiation')?.warning).toBe(1.3)
    expect(metrics({ ...state, place: 'surface' }, LENA).find((m) => m.key === 'radiation')?.warning).toBe(.9)
  })
})
