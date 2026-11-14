/**
 * DRAFT step text. It is placeholder content for the prototype and must be replaced
 * with a recognised first-aid protocol and a source before the demo (SPEC.md, SH9).
 */
export interface EmergencyStep {
  title: string
  detail: string
}

export const CHEST_PAIN_STEPS: EmergencyStep[] = [
  { title: 'Check for a response', detail: 'Tap the shoulder and speak loudly. Note whether the person answers.' },
  { title: 'Call the crew', detail: 'Say "medical emergency" on the crew channel and ask the medical lead to come.' },
  { title: 'Check breathing', detail: 'Watch the chest for 10 seconds. Normal breathing is regular and quiet.' },
  { title: 'If not breathing normally, start chest compressions', detail: 'Secure the person and yourself first. Send someone for the defibrillator and follow its spoken instructions.' },
  { title: 'If awake, keep the person at rest', detail: 'Stop all activity, loosen tight clothing, and note the time the pain started.' },
  { title: 'Take readings', detail: 'Heart rate, blood pressure, and blood oxygen. They appear in the panel on the right.' },
  { title: 'Report to the ground', detail: 'Send the summary now. A reply takes at least 40 minutes. Do not wait for it before acting.' },
]

export const OTHER_SCENARIOS = ['Severe bleeding', 'Choking', 'Burn', 'Head injury']
