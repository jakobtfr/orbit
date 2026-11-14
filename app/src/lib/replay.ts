import data from '../data/utmb-replay.json'

/**
 * Replays real NASA UTMB bed-rest days through two rule sets: fixed Earth cutoffs, and
 * ORBIT's personal rules against each subject's own pre-bed-rest values. These are the
 * rules of the data check in docs/solution/problems-and-hypotheses.md.
 */

export type Vital = 'hr' | 'sys' | 'dia' | 'temp'
export const VITALS: Vital[] = ['hr', 'sys', 'dia', 'temp']

export const VITAL_INFO: Record<Vital, { name: string; unit: string; decimals: number }> = {
  hr: { name: 'Heart rate', unit: 'bpm', decimals: 0 },
  sys: { name: 'Blood pressure, upper', unit: 'mmHg', decimals: 0 },
  dia: { name: 'Blood pressure, lower', unit: 'mmHg', decimals: 0 },
  temp: { name: 'Temperature', unit: '°C', decimals: 1 },
}

export interface Subject {
  id: string
  campaign: string
  /** Mean of the days before bed rest. Null where the source has no value. */
  baseline: { days: number } & Record<Vital, number | null>
  days: Day[]
}

export interface Day {
  day: number
  values: Record<Vital, number | null>
}

export const SUBJECTS: Subject[] = data.subjects.map((s) => ({
  id: s.id,
  campaign: s.campaign,
  baseline: s.baseline as Subject['baseline'],
  days: s.days.map(([day, hr, sys, dia, temp]) => ({ day: day as number, values: { hr, sys, dia, temp } })),
}))

export function subjectById(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id)
}

/** Earth cutoffs: any single reading over the line raises an alarm. */
export function earthLimit(v: Vital): number {
  return { hr: 100, sys: 130, dia: 80, temp: 38.0 }[v]
}

function earthOver(v: Vital, x: number): boolean {
  return v === 'hr' ? x > 100 : x >= earthLimit(v)
}

/** Personal limit: a set rise above this person's own value from before bed rest. None without a baseline. */
export function personalLimit(v: Vital, b: Subject['baseline']): number | null {
  if (b[v] === null) return null
  switch (v) {
    case 'hr':
      return b.hr! * 1.2
    case 'sys':
      return b.sys! + 20
    case 'dia':
      return b.dia! + 15
    case 'temp':
      return b.temp! + 0.5
  }
}

export const PERSONAL_RULE: Record<Vital, string> = {
  hr: '20% above own',
  sys: '+20 over own',
  dia: '+15 over own',
  temp: '+0.5 °C over own',
}

export interface Judged extends Day {
  /** Vitals over the Earth cutoff today. */
  earth: Vital[]
  /** Vitals over the personal limit today. */
  over: Vital[]
  earthAlarm: boolean
  /** ORBIT alarms only when the day before was also over a personal limit (one odd reading is not an alarm). */
  orbitAlarm: boolean
}

export function judgeSubject(s: Subject): Judged[] {
  let prevOver = false
  return s.days.map((d) => {
    const earth = VITALS.filter((v) => d.values[v] !== null && earthOver(v, d.values[v]!))
    const over = VITALS.filter((v) => {
      const x = d.values[v]
      const limit = personalLimit(v, s.baseline)
      return x !== null && limit !== null && x >= limit
    })
    const orbitAlarm = over.length > 0 && prevOver
    prevOver = over.length > 0
    return { ...d, earth, over, earthAlarm: earth.length > 0, orbitAlarm }
  })
}

export interface Totals {
  subjects: number
  days: number
  earth: number
  orbit: number
}

export function totals(subjects: Subject[] = SUBJECTS): Totals {
  const t: Totals = { subjects: subjects.length, days: 0, earth: 0, orbit: 0 }
  for (const s of subjects) {
    for (const d of judgeSubject(s)) {
      t.days++
      if (d.earthAlarm) t.earth++
      if (d.orbitAlarm) t.orbit++
    }
  }
  return t
}

/** The vital behind most alarms of either kind for a subject: the one worth charting first. */
export function mainVital(judged: Judged[]): Vital {
  const count = (v: Vital) => judged.filter((d) => d.earth.includes(v) || (d.orbitAlarm && d.over.includes(v))).length
  return VITALS.reduce((best, v) => (count(v) > count(best) ? v : best), 'hr' as Vital)
}
