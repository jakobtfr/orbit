import { describe, expect, it } from 'vitest'
import { subjectById, type Subject } from './replay'
import { researchSeries, researchSummary } from './research'

describe('research figures use observed test records', () => {
  it('preserves original observations in the selected interval', () => {
    const subject = subjectById('UTMB-01')!
    const series = researchSeries(subject, 'sys', 63, 90)
    expect(series).toHaveLength(28)
    expect(series.map((p) => p.value)).toEqual(subject.days.filter((d) => d.day >= 63 && d.day <= 90).map((d) => d.values.sys))
    const summary = researchSummary(subject, 'sys', 63, 90)
    expect(summary.limit).toBe(152)
    expect(summary.over).toBe(series.filter((p) => p.value >= 152).length)
  })
  it('uses past observations only and does not replace missing data', () => {
    const subject: Subject = { id: 'test', campaign: 'test', baseline: { days: 0, hr: null, sys: null, dia: null, temp: null }, days: [
      { day: 1, values: { hr: 10, sys: null, dia: null, temp: null } },
      { day: 2, values: { hr: null, sys: null, dia: null, temp: null } },
      { day: 3, values: { hr: 14, sys: null, dia: null, temp: null } },
      { day: 4, values: { hr: 900, sys: null, dia: null, temp: null } },
    ] }
    const series = researchSeries(subject, 'hr', 1, 3)
    expect(series.map((p) => p.day)).toEqual([1, 3])
    expect(series[0].rolling.sd).toBeUndefined()
    expect(series[1].rolling.mean).toBe(12)
    expect(series[1].rolling.variance).toBe(8)
    expect(researchSummary(subject, 'temp', 1, 3).stats.n).toBe(0)
    expect(researchSummary(subject, 'hr', 1, 3).over).toBeUndefined()
  })
})
