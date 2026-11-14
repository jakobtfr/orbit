export const MUSCLE_GROUPS = {
  chest: { name: 'Chest', anatomy: 'Pectoralis major', side: 'front', intro: 'The pectoral muscles move the upper arm across the torso and support pushing movements.' },
  shoulders: { name: 'Shoulders', anatomy: 'Deltoids', side: 'both', intro: 'The deltoids lift and rotate the upper arm.' },
  biceps: { name: 'Biceps', anatomy: 'Biceps brachii', side: 'front', intro: 'The biceps bend the elbow and rotate the forearm.' },
  triceps: { name: 'Triceps', anatomy: 'Triceps brachii', side: 'both', intro: 'The triceps straighten the elbow.' },
  forearms: { name: 'Forearms', anatomy: 'Wrist flexors & extensors', side: 'both', intro: 'The forearm muscles control the wrist, fingers, and grip.' },
  abdominals: { name: 'Abdominals', anatomy: 'Rectus abdominis', side: 'front', intro: 'The abdominal muscles flex the trunk and help stabilize the spine.' },
  obliques: { name: 'Obliques', anatomy: 'Lateral abdominal wall', side: 'front', intro: 'The obliques rotate and stabilize the trunk.' },
  quadriceps: { name: 'Quadriceps', anatomy: 'Anterior thigh', side: 'front', intro: 'The quadriceps straighten the knee and contribute to lower-body exercise.' },
  adductors: { name: 'Adductors', anatomy: 'Medial thigh', side: 'both', intro: 'The adductors bring the thigh toward the midline and help stabilize the hip.' },
  calves: { name: 'Calves', anatomy: 'Gastrocnemius & soleus', side: 'both', intro: 'The calf muscles plantarflex the ankle. Loading changes substantially in weightlessness.' },
  shins: { name: 'Shins', anatomy: 'Tibialis anterior', side: 'front', intro: 'The anterior lower-leg muscles lift the foot toward the shin.' },
  traps: { name: 'Trapezius', anatomy: 'Neck & upper back', side: 'both', intro: 'The trapezius supports movement and stabilization of the shoulder blades and neck.' },
  upperBack: { name: 'Upper back', anatomy: 'Posterior torso', side: 'back', intro: 'The posterior torso muscles support pulling movements and shoulder-blade control.' },
  lowerBack: { name: 'Lower back', anatomy: 'Lumbar extensors', side: 'back', intro: 'The lumbar extensors support the spine and help extend the trunk.' },
  glutes: { name: 'Glutes', anatomy: 'Gluteal muscles', side: 'back', intro: 'The gluteal muscles extend and stabilize the hip.' },
  hamstrings: { name: 'Hamstrings', anatomy: 'Posterior thigh', side: 'back', intro: 'The hamstrings bend the knee and extend the hip.' },
} as const
export type MuscleKey = keyof typeof MUSCLE_GROUPS
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
