import type { IndicatorKey } from '../lib/types'

/**
 * The equipment ORBIT reads from. Names follow hardware that flies today
 * (docs/solution/solution-overview.md, "Where the data comes from"). Battery levels
 * and link states are simulated.
 */
export interface Device {
  id: string
  name: string
  /** Matches IndicatorDef.source. */
  source: string
  owner: 'personal' | 'shared'
  power: 'battery' | 'cabin'
  /** Days a full charge lasts. */
  chargeDays?: number
  /** Shifts the simulated battery level so devices differ. */
  seed?: number
  how: 'Sends readings on its own' | 'Read and entered by hand'
  spec: string
  feeds: IndicatorKey[]
}

export const DEVICES: Device[] = [
  {
    id: 'shirt',
    name: 'Smart shirt',
    source: 'Smart shirt',
    owner: 'personal',
    power: 'battery',
    chargeDays: 2,
    seed: 42,
    how: 'Sends readings on its own',
    spec: 'Sensors in the fabric for heart rhythm, blood pressure, breathing, blood oxygen, skin temperature, and movement. Worn under clothing.',
    feeds: ['hr', 'bp', 'spo2'],
  },
  {
    id: 'wrist',
    name: 'Wrist tracker',
    source: 'Wrist tracker',
    owner: 'personal',
    power: 'battery',
    chargeDays: 7,
    seed: 2,
    how: 'Sends readings on its own',
    spec: 'Records movement, sleep, and light exposure. Worn day and night.',
    feeds: ['sleep'],
  },
  {
    id: 'dosimeter',
    name: 'Radiation monitor',
    source: 'Radiation monitor',
    owner: 'personal',
    power: 'battery',
    chargeDays: 30,
    seed: 13,
    how: 'Sends readings on its own',
    spec: 'Personal dose monitor carried at all times. Adds up the dose once a day.',
    feeds: ['radiation'],
  },
  {
    id: 'thermometer',
    name: 'Thermometer',
    source: 'Thermometer',
    owner: 'shared',
    power: 'battery',
    chargeDays: 90,
    seed: 30,
    how: 'Read and entered by hand',
    spec: 'Handheld thermometer from the medical kit. No data link.',
    feeds: ['temp'],
  },
  {
    id: 'mass',
    name: 'Body mass device',
    source: 'Body mass device',
    owner: 'shared',
    power: 'cabin',
    how: 'Sends readings on its own',
    spec: 'Measures body mass without gravity from how fast a spring moves the body. One person at a time.',
    feeds: ['weight'],
  },
  {
    id: 'exercise',
    name: 'Exercise machines',
    source: 'Exercise machines',
    owner: 'shared',
    power: 'cabin',
    how: 'Sends readings on its own',
    spec: 'Resistance machine, treadmill, and cycle. Each session is logged per person. Bone load is estimated from these sessions.',
    feeds: ['exercise', 'bone'],
  },
  {
    id: 'cabin',
    name: 'Cabin monitor',
    source: 'Cabin monitor',
    owner: 'shared',
    power: 'cabin',
    how: 'Sends readings on its own',
    spec: 'Fixed air monitor. Reports the carbon dioxide level every hour.',
    feeds: ['cabin'],
  },
]

export const HAND_ENTERED: { name: string; feeds: IndicatorKey[]; note: string }[] = [
  { name: 'Daily check-in', feeds: ['mood'], note: 'Symptoms and mood, answered by you. Mood stays private.' },
  { name: 'Reading card', feeds: ['vision'], note: 'Vision check, read from a card and entered by hand.' },
  { name: 'Blood pressure cuff', feeds: ['standing'], note: 'Standing test, entered by hand. Only where there is gravity.' },
]

/** Simulated battery level for a mission day, in percent. */
export function battery(d: Device, day: number): number | undefined {
  if (d.power !== 'battery') return undefined
  return 100 - ((day * 7 + (d.seed ?? 0)) % 88)
}

export const LOW_BATTERY = 20

export function deviceBySource(source: string): Device | undefined {
  return DEVICES.find((d) => d.source === source)
}
