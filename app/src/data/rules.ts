import type { Confidence } from '../lib/types'

/** Taken from docs/research/clinical-thresholds.md, rule table. */
export interface Rule {
  id: string
  indicator: string
  basis: string
  confidence: Confidence
  confidenceNote?: string
}

export const RULES: Rule[] = [
  { id: 'R1', indicator: 'Resting heart rate', basis: 'American Heart Association normal resting heart rate; NASA Human Research Program cardiovascular risk', confidence: 'MODERATE' },
  { id: 'R2', indicator: 'Blood pressure', basis: 'ACC/AHA 2017 guideline; Shibata et al., JACC 2023', confidence: 'MODERATE', confidenceNote: 'High on Earth, moderate in flight' },
  { id: 'R3', indicator: 'Standing blood pressure test', basis: 'NASA OCHMO-TB-019; standard orthostatic criteria', confidence: 'HIGH' },
  { id: 'R4', indicator: 'Body temperature', basis: 'Stahn et al., Scientific Reports 2017; NIOSH heat criteria', confidence: 'MODERATE', confidenceNote: 'Moderate for change from baseline, low for absolute values in flight' },
  { id: 'R5', indicator: 'Blood oxygen', basis: 'NASA-STD-3001 Volume 2 [V2 6003]; clinical hypoxemia standards', confidence: 'HIGH' },
  { id: 'R6', indicator: 'Sleep', basis: 'Barger et al., Lancet Neurology 2014; NASA-STD-3001 Volume 1 [V1 6001]', confidence: 'MODERATE', confidenceNote: 'High for how common short sleep is, moderate for the limits' },
  { id: 'R7', indicator: 'Mood', basis: 'NASA Human Research Program behavioural risk; NASA Behavioral Health and Performance', confidence: 'LOW', confidenceNote: 'A rough rule, not a diagnosis' },
  { id: 'R8', indicator: 'Radiation dose', basis: 'NASA-STD-3001 Volume 1 [V1 4030], [V1 4031]; Simonsen 2025', confidence: 'HIGH' },
  { id: 'R9', indicator: 'Bone load and exercise', basis: 'LeBlanc et al., JBMR 2007; NASA Bone Fracture Evidence Report 2024; Stavnichuk 2020', confidence: 'LOW', confidenceNote: 'Low for predicting one person’s bone loss' },
  { id: 'R10', indicator: 'Body weight and nutrition', basis: 'NASA Human Research Program nutrition risk; clinical standards', confidence: 'MODERATE' },
  { id: 'R11', indicator: 'Cabin air (carbon dioxide)', basis: 'NASA-STD-3001 Volume 2 [V2 6004]; NASA OCHMO-TB-004', confidence: 'HIGH', confidenceNote: 'High for the 3 mmHg standard, moderate for the upper limit' },
  { id: 'R12', indicator: 'Vision check', basis: 'Expert consensus on spaceflight eye changes 2026; Brunstetter et al., JAMA Ophthalmology 2024', confidence: 'MODERATE' },
]
