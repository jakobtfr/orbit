import { judge, regionStatus, worst } from './judge'
import type { AppState, IndicatorKey, Person, RegionKey, StatusKey } from './types'

/**
 * Muscle groups on the body map. Nothing is measured per muscle, so each group points at what
 * ORBIT does watch for it: the health region it sits in and the indicators that protect it.
 * `unloading` and `inFlight` are general findings from spaceflight research, not personal data.
 */
export interface MuscleGroup {
  name: string
  anatomy: string
  side: 'front' | 'back' | 'both'
  intro: string
  region: RegionKey
  watch: IndicatorKey[]
  unloading: 'high' | 'moderate' | 'low'
  inFlight: string
  trainedBy: string[]
}

export const UNLOADING: Record<MuscleGroup['unloading'], string> = { high: 'Loses most without gravity', moderate: 'Loses some without gravity', low: 'Holds up well without gravity' }

const GROUPS = {
  chest: { name: 'Chest', anatomy: 'Pectoralis major', side: 'front', intro: 'The pectoral muscles move the upper arm across the torso and support pushing movements.', region: 'chest', watch: [], unloading: 'low', inFlight: 'The arms and chest do most of the moving around in weightlessness, so these muscles hold up better than the legs.', trainedBy: ['Bench press on the resistance device', 'Rows'] },
  shoulders: { name: 'Shoulders', anatomy: 'Deltoids', side: 'both', intro: 'The deltoids lift and rotate the upper arm.', region: 'whole', watch: ['exercise'], unloading: 'low', inFlight: 'The shoulders work constantly when you pull yourself through the cabin, so they are less affected than the legs.', trainedBy: ['Shoulder press on the resistance device', 'Upright rows'] },
  biceps: { name: 'Biceps', anatomy: 'Biceps brachii', side: 'front', intro: 'The biceps bend the elbow and rotate the forearm.', region: 'whole', watch: ['exercise'], unloading: 'low', inFlight: 'The arms replace the legs for getting around in weightlessness, so they keep most of their strength.', trainedBy: ['Curls on the resistance device', 'Rows'] },
  triceps: { name: 'Triceps', anatomy: 'Triceps brachii', side: 'both', intro: 'The triceps straighten the elbow.', region: 'whole', watch: ['exercise'], unloading: 'low', inFlight: 'The arms replace the legs for getting around in weightlessness, so they keep most of their strength.', trainedBy: ['Bench press on the resistance device', 'Shoulder press'] },
  forearms: { name: 'Forearms', anatomy: 'Wrist flexors & extensors', side: 'both', intro: 'The forearm muscles control the wrist, fingers, and grip.', region: 'whole', watch: ['exercise'], unloading: 'low', inFlight: 'Grip is used all day for handholds and tools. Tired, sore forearms and hands are common, above all after work in a pressure suit.', trainedBy: ['Deadlifts and rows on the resistance device', 'Everyday handhold work'] },
  abdominals: { name: 'Abdominals', anatomy: 'Rectus abdominis', side: 'front', intro: 'The abdominal muscles flex the trunk and help stabilize the spine.', region: 'hips', watch: ['exercise', 'bone'], unloading: 'moderate', inFlight: 'The trunk muscles no longer have to hold you upright, so they weaken unless they are trained on purpose.', trainedBy: ['Squats and deadlifts on the resistance device', 'Core exercises'] },
  obliques: { name: 'Obliques', anatomy: 'Lateral abdominal wall', side: 'front', intro: 'The obliques rotate and stabilize the trunk.', region: 'hips', watch: ['exercise', 'bone'], unloading: 'moderate', inFlight: 'The trunk muscles no longer have to hold you upright, so they weaken unless they are trained on purpose.', trainedBy: ['Squats and deadlifts on the resistance device', 'Core exercises'] },
  quadriceps: { name: 'Quadriceps', anatomy: 'Anterior thigh', side: 'front', intro: 'The quadriceps straighten the knee and contribute to lower-body exercise.', region: 'hips', watch: ['exercise', 'bone'], unloading: 'high', inFlight: 'The thighs carry your weight on Earth, so they are among the first muscles to lose size and strength without it.', trainedBy: ['Squats on the resistance device', 'Cycle', 'Treadmill with harness'] },
  adductors: { name: 'Adductors', anatomy: 'Medial thigh', side: 'both', intro: 'The adductors bring the thigh toward the midline and help stabilize the hip.', region: 'hips', watch: ['exercise', 'bone'], unloading: 'moderate', inFlight: 'The inner thigh steadies the hip under load. Without load it weakens along with the rest of the leg.', trainedBy: ['Squats on the resistance device', 'Treadmill with harness'] },
  calves: { name: 'Calves', anatomy: 'Gastrocnemius & soleus', side: 'both', intro: 'The calf muscles plantarflex the ankle. Loading changes substantially in weightlessness.', region: 'whole', watch: ['exercise', 'bone'], unloading: 'high', inFlight: 'The calves hold you upright all day on Earth, so they lose size and strength fastest of all when that load is gone.', trainedBy: ['Heel raises on the resistance device', 'Treadmill with harness'] },
  shins: { name: 'Shins', anatomy: 'Tibialis anterior', side: 'front', intro: 'The anterior lower-leg muscles lift the foot toward the shin.', region: 'whole', watch: ['exercise'], unloading: 'moderate', inFlight: 'The shin muscles lift the foot when you walk. With no walking they are used far less.', trainedBy: ['Treadmill with harness', 'Cycle'] },
  traps: { name: 'Trapezius', anatomy: 'Neck & upper back', side: 'both', intro: 'The trapezius supports movement and stabilization of the shoulder blades and neck.', region: 'chest', watch: ["exercise"], unloading: 'low', inFlight: "The neck and upper back stay busy in weightlessness. Neck stiffness is a common complaint, partly from the body's relaxed, forward posture.", trainedBy: ["Rows and shrugs on the resistance device"] },
  upperBack: { name: 'Upper back', anatomy: 'Posterior torso', side: 'back', intro: 'The posterior torso muscles support pulling movements and shoulder-blade control.', region: 'chest', watch: ['exercise'], unloading: 'low', inFlight: 'The upper back works whenever you pull yourself along, so it holds up better than the lower back and legs.', trainedBy: ['Rows on the resistance device', 'Deadlifts'] },
  lowerBack: { name: 'Lower back', anatomy: 'Lumbar extensors', side: 'back', intro: 'The lumbar extensors support the spine and help extend the trunk.', region: 'hips', watch: ['exercise', 'bone'], unloading: 'high', inFlight: 'Without gravity the spine lengthens and the deep back muscles shrink. Back pain is common in the first weeks, and the back needs care on return to gravity.', trainedBy: ['Deadlifts on the resistance device', 'Rows', 'Squats'] },
  glutes: { name: 'Glutes', anatomy: 'Gluteal muscles', side: 'back', intro: 'The gluteal muscles extend and stabilize the hip.', region: 'hips', watch: ['exercise', 'bone'], unloading: 'high', inFlight: 'The hips lose bone faster than any other part of the skeleton, and the muscles that load them weaken with them.', trainedBy: ['Squats and deadlifts on the resistance device', 'Treadmill with harness'] },
  hamstrings: { name: 'Hamstrings', anatomy: 'Posterior thigh', side: 'back', intro: 'The hamstrings bend the knee and extend the hip.', region: 'hips', watch: ['exercise', 'bone'], unloading: 'moderate', inFlight: 'The back of the thigh loses strength without load, though usually less than the front of the thigh and the calf.', trainedBy: ['Deadlifts on the resistance device', 'Cycle'] },
} satisfies Record<string, MuscleGroup>
export type MuscleKey = keyof typeof GROUPS
export const MUSCLE_GROUPS: Record<MuscleKey, MuscleGroup> = GROUPS
export function muscleFor(slug: string): MuscleKey | undefined {
  if (slug.startsWith('chest')) return 'chest'
  if (slug.startsWith('deltoids')) return 'shoulders'
  if (slug.startsWith('biceps')) return 'biceps'
  if (slug.startsWith('triceps')) return 'triceps'
  if (/^(forearm|hands)/.test(slug)) return 'forearms'
  if (slug.startsWith('abs')) return 'abdominals'
  if (slug.startsWith('obliques')) return 'obliques'
  if (/^(quadriceps|knees)/.test(slug)) return 'quadriceps'
  if (slug.startsWith('adductors')) return 'adductors'
  if (/^(calves|ankles|feet)/.test(slug)) return 'calves'
  if (slug.startsWith('tibialis')) return 'shins'
  if (/^(neck|trapezius)/.test(slug)) return 'traps'
  if (slug.startsWith('upper-back')) return 'upperBack'
  if (slug.startsWith('lower-back')) return 'lowerBack'
  if (/^(hips|gluteal)/.test(slug)) return 'glutes'
  if (slug.startsWith('hamstring')) return 'hamstrings'
}

/** The health region a part of the body map belongs to. */
export function regionForPart(slug: string): RegionKey {
  const key = muscleFor(slug)
  return key ? MUSCLE_GROUPS[key].region : 'head'
}

/** The status shown on a muscle group: the worst of its health region and the indicators watched for it. */
export function muscleStatus(state: AppState, person: Person, key: MuscleKey): StatusKey {
  const g = MUSCLE_GROUPS[key]
  return worst([regionStatus(state, person, g.region), ...g.watch.map((k) => judge(state, person, k).status)])
}
