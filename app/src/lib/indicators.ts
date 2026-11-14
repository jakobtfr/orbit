import type { Confidence, IndicatorKey, Provenance, Reading, RegionKey } from './types'

export interface IndicatorDef {
  key: IndicatorKey
  name: string
  region: RegionKey | 'beside'
  rule: string
  unit: string
  decimals: number
  /** Where the reading comes from, as shown to the crew. */
  source: string
  /** True when the reading arrives on its own from onboard equipment. */
  auto: boolean
  provenance: Provenance
  confidence: Confidence
  maxAgeDays: number
  chart: boolean
  /** Label for the value typed on the Measure screen. Empty when it cannot be entered by hand. */
  inputLabel: string
  input2Label?: string
  steps: string[]
}

export const INDICATORS: Record<IndicatorKey, IndicatorDef> = {
  hr: {
    key: 'hr',
    name: 'Heart rate at rest',
    region: 'chest',
    rule: 'R1',
    unit: 'bpm',
    decimals: 0,
    source: 'Smart shirt',
    auto: true,
    provenance: 'MEASURED',
    confidence: 'MODERATE',
    maxAgeDays: 1,
    chart: true,
    inputLabel: 'Beats per minute',
    steps: [
      'Sit or float still for 10 minutes. No exercise in the last hour.',
      'Check that the smart shirt sensors sit flat against the skin.',
      'Stay still and breathe normally for one minute.',
      'The reading arrives on its own. Enter it by hand only if the shirt is not in use.',
    ],
  },
  bp: {
    key: 'bp',
    name: 'Blood pressure',
    region: 'chest',
    rule: 'R2',
    unit: 'mmHg',
    decimals: 0,
    source: 'Smart shirt',
    auto: true,
    provenance: 'MEASURED',
    confidence: 'MODERATE',
    maxAgeDays: 1,
    chart: true,
    inputLabel: 'Upper value',
    input2Label: 'Lower value',
    steps: [
      'Rest for 5 minutes first.',
      'Keep the arm relaxed and level with the heart.',
      'Do not talk or move during the reading.',
      'If the result is unusual, wait 5 minutes and take it once more.',
    ],
  },
  standing: {
    key: 'standing',
    name: 'Standing blood pressure test',
    region: 'chest',
    rule: 'R3',
    unit: 'mmHg drop',
    decimals: 0,
    source: 'Entered by hand',
    auto: false,
    provenance: 'MEASURED',
    confidence: 'HIGH',
    maxAgeDays: 7,
    chart: true,
    inputLabel: 'Drop in the upper value after standing',
    steps: [
      'Lie down for 5 minutes and take a blood pressure reading.',
      'Stand up with someone next to you.',
      'After 3 minutes of standing, take a second reading.',
      'Enter how far the upper value fell. Sit down at once if you feel faint.',
    ],
  },
  spo2: {
    key: 'spo2',
    name: 'Blood oxygen',
    region: 'chest',
    rule: 'R5',
    unit: '%',
    decimals: 0,
    source: 'Smart shirt',
    auto: true,
    provenance: 'MEASURED',
    confidence: 'HIGH',
    maxAgeDays: 1,
    chart: true,
    inputLabel: 'Percent',
    steps: [
      'Warm your hands first. Cold fingers give low readings.',
      'Stay still for 30 seconds.',
      'If the result is below 95%, warm the hands and take it once more.',
    ],
  },
  temp: {
    key: 'temp',
    name: 'Body temperature',
    region: 'whole',
    rule: 'R4',
    unit: '°C',
    decimals: 1,
    source: 'Thermometer',
    auto: false,
    provenance: 'MEASURED',
    confidence: 'MODERATE',
    maxAgeDays: 1,
    chart: true,
    inputLabel: 'Degrees Celsius',
    steps: [
      'Measure at the same time each day, at rest.',
      'No exercise, food, or hot drink in the last 30 minutes.',
      'Hold the thermometer in place until it signals.',
      'Choose "After exercise" below if you have just trained.',
    ],
  },
  weight: {
    key: 'weight',
    name: 'Body weight',
    region: 'whole',
    rule: 'R10',
    unit: 'kg',
    decimals: 1,
    source: 'Body mass device',
    auto: true,
    provenance: 'MEASURED',
    confidence: 'MODERATE',
    maxAgeDays: 7,
    chart: true,
    inputLabel: 'Kilograms',
    steps: [
      'Use the body mass device before breakfast.',
      'Strap in and hold still while it swings.',
      'Take three swings. The device sends the average on its own.',
    ],
  },
  vision: {
    key: 'vision',
    name: 'Vision check',
    region: 'head',
    rule: 'R12',
    unit: '',
    decimals: 0,
    source: 'Entered by hand',
    auto: false,
    provenance: 'SELF-REPORTED',
    confidence: 'MODERATE',
    maxAgeDays: 30,
    chart: false,
    inputLabel: 'Result',
    steps: [
      'Hold the reading card at arm’s length in good light.',
      'Cover one eye and read the smallest line you can. Repeat with the other eye.',
      'Compare with the line you read last time.',
    ],
  },
  bone: {
    key: 'bone',
    name: 'Bone load',
    region: 'hips',
    rule: 'R9',
    unit: '% of plan',
    decimals: 0,
    source: 'Estimated from exercise',
    auto: true,
    provenance: 'MODELLED',
    confidence: 'LOW',
    maxAgeDays: 1,
    chart: false,
    inputLabel: '',
    steps: [],
  },
  sleep: {
    key: 'sleep',
    name: 'Sleep',
    region: 'beside',
    rule: 'R6',
    unit: 'h',
    decimals: 1,
    source: 'Wrist tracker',
    auto: true,
    provenance: 'MEASURED',
    confidence: 'MODERATE',
    maxAgeDays: 1,
    chart: true,
    inputLabel: 'Hours slept last night',
    steps: [
      'Wear the wrist tracker to bed.',
      'The night’s sleep arrives on its own after you wake.',
      'Enter the hours by hand only if the tracker was not worn.',
    ],
  },
  exercise: {
    key: 'exercise',
    name: 'Exercise',
    region: 'beside',
    rule: 'R9',
    unit: 'min',
    decimals: 0,
    source: 'Exercise machines',
    auto: true,
    provenance: 'MEASURED',
    confidence: 'LOW',
    maxAgeDays: 1,
    chart: true,
    inputLabel: 'Minutes of exercise yesterday',
    steps: [
      'Log in on the machine before each session.',
      'Sessions are added up and sent on their own at the end of the day.',
      'Enter the minutes by hand only for exercise done off the machines.',
    ],
  },
  radiation: {
    key: 'radiation',
    name: 'Radiation dose',
    region: 'beside',
    rule: 'R8',
    unit: 'mSv',
    decimals: 0,
    source: 'Radiation monitor',
    auto: true,
    provenance: 'MEASURED',
    confidence: 'HIGH',
    maxAgeDays: 1,
    chart: true,
    inputLabel: 'Total dose',
    steps: [
      'Keep the personal monitor on you at all times.',
      'The total is updated on its own once a day.',
    ],
  },
  cabin: {
    key: 'cabin',
    name: 'Cabin air',
    region: 'beside',
    rule: 'R11',
    unit: 'mmHg CO₂',
    decimals: 1,
    source: 'Cabin monitor',
    auto: true,
    provenance: 'MEASURED',
    confidence: 'HIGH',
    maxAgeDays: 1 / 24,
    chart: true,
    inputLabel: 'Carbon dioxide level',
    steps: ['The cabin monitor sends a reading every hour. Nothing needs to be done by hand.'],
  },
  mood: {
    key: 'mood',
    name: 'Mood',
    region: 'beside',
    rule: 'R7',
    unit: 'of 5',
    decimals: 0,
    source: 'Check-in',
    auto: false,
    provenance: 'SELF-REPORTED',
    confidence: 'LOW',
    maxAgeDays: 2,
    chart: true,
    inputLabel: '',
    steps: [],
  },
}

export const INDICATOR_ORDER: IndicatorKey[] = [
  'hr',
  'bp',
  'standing',
  'spo2',
  'temp',
  'weight',
  'vision',
  'bone',
  'sleep',
  'exercise',
  'radiation',
  'cabin',
  'mood',
]

export const BESIDE: IndicatorKey[] = ['sleep', 'radiation', 'cabin', 'exercise']

export interface RegionDef {
  key: RegionKey
  name: string
  intro: string
}

export const REGIONS: Record<RegionKey, RegionDef> = {
  head: {
    key: 'head',
    name: 'Head',
    intro:
      'Eyes and thinking. In weightlessness, fluid shifts toward the head. That can change the eyes over months, and headaches are among the most common complaints in flight.',
  },
  chest: {
    key: 'chest',
    name: 'Chest',
    intro:
      'Heart, blood pressure, and breathing. The heart and blood vessels adapt to weightlessness within days, so each reading is compared with your own values, not with Earth limits.',
  },
  skin: {
    key: 'skin',
    name: 'Skin',
    intro:
      'Skin rashes are the most common health problem on the station. A stressed immune system and a closed cabin both play a part. Nothing is measured here; rashes are logged in the daily check-in.',
  },
  hips: {
    key: 'hips',
    name: 'Hips and spine',
    intro:
      'Bone and muscle. Without the load of gravity, hips and spine lose bone every month. Daily exercise is the defence, so what is watched here is how much of the exercise plan gets done.',
  },
  whole: {
    key: 'whole',
    name: 'Whole body',
    intro: 'Signs that belong to the body as a whole: temperature, weight, and general complaints.',
  },
}

export const REGION_ORDER: RegionKey[] = ['head', 'chest', 'skin', 'hips', 'whole']

export const VISION_LABELS = ['No change', 'Change noticed', 'Sudden loss of vision']

export function formatValue(key: IndicatorKey, r: Pick<Reading, 'v' | 'v2'>): string {
  const d = INDICATORS[key]
  if (key === 'vision') return VISION_LABELS[Math.round(r.v)] ?? '—'
  if (key === 'bp') return `${Math.round(r.v)}/${Math.round(r.v2 ?? 0)}`
  return r.v.toFixed(d.decimals)
}
