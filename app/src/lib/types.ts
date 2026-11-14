export type StatusKey = 'ok' | 'caution' | 'warning' | 'stale' | 'unavailable' | 'repeat'
export type RegionKey = 'head' | 'chest' | 'skin' | 'hips' | 'whole'
export type Place = 'spacecraft' | 'station' | 'surface' | 'landing'
export type Provenance = 'MEASURED' | 'SELF-REPORTED' | 'MODELLED' | 'SIMULATED'
export type Confidence = 'HIGH' | 'MODERATE' | 'LOW'
export type Activity = 'rest' | 'during' | 'after'

export type IndicatorKey =
  | 'hr'
  | 'bp'
  | 'standing'
  | 'spo2'
  | 'rr'
  | 'temp'
  | 'weight'
  | 'glucose'
  | 'intake'
  | 'hydration'
  | 'vision'
  | 'hearing'
  | 'cognition'
  | 'balance'
  | 'bone'
  | 'sleep'
  | 'exercise'
  | 'radiation'
  | 'cabin'
  | 'o2'
  | 'noise'
  | 'water'
  | 'mood'

/** Time is counted in mission days. 100.5 is noon on mission day 100. Negative is before launch. */
export interface Reading {
  t: number
  v: number
  v2?: number
  activity: Activity
  source: string
  provenance: Provenance
}

export interface Symptom {
  name: string
  region: RegionKey
  pain?: number
}

export interface CheckIn {
  t: number
  feel: 'Fine' | 'Not quite right' | 'Unwell'
  symptoms: Symptom[]
  mood: number
  /** How it is going with the crew, 1 to 5. Private, like mood. */
  team?: number
}

export interface PreflightValue {
  v: number
  v2?: number
  day: number
  n: number
}

/** Someone on board. Only the user of the app has readings. */
export interface CrewMember {
  id: string
  name: string
  role: string
}

/** The crew member whose health the app shows. */
export interface Person extends CrewMember {
  preflight: Partial<Record<IndicatorKey, PreflightValue>>
}

export interface Action {
  observed: string
  next: string
  /** The next action as separate steps, shown one at a time. When absent, each sentence of `next` is a step. */
  steps?: string[]
  /** The NASA HRP spaceflight risk or risks this finding bears on, by plain name. */
  risk?: string
  button?: { label: string; to: string }
}

export interface Judged {
  status: StatusKey
  arrow?: '↑' | '↓'
  latest?: Reading
  /** Shown when the indicator is unavailable. */
  reason?: string
}

export interface AppState {
  day: number
  place: Place
  readings: Record<string, Partial<Record<IndicatorKey, Reading[]>>>
  cabin: Reading[]
  checkins: Record<string, CheckIn[]>
}
