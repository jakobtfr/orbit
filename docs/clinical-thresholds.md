# Clinical Thresholds and Reference Values

Published clinical reference values relevant to spaceflight. **Not medical advice, not operational guidance, not a validated medical device.** Each row lists its source and a confidence label.

## Spaceflight baseline shifts

Spaceflight moves the baseline out from under terrestrial reference ranges. Two published findings:

1. **"Space fever" is real.** Resting core body temperature rises about **1.01 °C** during a long-duration ISS mission, plateauing around flight day 75. Maximal temperature during exercise rises **1.39 °C** and can exceed **40 °C** in some crew. A terrestrial "fever ≥ 38.0 °C" cutoff would flag almost every astronaut.
2. **In-flight blood pressure runs low.** In one JACC cohort, brachial systolic BP fell from **122 ± 8** preflight to **111 ± 14 mmHg** in flight. Meanwhile roughly **30%** of astronauts experience orthostatic intolerance after return. Terrestrial hypertension cutoffs overcall; low BP and orthostatic collapse are the larger operational risks.

## Rule table

Green/amber/red bands are derived for prototyping. The Evidence column gives the published basis; Confidence states how strong that basis is.

| ID | Indicator | Green | Amber | Red | Spaceflight adjustment | Evidence | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **R1** | Resting heart rate | 50–100 bpm and within 15% of 7-day baseline | >100 bpm on two readings ≥10 min apart, or ≥20% above baseline for 2 days | >120 bpm with chest pain, dyspnea, or syncope; <40 bpm with symptoms | Use delta from personal baseline; deconditioning lowers stroke volume, so a small HR rise can be meaningful | AHA normal resting HR; HRP cardiovascular risk | Moderate |
| **R2** | Blood pressure | <120/80 mmHg and within personal range | 130–139 systolic or 80–89 diastolic, confirmed on repeat | ≥140/90 confirmed after 5 min rest; systolic <80; syncope | In-flight BP is lower on average, so a rise from personal baseline matters more than a population cutoff. Confirm cuff size and arm position | ACC/AHA 2017; Shibata et al., JACC 2023 | High (terrestrial), moderate (flight) |
| **R3** | Orthostatic check | Systolic drop <20 and diastolic drop <10 mmHg at 3 min standing, no symptoms | Systolic drop ≥20 or diastolic drop ≥10, or presyncope | Syncope, or systolic <80 mmHg | Only valid in gravity — this is a **landing-mode** test, not an in-flight daily check. ~30% incidence after return | OCHMO-TB-019; standard orthostatic criteria | High |
| **R4** | Core temperature | Within 0.4 °C of personal time-of-day baseline | ≥0.5 °C above baseline on 2 consecutive days, or ≥38.5 °C | ≥39.5 °C, or ≥40 °C with confusion, syncope, or tachycardia | Do **not** use 38.0 °C as a universal fever cutoff; resting CBT is elevated ~1 °C in flight. Compare same-time-of-day readings | Stahn et al., Sci Rep 2017; NIOSH heat criteria | Moderate (relative), low (absolute in flight) |
| **R5** | SpO₂ | ≥95% | 90–94% confirmed on repeat, warm hands | <90%, or <92% with dyspnea or confusion | Include cabin PIO₂ context; suit and EVA states change the expected range | NASA-STD-3001 V2 [V2 6003]; clinical hypoxemia standards | High |
| **R6** | Sleep | 7–9 h, midpoint within ±1 h | 3 consecutive nights <6 h, 7-day sleep debt ≥7 h, or midpoint shift >2 h | <4 h for 2 consecutive nights, or any cognitive/operational symptoms | NASA schedules 8.5 h; actual ISS average is 6.09 h and 44% of nights are <6 h. "Normal" in space is already deficient | Barger et al., Lancet Neurol 2014; NASA-STD-3001 V1 [V1 6001] | High (prevalence), moderate (thresholds) |
| **R7** | Mood / behavioral | Stable, engaged, within personal range | Mood ≤2/5 for 2 days, drop ≥2 points from baseline, or withdrawal/conflict flag | Hopelessness, self-harm ideation, inability to perform duties → immediate private conference | Non-diagnostic. Private by default. Never surface to the whole crew | HRP behavioral risk; NASA BHP | Low–moderate; explicitly heuristic |
| **R8** | Radiation | Cumulative <80% of remaining career budget; daily rate as expected | ≥80% of remaining career budget, or a solar particle event adding ≥10 mSv | ≥100% of career budget (600 mSv), or SPE approaching the 250 mSv design limit | ISS accumulates ~0.2–0.5 mSv/day, 40–90 mSv per 6-month mission; deep-space GCR is far higher | NASA-STD-3001 V1 [V1 4030], [V1 4031]; Simonsen 2025 | High |
| **R9** | Bone load (modeled) | Exercise adherence ≥80%, mission <90 days | Adherence <80% for 14 days, or >90 days since last DXA | Not measurable in flight — escalate to ground | Historical loss 1–1.5%/month at hip and spine; current exercise countermeasures average 0.3–0.8%/month with wide individual variation. Label as **modeled, not measured** | LeBlanc et al., JBMR 2007; HRP Bone Fracture Evidence Report 2024; Stavnichuk 2020 | Low for individual prediction |
| **R10** | Nutrition / weight | Within 2% of 30-day baseline | >3% loss, or intake <80% of requirement for 7 days | >5% loss | Early fluid shifts confound scale weight; use a rolling trend, not a single weigh-in | HRP nutrition risk; clinical standards | Moderate |
| **R11** | CO₂ / environment | ≤3 mmHg 1-hour average | >3 mmHg | >5 mmHg sustained, or headache/fatigue/cognitive symptoms | NASA-STD-3001 sets 3 mmHg 1-hour average; ISS has stayed at or below 3 since the 2016 flight rule | NASA-STD-3001 V2 [V2 6004]; OCHMO-TB-004 | High (standard), moderate (red heuristic) |
| **R12** | Vision / SANS screen | No change | New blurred vision, visual field change, or subjective visual change | Sudden vision loss or severe headache | At least one ocular finding in ~81% of NASA astronauts; clinically concerning SANS in 15–20%. Prevalence rises with mission duration | SANS expert consensus 2026; Brunstetter et al., JAMA Ophthalmol 2024 | Moderate |

## Source list

- NASA-STD-3001 Volume 1, Rev C — crew health, radiation limits — https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf
- NASA-STD-3001 Volume 2, Rev F — CO₂, PIO₂, environment — https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_2
- OCHMO-TB-019, Orthostatic Intolerance — https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf
- OCHMO-TB-004, Carbon Dioxide — https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf
- Stahn et al., "Increased core body temperature in astronauts during long-duration space missions," Scientific Reports 7:16180 (2017) — https://www.nature.com/articles/s41598-017-15560-w
- Barger et al., Lancet Neurology (2014) — https://www.thelancet.com/journals/laneur/article/PIIS1474-4422(14)70122-X/abstract
- Shibata et al., "Cardiac Effects of Long-Duration Space Flight," JACC (2023) — https://www.jacc.org/doi/10.1016/j.jacc.2023.05.058
- Crucian et al., Int J Gen Med (2016) — https://pmc.ncbi.nlm.nih.gov/articles/PMC5098747/
- LeBlanc et al., "Cortical and Trabecular Bone Mineral Loss From the Spine and Hip in Long-Duration Spaceflight," JBMR (2007) — https://doi.org/10.1359/JBMR.040307
- NASA HRP Bone Fracture Evidence Report (2024) — https://humanresearchroadmap.nasa.gov/evidence/reports/Bone%20Fracture%20Evidence%20Report_07-18-2024.pdf
- Stavnichuk et al., "A systematic review and meta-analysis of bone loss in space travelers," npj Microgravity (2020) — https://pmc.ncbi.nlm.nih.gov/articles/PMC7200725
- Simonsen, "Radiation protection for space exploration" (2025) — https://ntrs.nasa.gov/citations/20250006168
- SANS expert consensus (2026) — https://www.nature.com/articles/s41433-026-04651-6
- Brunstetter et al., JAMA Ophthalmology (2024) — https://jamanetwork.com/journals/jamaophthalmology/fullarticle/2821259
- ACC/AHA 2017 hypertension guideline — https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065
- NASA-STD-3001 §6.0 Medical Operations (sleep opportunity) — https://www.nasa.gov/reference/6-0-medical-operations/