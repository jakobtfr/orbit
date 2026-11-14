import { BESIDE, INDICATORS, INDICATOR_ORDER, REGIONS, REGION_ORDER } from './indicators'
import type {
  Action,
  AppState,
  CheckIn,
  IndicatorKey,
  Judged,
  Person,
  Place,
  Reading,
  RegionKey,
  StatusKey,
  Symptom,
} from './types'

/**
 * Fake logic for version 1 (SPEC.md, "Fake logic"). These are simplified forms of
 * rules R1 to R12 in docs/research/clinical-thresholds.md. They are prototype rules,
 * not clinical ones.
 */

export const TIME_OF_DAY = 8.25 / 24
export const EXERCISE_PLAN_MIN = 120

export const SEVERITY: Record<StatusKey, number> = {
  warning: 5,
  caution: 4,
  repeat: 3,
  stale: 2,
  ok: 1,
  unavailable: 0,
}

export function now(state: AppState): number {
  return state.day + TIME_OF_DAY
}

export function worst(statuses: StatusKey[]): StatusKey {
  let w: StatusKey = 'ok'
  let any = false
  for (const s of statuses) {
    if (s === 'unavailable') continue
    any = true
    if (SEVERITY[s] > SEVERITY[w]) w = s
  }
  return any ? w : 'ok'
}

export function readingsFor(state: AppState, personId: string, key: IndicatorKey): Reading[] {
  const t = now(state)
  if (key === 'cabin') return state.cabin.filter((r) => r.t <= t)
  if (key === 'mood') {
    return (state.checkins[personId] ?? [])
      .filter((c) => c.t <= t)
      .map((c) => ({ t: c.t, v: c.mood, activity: 'rest' as const, source: 'Check-in', provenance: 'SELF-REPORTED' as const }))
  }
  if (key === 'bone') return boneSeries(state, personId)
  return (state.readings[personId]?.[key] ?? []).filter((r) => r.t <= t)
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
}

/** Share of the exercise plan done over the 14 days up to each exercise reading. */
function boneSeries(state: AppState, personId: string): Reading[] {
  const ex = readingsFor(state, personId, 'exercise')
  if (!ex.length) return []
  const last = ex[ex.length - 1]
  const window = ex.filter((r) => r.t > last.t - 14)
  const adherence = mean(window.map((r) => Math.min(r.v / EXERCISE_PLAN_MIN, 1))) * 100
  return [{ t: last.t, v: adherence, activity: 'rest', source: 'Estimated from exercise', provenance: 'MODELLED' }]
}

export interface Baselines {
  /** Value measured on Earth before flight. */
  pre?: number
  pre2?: number
  /** Mean of the resting readings in the 7 days before the latest one. */
  recent?: number
  recent2?: number
  /** Mean of the 30 days before the latest reading. */
  month?: number
}

export function baselines(state: AppState, person: Person, key: IndicatorKey): Baselines {
  const all = readingsFor(state, person.id, key).filter((r) => r.activity === 'rest')
  const latest = all[all.length - 1]
  const pre = person.preflight[key]
  const b: Baselines = { pre: pre?.v, pre2: pre?.v2 }
  if (!latest) return b
  const before = all.slice(0, -1)
  const week = before.filter((r) => r.t > latest.t - 7.5)
  const month = before.filter((r) => r.t > latest.t - 30.5)
  if (week.length) {
    b.recent = mean(week.map((r) => r.v))
    if (key === 'bp') b.recent2 = mean(week.map((r) => r.v2 ?? NaN))
  }
  if (month.length) b.month = mean(month.map((r) => r.v))
  return b
}

export interface Level {
  level: 'ok' | 'caution' | 'warning'
  arrow?: '↑' | '↓'
  /** A warning-level value that is dangerous on its own and does not wait for a repeat. */
  immediate?: boolean
}

/** Judges one reading on its own against limits and the person's baselines. */
export function classify(key: IndicatorKey, r: Pick<Reading, 'v' | 'v2'>, b: Baselines): Level {
  const v = r.v
  switch (key) {
    case 'hr': {
      if (v > 120) return { level: 'warning', arrow: '↑' }
      if (v < 40) return { level: 'warning', arrow: '↓' }
      if (v > 100 || (b.pre !== undefined && v >= b.pre * 1.2)) return { level: 'caution', arrow: '↑' }
      return { level: 'ok' }
    }
    case 'bp': {
      const d = r.v2 ?? 0
      if (v < 80) return { level: 'warning', arrow: '↓', immediate: true }
      if (v >= 140 || d >= 90) return { level: 'warning', arrow: '↑' }
      const risen = b.pre !== undefined && b.pre2 !== undefined && (v >= b.pre + 20 || d >= b.pre2 + 15)
      if (v >= 130 || d >= 80 || risen) return { level: 'caution', arrow: '↑' }
      if (v < 90 || (d > 0 && d < 60)) return { level: 'caution', arrow: '↓' }
      return { level: 'ok' }
    }
    case 'standing':
      return v >= 20 ? { level: 'caution', arrow: '↑' } : { level: 'ok' }
    case 'spo2':
      if (v < 90) return { level: 'warning', arrow: '↓', immediate: true }
      if (v < 95) return { level: 'caution', arrow: '↓' }
      return { level: 'ok' }
    case 'rr':
      if (v < 8 || v > 30) return { level: 'warning', arrow: v < 8 ? '↓' : '↑', immediate: true }
      if (v < 10 || v > 24) return { level: 'caution', arrow: v < 10 ? '↓' : '↑' }
      return { level: 'ok' }
    case 'glucose':
      if (v < 54 || v >= 200) return { level: 'warning', arrow: v < 54 ? '↓' : '↑', immediate: true }
      if (v < 70 || v >= 100) return { level: 'caution', arrow: v < 70 ? '↓' : '↑' }
      return { level: 'ok' }
    case 'intake':
      if (v < 60) return { level: 'warning', arrow: '↓' }
      if (v < 80) return { level: 'caution', arrow: '↓' }
      return { level: 'ok' }
    case 'hydration':
      if (v < 1.5) return { level: 'warning', arrow: '↓' }
      if (v < 2) return { level: 'caution', arrow: '↓' }
      return { level: 'ok' }
    case 'temp': {
      if (v >= 39.5) return { level: 'warning', arrow: '↑', immediate: true }
      if (v >= 38.5 || (b.recent !== undefined && v - b.recent >= 0.5)) return { level: 'caution', arrow: '↑' }
      return { level: 'ok' }
    }
    case 'weight': {
      const base = b.month ?? b.pre
      if (base === undefined) return { level: 'ok' }
      const change = (v - base) / base
      if (change <= -0.05) return { level: 'warning', arrow: '↓' }
      if (change <= -0.03) return { level: 'caution', arrow: '↓' }
      return { level: 'ok' }
    }
    case 'vision':
      if (v >= 2) return { level: 'warning', immediate: true }
      if (v >= 1) return { level: 'caution' }
      return { level: 'ok' }
    case 'hearing':
      if (v >= 25) return { level: 'warning', arrow: '↑' }
      if (v >= 10) return { level: 'caution', arrow: '↑' }
      return { level: 'ok' }
    case 'cognition':
      if (v < 70 || (b.pre !== undefined && b.pre - v >= 20)) return { level: 'warning', arrow: '↓' }
      if (v < 80 || (b.pre !== undefined && b.pre - v >= 10)) return { level: 'caution', arrow: '↓' }
      return { level: 'ok' }
    case 'balance':
      if (v < 10) return { level: 'warning', arrow: '↓' }
      if (v < 20) return { level: 'caution', arrow: '↓' }
      return { level: 'ok' }
    case 'bone':
      // A modelled value alone never produces a warning (SH5).
      return v < 80 ? { level: 'caution', arrow: '↓' } : { level: 'ok' }
    case 'sleep':
      if (v < 4) return { level: 'warning', arrow: '↓' }
      if (v < 6) return { level: 'caution', arrow: '↓' }
      return { level: 'ok' }
    case 'exercise':
      return v < EXERCISE_PLAN_MIN * 0.8 ? { level: 'caution', arrow: '↓' } : { level: 'ok' }
    case 'radiation':
      if (v >= 600) return { level: 'warning', arrow: '↑', immediate: true }
      if (v >= 480) return { level: 'caution', arrow: '↑' }
      return { level: 'ok' }
    case 'cabin':
      if (v > 5) return { level: 'warning', arrow: '↑', immediate: true }
      if (v > 3) return { level: 'caution', arrow: '↑' }
      return { level: 'ok' }
    case 'o2':
      if (v < 120) return { level: 'warning', arrow: '↓', immediate: true }
      if (v < 145) return { level: 'caution', arrow: '↓' }
      return { level: 'ok' }
    case 'noise':
      if (v >= 72) return { level: 'warning', arrow: '↑' }
      if (v > 60) return { level: 'caution', arrow: '↑' }
      return { level: 'ok' }
    case 'water':
      if (v < 0.05) return { level: 'warning', arrow: '↓' }
      if (v < 0.1 || v > 1) return { level: 'caution', arrow: v > 1 ? '↑' : '↓' }
      return { level: 'ok' }
    case 'mood':
      return v <= 2 ? { level: 'caution', arrow: '↓' } : { level: 'ok' }
  }
}

export function unavailableReason(key: IndicatorKey, place: Place): string | undefined {
  if ((key === 'standing' || key === 'balance') && (place === 'spacecraft' || place === 'station')) {
    return key === 'standing' ? 'The standing test needs gravity.' : 'The balance test needs gravity.'
  }
  return undefined
}

/** How many of the latest readings in a row must be out of range before the status is confirmed. */
const CONFIRM: Partial<Record<IndicatorKey, number>> = { sleep: 3, exercise: 3, mood: 2, intake: 3, hydration: 3 }
/** Indicators where one reading is enough, because they are totals, the environment, or a periodic check. */
const NO_REPEAT: IndicatorKey[] = ['radiation', 'cabin', 'o2', 'noise', 'water', 'vision', 'hearing', 'cognition', 'bone', 'weight', 'standing', 'balance']

export function judge(state: AppState, person: Person, key: IndicatorKey): Judged {
  const reason = unavailableReason(key, state.place)
  if (reason) return { status: 'unavailable', reason }

  const def = INDICATORS[key]
  const all = readingsFor(state, person.id, key)
  const resting = all.filter((r) => r.activity === 'rest')
  const latest = resting[resting.length - 1]
  if (!latest) return { status: 'stale' }
  if (now(state) - latest.t > def.maxAgeDays) return { status: 'stale', latest }

  const b = baselines(state, person, key)
  const lvl = classify(key, latest, b)
  if (lvl.level === 'ok') return { status: 'ok', latest }
  if (lvl.immediate || NO_REPEAT.includes(key)) return { status: lvl.level, arrow: lvl.arrow, latest }

  // One odd reading is not an alarm (SH6): it must be confirmed by the readings before it.
  const need = CONFIRM[key] ?? 2
  const recent = resting.slice(-need)
  // The readings must also point the same way: a low one does not confirm a high one.
  const confirmed = recent.length === need && recent.every((r) => { const c = classify(key, r, b); return c.level !== 'ok' && c.arrow === lvl.arrow })
  if (confirmed) return { status: lvl.level, arrow: lvl.arrow, latest }
  if (key === 'sleep' || key === 'exercise' || key === 'mood') return { status: 'ok', latest }
  return { status: 'repeat', arrow: lvl.arrow, latest }
}

/* ---------- symptoms ---------- */

export const SYMPTOM_WINDOW_DAYS = 2

export interface LoggedSymptom extends Symptom {
  t: number
}

export function symptomsFor(state: AppState, personId: string, region?: RegionKey): LoggedSymptom[] {
  const t = now(state)
  const out: LoggedSymptom[] = []
  for (const c of state.checkins[personId] ?? []) {
    if (c.t > t) continue
    for (const s of c.symptoms) {
      if (!region || s.region === region) out.push({ ...s, t: c.t })
    }
  }
  return out.sort((a, b) => b.t - a.t)
}

export function activeSymptoms(state: AppState, personId: string, region?: RegionKey): LoggedSymptom[] {
  const t = now(state)
  return symptomsFor(state, personId, region).filter((s) => t - s.t <= SYMPTOM_WINDOW_DAYS)
}

export function symptomStatus(state: AppState, personId: string, region: RegionKey): StatusKey {
  return activeSymptoms(state, personId, region).length ? 'caution' : 'ok'
}

export const SYMPTOM_REGION: Record<string, RegionKey> = {
  Headache: 'head',
  'Vision change': 'head',
  Dizziness: 'head',
  'Skin rash': 'skin',
  'Cold or cough': 'chest',
  'Trouble sleeping': 'whole',
  'Stomach or digestion': 'whole',
  Other: 'whole',
}

/* ---------- regions and overall ---------- */

export function regionIndicators(region: RegionKey): IndicatorKey[] {
  return INDICATOR_ORDER.filter((k) => INDICATORS[k].region === region)
}

export interface RegionSummary {
  region: RegionKey
  status: StatusKey
}

export function regionStatus(state: AppState, person: Person, region: RegionKey): StatusKey {
  const s = regionIndicators(region).map((k) => judge(state, person, k).status)
  s.push(symptomStatus(state, person.id, region))
  return worst(s)
}

export function regionSummaries(state: AppState, person: Person): RegionSummary[] {
  return REGION_ORDER.map((region) => ({ region, status: regionStatus(state, person, region) }))
}

export interface AttentionItem {
  kind: 'indicator' | 'symptom'
  key?: IndicatorKey
  region?: RegionKey
  status: StatusKey
  label: string
}

/** Everything about a person that is not in range, most serious first. Mood is left out: it is private. */
export function attention(state: AppState, person: Person): AttentionItem[] {
  const items: AttentionItem[] = []
  for (const k of INDICATOR_ORDER) {
    if (k === 'mood') continue
    const j = judge(state, person, k)
    if (j.status !== 'ok' && j.status !== 'unavailable') {
      items.push({ kind: 'indicator', key: k, status: j.status, label: INDICATORS[k].name })
    }
  }
  for (const region of REGION_ORDER) {
    const act = activeSymptoms(state, person.id, region)
    if (act.length) {
      items.push({ kind: 'symptom', region, status: 'caution', label: act.map((s) => s.name).join(', ') })
    }
  }
  return items.sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status])
}

export function lastCheckIn(state: AppState, personId: string): CheckIn | undefined {
  const t = now(state)
  const list = (state.checkins[personId] ?? []).filter((c) => c.t <= t)
  return list[list.length - 1]
}

export function checkedInToday(state: AppState, personId: string): boolean {
  const c = lastCheckIn(state, personId)
  return !!c && Math.floor(c.t) === state.day
}

/* ---------- next actions (draft wording, see SPEC.md open points) ---------- */

export function actionFor(state: AppState, person: Person, item: AttentionItem): Action {
  const base = `/body/${person.id}`
  if (item.kind === 'symptom' && item.region) {
    const names = item.label.toLowerCase()
    const co2 = judge(state, person, 'cabin')
    const cabinLine =
      item.region === 'head' && co2.latest
        ? co2.status === 'ok'
          ? ' Cabin carbon dioxide is in range.'
          : ' Cabin carbon dioxide is not confirmed in range.'
        : ''
    return {
      observed: `Logged in a check-in: ${names}.${cabinLine}`,
      next: 'Rest, drink water, and log how it feels at the next check-in. Tell the medical lead if it gets worse or lasts 3 days.',
      button: { label: 'View symptom', to: `${base}/symptoms/${item.region}` },
    }
  }
  const key = item.key as IndicatorKey
  const def = INDICATORS[key]
  const j = judge(state, person, key)
  const b = baselines(state, person, key)
  const measure = { label: 'Repeat reading', to: `${base}/measure/${key}` }
  const lower = def.name.toLowerCase()

  if (item.status === 'stale') {
    return {
      observed: j.latest
        ? `The last ${lower} reading is too old to rely on.`
        : `There is no ${lower} reading yet.`,
      next: 'Take a new reading.',
      button: { label: 'Take a reading', to: `${base}/measure/${key}` },
    }
  }
  if (item.status === 'repeat') {
    return {
      observed: `One ${lower} reading is outside the usual range. A single reading can be wrong.`,
      next: 'Rest for 5 minutes, then take the reading once more.',
      button: measure,
    }
  }
  switch (key) {
    case 'hr':
      return {
        observed: `Resting heart rate has stayed above the before-flight value of ${b.pre?.toFixed(0)} bpm by 20% or more for at least 2 days.`,
        next: 'Rest for 10 minutes and repeat the reading. Tell the medical lead today.',
        button: measure,
      }
    case 'bp':
      if (j.arrow === '↓') {
        return {
          observed: item.status === 'warning'
            ? 'Blood pressure is very low: the upper value is under 80.'
            : 'Blood pressure has been below 90 over 60 on two readings in a row.',
          next: 'Sit or lie down, drink water, and repeat the reading after 5 minutes. Tell the medical lead today.',
          button: measure,
        }
      }
      return {
        observed: 'Blood pressure has been above the usual range on two readings in a row.',
        next: 'Rest for 5 minutes and repeat the reading. Tell the medical lead today.',
        button: measure,
      }
    case 'spo2':
      return {
        observed: 'Blood oxygen is below 95% on repeated readings.',
        next: 'Warm the hands, repeat the reading, and check the cabin air. Tell the medical lead.',
        button: measure,
      }
    case 'temp':
      return {
        observed: `Body temperature is 0.5 °C or more above the recent in-flight readings (${b.recent?.toFixed(1)} °C).`,
        next: 'Rest, drink water, and repeat the reading in one hour. Tell the medical lead.',
        button: measure,
      }
    case 'weight':
      return {
        observed: 'Body weight has fallen by 3% or more against the last 30 days.',
        next: 'Check that meals are being finished. Tell the medical lead at the next opportunity.',
      }
    case 'sleep':
      return {
        observed: 'Sleep has been under 6 hours for 3 nights in a row. The plan allows 8.5 hours.',
        next: 'Protect tonight’s sleep period: dim the lights and stop work one hour before. Tell the medical lead if it continues.',
      }
    case 'exercise':
      return {
        observed: 'Exercise has been under 80% of the plan for 3 days in a row.',
        next: 'Book today’s session now. Exercise is the main protection for bone and muscle.',
      }
    case 'bone':
      return {
        observed: 'Less than 80% of the exercise plan was done in the last 14 days. Bone protection is estimated from exercise, not measured.',
        next: 'Return to the full exercise plan. Report it to the ground at the next contact.',
      }
    case 'radiation':
      return {
        observed:
          item.status === 'warning'
            ? 'Total radiation dose is above the career limit of 600 mSv.'
            : 'Total radiation dose has reached 80% of the career limit of 600 mSv.',
        next: 'Report to the ground at the next contact and follow the shelter plan during solar events.',
      }
    case 'cabin':
      return {
        observed: 'Cabin carbon dioxide is above 3 mmHg.',
        next: 'Check the air scrubber and move to a better ventilated area. Watch for headache and tiredness.',
      }
    case 'mood':
      return {
        observed: 'Mood has been 2 of 5 or lower for 2 check-ins in a row.',
        next: 'This entry stays private. Consider asking the medical lead for a private talk.',
      }
    case 'vision':
      return {
        observed: 'A change in vision was reported.',
        next: 'Repeat the vision check with each eye and contact the ground at the next opportunity.',
        button: { label: 'Repeat check', to: `${base}/measure/${key}` },
      }
    case 'rr':
      return {
        observed: 'Breathing rate has stayed outside 10 to 24 breaths a minute.',
        next: 'Sit still and count again for one minute. Tell the medical lead if it stays high or very low.',
        button: measure,
      }
    case 'glucose':
      return {
        observed: j.arrow === '↓' ? 'Fasting blood sugar is below 70 mg/dL.' : 'Fasting blood sugar is at or above 100 mg/dL.',
        next: 'Wash the finger and repeat the fingerstick. Eat if it is low. Tell the medical lead if it stays out of range.',
        button: measure,
      }
    case 'intake':
      return {
        observed: 'Less than 80% of the food plan was eaten for several days.',
        next: 'Finish today’s meals. Tell the medical lead if food is being left because of taste, nausea, or time.',
      }
    case 'hydration':
      return {
        observed: 'Fluid drunk is under 2 litres. Low drinking raises the chance of a kidney stone.',
        next: 'Drink water through the rest of the day and log it.',
      }
    case 'hearing':
      return {
        observed: 'Hearing has shifted by 10 dB or more from before flight.',
        next: 'Repeat the hearing check in a quiet module and limit time beside the loudest fans. Tell the medical lead.',
        button: measure,
      }
    case 'cognition':
      return {
        observed: 'The thinking score is 10 points or more below the before-flight score.',
        next: 'Repeat the short test once after sleep. Tell the medical lead if the drop remains.',
        button: measure,
      }
    case 'balance':
      return {
        observed: 'The balance test was held for under 20 seconds.',
        next: 'Repeat it with a crewmate beside you. Tell the medical lead if standing still is hard.',
        button: measure,
      }
    case 'o2':
      return {
        observed: 'Cabin oxygen is below 145 mmHg.',
        next: 'Check the oxygen supply and the cabin pressure. Watch for headache, tiredness, and fast breathing.',
      }
    case 'noise':
      return {
        observed: 'Cabin noise has averaged above 60 dBA.',
        next: 'Use hearing protection near the loud equipment and sleep in the quieter module.',
      }
    case 'water':
      return {
        observed: j.arrow === '↑' ? 'The biocide in the drinking water is high.' : 'The biocide in the drinking water is too low to hold microbes back.',
        next: 'Do not ignore a failed water sample. Use the reserve water and tell the ground.',
      }
    default:
      return {
        observed: `${def.name} is outside the usual range.`,
        next: 'Repeat the reading and tell the medical lead.',
        button: measure,
      }
  }
}

/* ---------- chart helpers ---------- */

export interface ChartGuide {
  band?: [number, number]
  bandLabel?: string
  limits: { v: number; label: string }[]
  /** The fixed Earth cutoff, drawn next to the personal limits for comparison. Always shown. */
  earth?: { v: number; label: string }
}

export function chartGuide(key: IndicatorKey, b: Baselines): ChartGuide {
  switch (key) {
    case 'hr':
      return {
        band: b.pre !== undefined ? [b.pre - 6, b.pre + 6] : undefined,
        bandLabel: 'Your normal',
        limits: b.pre !== undefined ? [{ v: b.pre * 1.2, label: 'Your limit' }] : [],
        earth: { v: 100, label: 'Earth 100' },
      }
    case 'bp':
      return {
        band: b.pre !== undefined ? [b.pre - 6, b.pre + 6] : undefined,
        bandLabel: 'Your normal',
        limits: b.pre !== undefined ? [{ v: b.pre + 20, label: 'Your limit' }] : [],
        earth: { v: 130, label: 'Earth 130' },
      }
    case 'standing':
      return { limits: [{ v: 20, label: 'Drop of 20' }] }
    case 'spo2':
      return { limits: [{ v: 95, label: '95%' }] }
    case 'temp':
      return {
        band: b.recent !== undefined ? [b.recent - 0.4, b.recent + 0.4] : undefined,
        bandLabel: 'Your last 7 days',
        limits: b.recent !== undefined ? [{ v: b.recent + 0.5, label: 'Your limit' }] : [],
        earth: { v: 38.0, label: 'Earth 38.0' },
      }
    case 'weight': {
      const base = b.month ?? b.pre
      return {
        limits: base !== undefined ? [{ v: base * 0.97, label: '−3%' }] : [],
      }
    }
    case 'sleep':
      return { band: [7, 9], bandLabel: 'Plan', limits: [{ v: 6, label: '6 h' }] }
    case 'exercise':
      return { limits: [{ v: EXERCISE_PLAN_MIN * 0.8, label: '80% of plan' }] }
    case 'radiation':
      return { limits: [{ v: 480, label: '80% of limit' }, { v: 600, label: 'Career limit' }] }
    case 'cabin':
      return { limits: [{ v: 3, label: '3 mmHg' }] }
    case 'rr':
      return { band: [12, 20], bandLabel: 'Usual', limits: [{ v: 10, label: '10' }, { v: 24, label: '24' }] }
    case 'glucose':
      return { band: [70, 99], bandLabel: 'Fasting', limits: [{ v: 70, label: '70' }, { v: 100, label: '100' }] }
    case 'intake':
      return { limits: [{ v: 80, label: '80% of plan' }] }
    case 'hydration':
      return { limits: [{ v: 2, label: '2 L' }] }
    case 'hearing':
      return { limits: [{ v: 10, label: '10 dB' }] }
    case 'cognition':
      return { limits: b.pre !== undefined ? [{ v: b.pre - 10, label: '−10 from yours' }] : [{ v: 80, label: '80' }] }
    case 'balance':
      return { limits: [{ v: 20, label: '20 s' }] }
    case 'o2':
      return { limits: [{ v: 145, label: '145 mmHg' }] }
    case 'noise':
      return { limits: [{ v: 60, label: '60 dBA' }] }
    case 'water':
      return { limits: [{ v: 0.1, label: '0.10 mg/L' }] }
    case 'mood':
      return { limits: [{ v: 2, label: '2 of 5' }] }
    default:
      return { limits: [] }
  }
}

export { BESIDE, REGIONS }
