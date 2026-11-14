import { INDICATORS, INDICATOR_ORDER } from './indicators'
import { actionFor, actionSteps, attention, unavailableReason } from './judge'
import type { Action, AppState, Person, StatusKey } from './types'

/**
 * The procedures on board, for the Resources tab: what to do about each thing that is off right
 * now, and how to take every reading. They are built from the same rules and measuring steps the
 * rest of the app uses, so nothing is written twice.
 */

/** What the astronaut in the picture is doing. */
export type Scene =
  | 'float' | 'rest' | 'drink' | 'measure' | 'report' | 'exercise' | 'shelter' | 'sleep' | 'air' | 'look'
  | 'respond' | 'breathing' | 'restrain' | 'compress' | 'aed' | 'cough' | 'backblows' | 'thrusts' | 'press' | 'bandage' | 'legsup' | 'stages'

export const SCENE_LABEL: Record<Scene, string> = {
  float: 'An astronaut floating',
  rest: 'An astronaut resting',
  drink: 'An astronaut drinking',
  measure: 'An astronaut taking a reading',
  report: 'An astronaut calling on the radio',
  exercise: 'An astronaut exercising',
  shelter: 'An astronaut inside a radiation shelter',
  sleep: 'An astronaut sleeping',
  air: 'An astronaut checking the cabin air',
  look: 'An astronaut doing a vision check',
  respond: 'An astronaut shaking a crewmate by the shoulders and calling to them',
  breathing: 'An astronaut leaning over a crewmate to check their breathing',
  restrain: 'An astronaut strapped flat to the medical restraint',
  compress: 'An astronaut pushing on the chest of a crewmate who is lying flat',
  aed: 'A defibrillator with its pads on the chest of an astronaut lying flat',
  cough: 'An astronaut coughing',
  backblows: 'An astronaut striking a leaning crewmate between the shoulder blades',
  thrusts: 'An astronaut behind a crewmate, pulling in above the navel',
  press: 'An astronaut pressing hard on a crewmate’s wound',
  bandage: 'An astronaut wrapping a bandage over a crewmate’s wound',
  legsup: 'An astronaut lying flat with legs raised on a box',
  stages: 'An astronaut getting up in stages',
}

/** Picks the picture for a step from its wording. */
export function sceneFor(step: string): Scene {
  const s = step.toLowerCase()
  if (/shelter|shield/.test(s)) return 'shelter'
  if (/^(rest|sit|lie|stay|wait|float|stop|keep the arm|do not talk|hold still)/.test(s)) return 'rest'
  if (/report|tell |contact|the ground|medical lead|crewmate|\bcall\b/.test(s)) return 'report'
  if (/\bdrinks?\b|drink water|sips?\b|meals?\b|\beat|food|breakfast/.test(s)) return 'drink'
  if (/sleep|lights|\bbed\b|tracker/.test(s)) return 'sleep'
  if (/exercise|session|treadmill|squat|training|machine|\bcycle\b/.test(s)) return 'exercise'
  if (/cabin air|scrubber|ventilat|breath|carbon dioxide|oxygen partial/.test(s)) return 'air'
  if (/vision|\beyes?\b|reading card|smallest line/.test(s)) return 'look'
  if (/reading|measure|sensor|cuff|thermometer|\btest\b|strip|meter|monitor|\bcheck|enter |swing|tones/.test(s)) return 'measure'
  if (/rest|\bsit\b|lie down|still|wait/.test(s)) return 'rest'
  return 'float'
}

export interface Procedure {
  id: string
  title: string
  /** `now` answers something that is off today; `measure` is how to take a reading. */
  kind: 'now' | 'measure'
  intro?: string
  steps: string[]
  status?: StatusKey
  button?: { label: string; to: string }
  /** What a call with the doctor about this would be opened on. */
  about?: string
}

/** Procedures for what is off right now, most serious first. */
export function activeProcedures(state: AppState, person: Person): Procedure[] {
  return attention(state, person).map((item) => {
    const action = actionFor(state, person, item)
    const about = item.key ?? item.region
    return { id: `now-${about}`, title: item.label, kind: 'now', intro: action.observed, steps: actionSteps(action), status: item.status, button: action.button, about }
  })
}

/** How to take each reading that has more than one step to it. */
export function measureProcedures(state: AppState, person: Person): Procedure[] {
  return INDICATOR_ORDER.filter((k) => INDICATORS[k].steps.length > 1).map((k) => {
    const def = INDICATORS[k]
    const reason = unavailableReason(k, state.place)
    return {
      id: `measure-${k}`,
      title: def.name,
      kind: 'measure',
      intro: reason ? `Not available here. ${reason}` : def.auto ? `Arrives on its own from the ${def.source.toLowerCase()}.` : 'Entered by hand.',
      steps: def.steps,
      button: def.inputLabel && !reason ? { label: 'Enter a reading', to: `/body/${person.id}/measure/${k}` } : undefined,
    }
  })
}

export function allProcedures(state: AppState, person: Person): Procedure[] {
  return [...activeProcedures(state, person), ...measureProcedures(state, person)]
}

/** The Resources entry that holds the steps of a next-action card. */
export function procedureFor(state: AppState, person: Person, action: Action): Procedure | undefined {
  return activeProcedures(state, person).find((p) => p.intro === action.observed && p.steps.join(' ') === actionSteps(action).join(' '))
}
