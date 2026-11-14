/**
 * Emergency flow for chest pain or collapse (SH9: recognised first aid only, each step sourced).
 * Basic life support follows the ERC 2021 and AHA 2020 adult guidelines; the changes for
 * weightlessness follow the DGLRM/ESAM-SMG guideline for CPR in microgravity.
 * Not reviewed by a clinician.
 */

export interface Source {
  id: string
  label: string
  url: string
}

export const SOURCES: Record<string, Source> = {
  erc: {
    id: 'erc',
    label: 'Olasveengen et al., European Resuscitation Council Guidelines 2021: Basic Life Support. Resuscitation 161:98–114',
    url: 'https://doi.org/10.1016/j.resuscitation.2021.02.009',
  },
  aha: {
    id: 'aha',
    label: 'Panchal et al., 2020 AHA Guidelines: Adult Basic and Advanced Life Support. Circulation 142:S366–S468',
    url: 'https://doi.org/10.1161/CIR.0000000000000916',
  },
  space: {
    id: 'space',
    label: 'Hinkelbein et al., CPR during spaceflight: a guideline for CPR in microgravity (DGLRM, ESAM-SMG). Scand J Trauma Resusc Emerg Med 28:108, 2020',
    url: 'https://doi.org/10.1186/s13049-020-00793-y',
  },
  heart: {
    id: 'heart',
    label: 'American Heart Association, Warning signs of a heart attack',
    url: 'https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack',
  },
}

export interface EmergencyStep {
  title: string
  detail: string
  sources: (keyof typeof SOURCES)[]
}

/** First steps, the same for everyone. They end with the question: breathing normally? */
export const FIRST_STEPS: EmergencyStep[] = [
  { title: 'Check for a response', detail: 'Tap the shoulder and speak loudly. Note whether the person answers.', sources: ['erc', 'aha'] },
  { title: 'Call for help', detail: 'Say "medical emergency" on the crew channel. Send a crewmate for the defibrillator and the medical lead.', sources: ['erc', 'aha'] },
]

export const BREATHING_QUESTION = {
  title: 'Is the person breathing normally?',
  detail: 'Open the airway by tilting the head back and lifting the chin. Look, listen, and feel for no more than 10 seconds. Occasional gasps are not normal breathing.',
  sources: ['erc', 'aha'] as (keyof typeof SOURCES)[],
}

/** Not breathing normally: cardiac arrest until proven otherwise. */
export const CPR_STEPS: EmergencyStep[] = [
  {
    title: 'Start chest compressions now',
    detail: 'Alone: hold yourself to the patient with your legs over their shoulders and your ankles crossed behind their back (Evetts–Russomano position). Push hard and fast in the centre of the chest: 5 to 6 cm deep, 100 to 120 a minute.',
    sources: ['space', 'erc'],
  },
  {
    title: 'Attach the defibrillator as soon as it arrives',
    detail: 'Switch it on and follow its spoken instructions. Keep compressing while the pads go on. Nobody touches the patient during a shock.',
    sources: ['erc', 'aha'],
  },
  {
    title: 'Move the patient to the medical restraint',
    detail: 'With a second crewmate, strap the patient to the medical restraint. Continue compressions from a handstand, feet braced against the opposite wall. Swap the person compressing every 2 minutes.',
    sources: ['space'],
  },
  {
    title: 'Report to the ground, then keep going',
    detail: 'A crewmate who is not compressing sends the summary. A reply takes at least 40 minutes: do not wait for it. Continue until the person breathes normally or the medical lead takes over.',
    sources: ['erc'],
  },
]

/** Breathing normally, often awake with chest pain. */
export const CHEST_PAIN_STEPS: EmergencyStep[] = [
  { title: 'Keep the person at rest', detail: 'Stop all activity and stay with them. Loosen tight clothing. Note the time the pain started.', sources: ['heart'] },
  { title: 'Take readings', detail: 'Heart rate, blood pressure, and blood oxygen. They appear in the panel beside the steps.', sources: ['heart'] },
  { title: 'Report to the ground', detail: 'Send the summary and the readings now. A reply takes at least 40 minutes. If breathing stops or becomes abnormal, start CPR at once.', sources: ['erc'] },
]

export const OTHER_SCENARIOS = ['Severe bleeding', 'Choking', 'Burn', 'Head injury']
