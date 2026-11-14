import { baselines, hrLimit, now, readingsFor, tempLimit } from './judge'
import type { Action, AppState, IndicatorKey, Person, Reading } from './types'

export type Level = 'ok' | 'caution' | 'warning'
export interface Sample { t: number; v: number }
export interface Stats { n: number; mean?: number; sd?: number; variance?: number }
export function statistics(values: number[]): Stats {
  const xs = values.filter(Number.isFinite)
  const n = xs.length
  if (!n) return { n }
  const mean = xs.reduce((a, b) => a + b, 0) / n
  if (n < 2) return { n, mean }
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)
  return { n, mean, variance, sd: Math.sqrt(variance) }
}
export interface Bin extends Stats { start: number; end: number; t: number }
/** Disjoint time bins. Empty bins remain empty; singleton bins have no SD. */
export function binSamples(samples: Sample[], day: number, days: number): Bin[] {
  const width = days / 7
  const start = day - days + 1
  return Array.from({ length: 7 }, (_, i) => {
    const left = start + i * width
    const right = left + width
    return { start: left, end: right, t: (left + right) / 2,
      ...statistics(samples.filter((r) => r.t >= left && r.t < right).map((r) => r.v)) }
  })
}
/** Differences use elapsed time; missing days never masquerade as a one-day dose. */
export function doseRates(readings: Reading[]): Sample[] {
  return readings.slice(1).flatMap((r, i) => {
    const previous = readings[i]
    const elapsed = r.t - previous.t
    return elapsed > 0 && r.v >= previous.v ? [{ t: r.t, v: (r.v - previous.v) / elapsed }] : []
  })
}
export interface Metric {
  key: IndicatorKey; title: string; unit: string; decimals: number; hazard: string
  domain: [number, number]; caution: number; warning: number; low?: number; lowerIsWorse?: boolean
  source: string; sourceLabel: string; note: string
}
export function metrics(state: AppState, person: Person): Metric[] {
  // The amber lines follow the person's normal for the mission phase, the same values judge.ts uses.
  const hrB = baselines(state, person, 'hr')
  const tempB = baselines(state, person, 'temp')
  const surface = state.place === 'surface'
  const radiationLimit = surface ? .9 : 1.3
  return [
    { key: 'hr', title: 'Resting heart rate', unit: 'bpm', decimals: 0, hazard: 'Altered gravity', domain: [35, 130], low: 40,
      caution: hrLimit(hrB), warning: 120,
      source: 'https://doi.org/10.83263/wjw1-ta27', sourceLabel: 'NASA UTMB bed-rest study',
      note: `Amber at +20% of your normal for this phase (${hrB.normal?.label ?? 'before flight'}): your pre-flight value plus the change NASA bed-rest data shows, learned from your own readings. Wider while the body adapts to a new gravity. Red below 40 or above 120 are fixed ORBIT review bands, not diagnostic cutoffs.` },
    { key: 'temp', title: 'Core temperature', unit: '°C', decimals: 1, hazard: 'Health autonomy', domain: [36.5, 40],
      caution: tempLimit(tempB), warning: 39.5,
      source: 'https://www.nature.com/articles/s41598-017-15560-w', sourceLabel: 'Stahn et al., Scientific Reports, 2017 (outside NASA)',
      note: 'Simulated core temperature, not smart-shirt skin temperature. In flight the normal rises about 1 °C over 75 days (ESA/Charité ISS study; NASA bed-rest data shows no rise, so this value is outside NASA data). Amber at +0.5 °C from your normal for this phase; red at 39.5 °C. These are prototype review bands, not validated flight fever thresholds.' },
    { key: 'sleep', title: 'Sleep duration', unit: 'h', decimals: 1, hazard: 'Isolation & confinement', domain: [2, 9], lowerIsWorse: true, caution: 6, warning: 4,
      source: 'https://www.nasa.gov/reference/6-0-medical-operations/', sourceLabel: 'NASA medical standard',
      note: 'One sleep-duration observation per night. Under 6 h / under 4 h are ORBIT review bands, not NASA clinical limits. Repeated short nights and symptoms matter; the demo goal is 8 h. Binned means may hide individual short nights.' },
    { key: 'radiation', title: 'Radiation dose rate', unit: 'mSv/day', decimals: 2, hazard: 'Space radiation', domain: [0, 2.2], caution: radiationLimit * .8, warning: radiationLimit,
      source: 'https://www.nasa.gov/reference/4-0-human-performance/', sourceLabel: 'NASA radiation standard',
      note: `Daily increments of simulated cumulative NASA effective dose. NASA's GCR design requirement for systems supporting crew >60 days is <${radiationLimit} mSv per day ${surface ? 'on planetary surfaces' : 'in free space'}. Amber at 80% is an ORBIT margin. Not a solar-event forecast, individual acute-illness threshold, or instrument uncertainty. Career exposure is a separate 600 mSv limit.` },
    { key: 'cabin', title: 'Cabin carbon dioxide', unit: 'mmHg', decimals: 2, hazard: 'Closed environment', domain: [0, 5.5], caution: 3, warning: 5,
      source: 'https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/', sourceLabel: 'NASA carbon dioxide limits',
      note: 'Demo samples represent one 1-hour mean ppCO₂ per day. NASA limits the 1-hour mean to 3 mmHg. The red 5 mmHg line is an ORBIT heuristic, not a NASA limit. Multi-day averaging cannot establish continuous compliance.' },
  ]
}
/**
 * Today's radiation dose against the daily design limit for the place, with what to do when it is over.
 * Undefined when it is within the limit. The mission total is judged separately in judge.ts.
 */
export function radiationToday(state: AppState, person: Person): { rate: number; limit: number; action: Action } | undefined {
  const rate = metricSamples(state, person, 'radiation').at(-1)?.v
  const limit = metrics(state, person).find((m) => m.key === 'radiation')?.warning
  if (rate === undefined || limit === undefined || rate < limit) return undefined
  const total = readingsFor(state, person.id, 'radiation').at(-1)?.v
  return {
    rate,
    limit,
    action: {
      observed: `Today’s dose is ${rate.toFixed(2)} mSv, above the design limit of ${limit} mSv a day ${state.place === 'surface' ? 'on the surface' : 'in free space'}.${total === undefined ? '' : ` Your mission total is ${total.toFixed(0)} mSv of the 600 mSv career limit.`}`,
      next: 'Spend rest and sleep in the best shielded quarters, keep time in the least shielded modules short, and report the daily dose to the ground at the next contact.',
      steps: ['Move today’s rest and sleep to the best shielded quarters.', 'Keep time in the least shielded modules short today.', 'Report the daily dose to the ground at the next contact.'],
      risk: 'Radiation and cancer',
    },
  }
}
export function metricLevel(metric: Metric, value: number): Level {
  if (metric.low !== undefined && value < metric.low) return 'warning'
  if (metric.lowerIsWorse) return value < metric.warning ? 'warning' : value < metric.caution ? 'caution' : 'ok'
  return value >= metric.warning ? 'warning' : value >= metric.caution ? 'caution' : 'ok'
}
export function metricSamples(state: AppState, person: Person, key: IndicatorKey): Sample[] {
  const readings = readingsFor(state, person.id, key).filter((r) => Number.isFinite(r.v) && r.activity === 'rest')
  return key === 'radiation' ? doseRates(readings) : readings
}
export function windowSamples(samples: Sample[], state: AppState, days: number): Sample[] {
  return samples.filter((r) => r.t >= state.day - days + 1 && r.t <= now(state))
}
