import type { Place } from './types'

/**
 * Refresher guides: what to do in a given situation, one animated step at a time.
 * They run on the device with no network. The steps follow the published guidelines listed
 * with each guide; the wording is ours and has not been reviewed by a clinician.
 */

export type SceneKey =
  | 'respond' | 'call' | 'breathing' | 'restrain' | 'compress' | 'aed' | 'rest' | 'clock' | 'monitor'
  | 'cough' | 'backblows' | 'thrusts' | 'press' | 'bandage' | 'legsup' | 'drink' | 'stages'

export interface GuideStep {
  title: string
  text: string
  /** Replaces the text where there is gravity: on a surface or after landing. */
  gravityText?: string
  /** A step that only applies in weightlessness or only with gravity. */
  only?: 'weightless' | 'gravity'
  scene: SceneKey
  /** A countdown offered with the step, in seconds. */
  seconds?: number
  /** A beat to follow, per minute, counted in sets. */
  pace?: { perMinute: number; count: number }
  /** Another guide to open from this step. */
  link?: { label: string; guide: string }
}

export interface Guide {
  id: string
  title: string
  /** When to open it. */
  when: string
  emergency: boolean
  /** Shown when the guide is for a place the crew is not in now. */
  needs?: 'gravity'
  cover: SceneKey
  steps: GuideStep[]
  sources: { label: string; url: string }[]
}

const ERC_BLS = { label: 'European Resuscitation Council Guidelines 2021: Basic Life Support', url: 'https://doi.org/10.1016/j.resuscitation.2021.02.009' }
const AHA_2020 = { label: 'American Heart Association 2020 Guidelines: Adult Basic and Advanced Life Support', url: 'https://doi.org/10.1161/CIR.0000000000000916' }
const CPR_SPACE = { label: 'Hinkelbein et al., CPR during spaceflight: a guideline for CPR in microgravity, 2020', url: 'https://doi.org/10.1186/s13049-020-00793-y' }
const ERC_GUIDELINES = { label: 'European Resuscitation Council Guidelines 2021: First Aid', url: 'https://www.cprguidelines.eu/' }

export const GUIDES: Guide[] = [
  {
    id: 'cpr',
    title: 'A crewmate collapses',
    when: 'Someone does not respond and is not breathing normally.',
    emergency: true,
    cover: 'compress',
    steps: [
      { title: 'Check for a response', text: 'Hold both shoulders and speak loudly: “Can you hear me?”', scene: 'respond' },
      { title: 'Call the crew', text: 'Shout for help. Send someone for the medical lead, the medical kit, and the defibrillator.', scene: 'call' },
      { title: 'Check breathing', text: 'Tilt the head back and lift the chin. Look, listen, and feel for no more than 10 seconds. Gasping is not normal breathing.', scene: 'breathing', seconds: 10 },
      { title: 'Secure both of you', only: 'weightless', text: 'Strap the person flat to the medical restraint or a rigid surface, and anchor yourself so your push goes into the chest, not away from it. If no restraint is within reach, do not wait: wrap your legs around their body and start compressions from there.', scene: 'restrain' },
      { title: 'Lay them flat', only: 'gravity', text: 'Lay the person on their back on firm ground and kneel beside the chest.', scene: 'restrain' },
      { title: 'Push hard and fast', text: 'Heel of one hand on the centre of the chest, the other hand on top, arms straight. Push 5 to 6 cm deep, 100 to 120 times a minute, and let the chest come all the way back up.', scene: 'compress', pace: { perMinute: 110, count: 30 } },
      { title: 'Use the defibrillator', text: 'Switch it on as soon as it arrives and follow its voice. Stick the pads on the bare chest as shown. Nobody touches the person while it checks or shocks. Then push again at once.', scene: 'aed' },
      { title: 'Keep going', text: 'If you are trained, give 2 breaths after every 30 pushes; if not, keep pushing. Swap with a crewmate every 2 minutes. Stop only when the person breathes normally or the medical lead takes over.', scene: 'compress', pace: { perMinute: 110, count: 30 } },
    ],
    sources: [ERC_BLS, AHA_2020, CPR_SPACE],
  },
  {
    id: 'chest-pain',
    title: 'Chest pain',
    when: 'Someone is awake with pain or pressure in the chest.',
    emergency: true,
    cover: 'monitor',
    steps: [
      { title: 'Stop and rest', text: 'Stop all work. Strap in loosely in a relaxed, half-sitting position and loosen tight clothing.', gravityText: 'Stop all work. Sit down, leaning back with the knees bent, and loosen tight clothing.', scene: 'rest' },
      { title: 'Call the medical lead', text: 'Call the medical lead now. Do not wait to see whether it passes.', scene: 'call' },
      { title: 'Note the time and the signs', text: 'When did it start? Is it pressure or tightness, does it spread to an arm, the jaw, or the back, and is there shortness of breath, cold sweat, or nausea?', scene: 'clock' },
      { title: 'Watch the readings', text: 'Keep the smart shirt on and watch heart rate, blood pressure, and blood oxygen. Have the defibrillator and the medical kit brought. The medical lead decides about medicine.', scene: 'monitor' },
      { title: 'Stay with them', text: 'Do not leave the person alone. If they stop responding and do not breathe normally, start the collapse steps at once.', scene: 'respond', link: { label: 'Open “A crewmate collapses”', guide: 'cpr' } },
    ],
    sources: [{ label: 'American Heart Association, warning signs of a heart attack', url: 'https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack' }, ERC_GUIDELINES],
  },
  {
    id: 'choking',
    title: 'Choking',
    when: 'Someone cannot speak, cough, or breathe after food or an object went down the wrong way.',
    emergency: true,
    cover: 'backblows',
    steps: [
      { title: 'Ask and encourage', text: 'Ask: “Are you choking?” If they can still cough, tell them to keep coughing and stay with them.', scene: 'cough' },
      { title: 'Give 5 back blows', text: 'If the cough gets weak: hook a foot under a restraint and hold them across the chest with one arm, lean them forward, and strike firmly between the shoulder blades with the heel of your hand, up to 5 times.', gravityText: 'If the cough gets weak: stand to the side, support the chest with one hand, lean them forward, and strike firmly between the shoulder blades with the heel of your hand, up to 5 times.', scene: 'backblows' },
      { title: 'Give 5 abdominal thrusts', text: 'From behind, put a fist just above the navel, grasp it with the other hand, and pull sharply inwards and upwards, up to 5 times.', scene: 'thrusts' },
      { title: 'Alternate', text: 'Keep alternating 5 back blows and 5 thrusts until the object comes out. Call the medical lead.', scene: 'backblows' },
      { title: 'If they stop responding', text: 'Start the collapse steps at once.', scene: 'respond', link: { label: 'Open “A crewmate collapses”', guide: 'cpr' } },
    ],
    sources: [ERC_BLS],
  },
  {
    id: 'bleeding',
    title: 'Heavy bleeding',
    when: 'A wound keeps bleeding.',
    emergency: true,
    cover: 'press',
    steps: [
      { title: 'Cover the wound', text: 'Put on gloves. In weightlessness blood does not run off: it gathers on the wound and can float free, so cover it at once with gauze or a clean cloth.', gravityText: 'Put on gloves and cover the wound with gauze or a clean cloth.', scene: 'press' },
      { title: 'Press hard, directly on it', text: 'Press firmly on the wound with both hands. Hold the pressure for 10 minutes without lifting to look.', scene: 'press', seconds: 600 },
      { title: 'Bandage over it', text: 'If blood comes through, add more gauze on top; do not remove the first layer. Then wrap a firm bandage over it.', scene: 'bandage' },
      { title: 'Call the medical lead and watch', text: 'Call the medical lead. Watch for pale, cold skin, a fast pulse, or confusion, and keep the person still and warm.', scene: 'monitor' },
    ],
    sources: [ERC_GUIDELINES],
  },
  {
    id: 'fainting',
    title: 'Feeling faint after landing',
    when: 'Dizziness, tunnel vision, or sweating on standing up in gravity again.',
    emergency: false,
    needs: 'gravity',
    cover: 'legsup',
    steps: [
      { title: 'Get down at once', text: 'Sit or lie down at the first sign. Do not try to walk it off.', scene: 'rest' },
      { title: 'Lie flat, legs up', text: 'Lie on your back and raise your legs on a seat or a box until the feeling passes.', scene: 'legsup' },
      { title: 'Drink', text: 'Drink water in small sips once you feel clear.', scene: 'drink' },
      { title: 'Stand up in stages', text: 'Sit for one minute, then stand while holding on to something. Sit down again if the dizziness returns.', scene: 'stages', seconds: 60 },
      { title: 'Check before heavy work', text: 'When you are steady, do the standing blood pressure test with a crewmate beside you, and tell the medical lead.', scene: 'monitor' },
    ],
    sources: [{ label: 'NASA OCHMO Technical Brief 019: Orthostatic Intolerance', url: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf' }],
  },
]

export function hasGravity(place: Place): boolean {
  return place === 'surface' || place === 'landing'
}

/** The steps of a guide for where the crew is now, with the wording for that place. */
export function stepsFor(guide: Guide, place: Place): GuideStep[] {
  const gravity = hasGravity(place)
  return guide.steps
    .filter((s) => !s.only || (s.only === 'gravity') === gravity)
    .map((s) => (gravity && s.gravityText ? { ...s, text: s.gravityText } : s))
}

export function guideById(id: string | undefined): Guide | undefined {
  return GUIDES.find((g) => g.id === id)
}
