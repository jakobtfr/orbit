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
  | 'temp'
  | 'weight'
  | 'vision'
  | 'bone'
  | 'sleep'
  | 'exercise'
  | 'radiation'
  | 'cabin'
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
}

export interface PreflightValue {
  v: number
  v2?: number
  day: number
  n: number
}

export interface Person {
  id: string
  name: string
  role: string
  lead: boolean
  /** Indicators this person lets the whole crew see. 'symptoms' covers logged symptoms. */
  shared: (IndicatorKey | 'symptoms')[]
  preflight: Partial<Record<IndicatorKey, PreflightValue>>
}

export interface Action {
  observed: string
  next: string
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
  viewerId: string
  readings: Record<string, Partial<Record<IndicatorKey, Reading[]>>>
  cabin: Reading[]
  checkins: Record<string, CheckIn[]>
}
