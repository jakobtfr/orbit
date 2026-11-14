import type { IndicatorKey } from './types'

/**
 * The risks of human spaceflight named by NASA's Human Research Program
 * (https://www.nasa.gov/hrp/risks/), and how ORBIT watches each one: through readings,
 * through symptoms logged in the check-in, or through private check-in answers.
 * There is no risks screen: judge.ts uses this to say which risk a finding bears on.
 * The wording is ours and has not been reviewed by a clinician.
 */

export type RiskGroup = 'body' | 'mind' | 'radiation'

export interface Risk {
  id: string
  /** Plain name shown to the crew. */
  name: string
  /** The name NASA's Human Research Program uses. */
  hrp: string
  group: RiskGroup
  /** What it is and why it matters in space. */
  what: string
  /** Readings that show it. */
  indicators: IndicatorKey[]
  /** Check-in symptoms that point to it. */
  symptoms: string[]
  /** What the crew member can do about it. */
  act: string
  /** Watched through a private check-in answer, shown only to the person who gave it. */
  privateAnswer?: 'mood' | 'team'
}

export const RISK_GROUPS: { key: RiskGroup; title: string }[] = [
  { key: 'body', title: 'Body' },
  { key: 'mind', title: 'Mind, crew, and performance' },
  { key: 'radiation', title: 'Radiation' },
]

export const RISKS: Risk[] = [
  {
    id: 'immune', name: 'Weaker immune system', hrp: 'Altered immune system responses', group: 'body',
    what: 'Stress, short sleep, and radiation weaken the immune system in flight. Old viruses can wake up, and rashes and colds become more common.',
    indicators: ['temp', 'sleep'], symptoms: ['Skin rash', 'Cold or cough'],
    act: 'Protect your sleep, finish your meals, and keep up the exercise plan. Log any rash or cold in the check-in so it is seen early.',
  },
  {
    id: 'sensorimotor', name: 'Balance and motion sickness', hrp: 'Altered sensorimotor and vestibular function', group: 'body',
    what: 'The inner ear and the brain relearn balance at every change of gravity. Expect motion sickness in the first days of weightlessness and unsteady walking after a landing.',
    indicators: ['balance'], symptoms: ['Nausea or motion sickness', 'Dizziness'],
    act: 'Move your head slowly for the first days after a change in gravity. After a landing, stand up in stages and do the balance test with a crewmate beside you.',
  },
  {
    id: 'cardio', name: 'Heart and circulation', hrp: 'Cardiovascular adaptations', group: 'body',
    what: 'Without gravity, blood moves toward the head and the heart works against less load. Heart and vessels adapt within days, and standing up after landing can cause fainting.',
    indicators: ['hr', 'bp', 'standing'], symptoms: ['Dizziness'],
    act: 'Keep to the exercise plan and drink enough. After a landing, do the standing blood pressure test before heavy work.',
  },
  {
    id: 'dcs', name: 'Decompression sickness', hrp: 'Decompression sickness', group: 'body',
    what: 'Moving to a lower pressure, as in a spacesuit, can make nitrogen in the blood form bubbles. The usual sign is joint pain during or after suit work.',
    indicators: [], symptoms: ['Joint pain after suit work'],
    act: 'Complete the full oxygen pre-breathe before every suit session. Report joint pain, tingling, or itching skin after suit work at once; do not wait for the next check-in.',
  },
  {
    id: 'microbes', name: 'Microbes in a closed cabin', hrp: 'Host-microorganism interactions', group: 'body',
    what: 'The microbes on the skin, in the gut, and in the cabin change in flight, and some become more aggressive while the immune system is weaker.',
    indicators: ['water'], symptoms: ['Stomach or digestion', 'Skin rash'],
    act: 'Keep to the hygiene and cleaning routine, and never skip a failed water sample. Log stomach or skin problems in the check-in.',
  },
  {
    id: 'hypoxia', name: 'Low oxygen', hrp: 'Hypoxia', group: 'body',
    what: 'Oxygen in the body can fall when cabin pressure or suit pressure is lowered. Early signs are headache, tiredness, fast breathing, and poor judgement, which the person often does not notice.',
    indicators: ['spo2', 'o2', 'rr'], symptoms: ['Headache'],
    act: 'Check blood oxygen before and after any change in cabin or suit pressure. If it is low, check the cabin air and tell the medical lead.',
  },
  {
    id: 'nutrition', name: 'Food and nutrition', hrp: 'Inadequate food and nutrition', group: 'body',
    what: 'Food is the only supply of energy and nutrients for the whole mission. Crews tend to eat less than planned, and weight, muscle, and bone suffer.',
    indicators: ['intake', 'hydration', 'weight', 'glucose'], symptoms: [],
    act: 'Finish the planned meals even when appetite is low, and drink at least 2 litres a day.',
  },
  {
    id: 'eva', name: 'Injury during suit work', hrp: 'Injury and compromised performance from EVA', group: 'body',
    what: 'Work in a spacesuit is hard on hands and shoulders and drains the body and the mind. Tiredness, low oxygen, and high carbon dioxide in the suit add to the chance of injury.',
    indicators: [], symptoms: ['Injury', 'Joint pain after suit work'],
    act: 'Go out rested, fed, and hydrated. After every suit session, check hands, shoulders, and skin, and log anything sore in the check-in the same day.',
  },
  {
    id: 'fitness', name: 'Loss of fitness', hrp: 'Reduced cardiorespiratory and musculoskeletal fitness', group: 'body',
    what: 'Muscles and the heart weaken quickly when they do not work against gravity. The strength is needed later: for suit work, for landing, and for an emergency.',
    indicators: ['exercise', 'hr', 'weight'], symptoms: [],
    act: 'Do the full 120 minutes of resistance and cardio every day. Missed days cannot be made up later.',
  },
  {
    id: 'sans', name: 'Eye and brain changes', hrp: 'Spaceflight associated neuro-ocular syndrome (SANS)', group: 'body',
    what: 'Fluid shifts toward the head and presses on the back of the eye. Vision can change over months, often without pain.',
    indicators: ['vision'], symptoms: ['Vision change'],
    act: 'Do the vision check on schedule with each eye separately. Report any change, even a small one.',
  },
  {
    id: 'bone', name: 'Bone loss', hrp: 'Spaceflight-induced bone changes', group: 'body',
    what: 'Without load, hips and spine lose 1 to 1.5% of their bone every month. It cannot be felt or measured on board, so it is estimated from exercise.',
    indicators: ['bone', 'exercise'], symptoms: [],
    act: 'Resistance exercise is the defence. Keep to the plan and finish your meals.',
  },
  {
    id: 'behaviour', name: 'Mood and mental health', hrp: 'Behavioral changes and psychiatric disorders', group: 'mind',
    what: 'Years of isolation, confinement, and distance from home wear on everyone. Low mood, anxiety, and loss of drive are expected, and they affect how well symptoms are noticed.',
    indicators: [], symptoms: [], privateAnswer: 'mood',
    act: 'Use the private diary, keep contact with home, and ask the medical lead for a private talk when a low mood lasts.',
  },
  {
    id: 'team', name: 'Working as a crew', hrp: 'Inadequate teamwork', group: 'mind',
    what: 'A few people share a small space for years. Small tensions grow when they are not spoken about, and a crew that does not work well together makes mistakes.',
    indicators: [], symptoms: [], privateAnswer: 'team',
    act: 'Raise a tension early and in person. If it does not ease, ask the commander for a crew talk or the medical lead for a private one.',
  },
  {
    id: 'sleep', name: 'Sleep and schedule', hrp: 'Inadequate sleep and irregular schedules', group: 'mind',
    what: 'Crews sleep about 6 hours a night in flight against a plan of 8.5. Lost sleep builds up and shows as slower thinking and more errors.',
    indicators: ['sleep', 'cognition'], symptoms: ['Trouble sleeping'],
    act: 'Protect the sleep period: dim the lights and stop work one hour before. Repeat the thinking test after a short night.',
  },
  {
    id: 'systems', name: 'Running the systems alone', hrp: 'Inadequate systems operations support', group: 'mind',
    what: 'Far from Earth the crew must handle vehicle and equipment problems without live help. ORBIT covers the health side: it watches the life-support readings that affect the body and explains every measurement, and its doctor runs on board.',
    indicators: ['cabin', 'o2', 'noise', 'water'], symptoms: [],
    act: 'When a cabin reading is off, follow its next action first and report to the ground at the next contact.',
  },
  {
    id: 'loads', name: 'Injury at launch and landing', hrp: 'Injury from dynamic loads', group: 'mind',
    what: 'Launch, landing, and aborts put sudden high loads on the body. After months without gravity, the spine and neck are easier to hurt.',
    indicators: [], symptoms: ['Injury', 'Pain'],
    act: 'Before a landing, check the seat and suit fit and tighten the straps. In the days after, log any back or neck pain in the check-in.',
  },
  {
    id: 'cancer', name: 'Radiation and cancer', hrp: 'Radiation-induced cancers', group: 'radiation',
    what: 'Radiation in deep space adds up over the mission and raises the chance of cancer later in life. Nothing is felt while the dose builds.',
    indicators: ['radiation'], symptoms: [],
    act: 'Follow the shelter plan during solar events and sleep in the shielded quarters.',
  },
]

/** The risks a reading bears on. */
export function risksForIndicator(key: IndicatorKey): Risk[] {
  return RISKS.filter((r) => r.indicators.includes(key) || (key === 'mood' && r.privateAnswer === 'mood'))
}

/** The risks any of these check-in symptoms point to. */
export function risksForSymptoms(names: string[]): Risk[] {
  return RISKS.filter((r) => r.symptoms.some((name) => names.includes(name)))
}
