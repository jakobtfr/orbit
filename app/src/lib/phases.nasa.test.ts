import { describe, expect, it } from 'vitest'
import csv from '../../../data/utmb/daily_vitals.csv?raw'
import { ENVELOPES } from './phases'

/**
 * Checks the phase table against NASA's raw UTMB bed-rest data (NASA Life Sciences Portal,
 * doi:10.83263/wjw1-ta27). For each volunteer: mean of a period minus the mean before bed rest.
 * The table values must match what the NASA data shows.
 */

type Row = { id: string; phase: string; day: number; hr: number; sys: number; dia: number }

function load(): Row[] {
  const [head, ...lines] = (csv as string).trim().split('\n')
  const col = head.split(',')
  const at = (name: string) => col.indexOf(name)
  return lines.map((line) => {
    const c = line.split(',')
    return { id: c[at('astronauta_id')], phase: c[at('fase')], day: Number(c[at('br_day')]), hr: Number(c[at('pulso_lpm')]), sys: Number(c[at('pas_mmhg')]), dia: Number(c[at('pad_mmhg')]) }
  })
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)) }

/** Each volunteer's change from their own pre-bed-rest mean, over the given period. */
function changes(rows: Row[], v: 'hr' | 'sys' | 'dia', phase: string, from: number, to: number): number[] {
  const ids = [...new Set(rows.map((r) => r.id))]
  const out: number[] = []
  for (const id of ids) {
    const mine = rows.filter((r) => r.id === id && r[v] > 0)
    const pre = mine.filter((r) => r.phase === 'pre').map((r) => r[v])
    const period = mine.filter((r) => r.phase === phase && r.day >= from && r.day <= to).map((r) => r[v])
    if (pre.length >= 3 && period.length >= 2) out.push(mean(period) - mean(pre))
  }
  return out
}

describe('phase table against NASA bed-rest data', () => {
  const rows = load()

  it('has the NASA data for 29 volunteers', () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(29)
  })

  it('weightlessness stand-in: the expected change matches the NASA mean within 1 unit', () => {
    for (const v of ['hr', 'sys', 'dia'] as const) {
      const ch = changes(rows, v, 'mision', 15, 999)
      expect(Math.abs(mean(ch) - ENVELOPES.micro[v].shift), v).toBeLessThan(1)
    }
  })

  it('the spread between people is about 2 SD of the NASA data', () => {
    for (const v of ['hr', 'sys', 'dia'] as const) {
      const s = 2 * sd(changes(rows, v, 'mision', 15, 999))
      expect(Math.abs(s - ENVELOPES.micro[v].spread), v).toBeLessThan(1.5)
    }
  })

  it('back on Earth: the spread is about 2 SD of the NASA change from day 8 after bed rest', () => {
    for (const v of ['hr', 'sys', 'dia'] as const) {
      const s = 2 * sd(changes(rows, v, 'post', 8, 999))
      expect(Math.abs(s - ENVELOPES.earth[v].spread), v).toBeLessThan(1.5)
    }
  })

  it('back in gravity: heart rate is about 12 bpm higher on days 0–3 and fades (NASA data)', () => {
    const early = mean(changes(rows, 'hr', 'post', 0, 3))
    const later = mean(changes(rows, 'hr', 'post', 4, 7))
    expect(early).toBeGreaterThan(10)
    expect(early).toBeLessThan(13.5)
    expect(later).toBeLessThan(early)
    expect(Math.abs(ENVELOPES.earth.hr.reentry!.size - early)).toBeLessThan(1.5)
  })
})
