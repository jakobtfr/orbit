# Resources (official challenge links)

Captured 2026-11-14 from the challenge Resources tab.

| Resource | URL |
| --- | --- |
| NASA HRP — 5 Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/ |
| NASA HRP — Risks of Human Spaceflight | https://www.nasa.gov/hrp/risks/ |
| NASA HRP — Ongoing HRP Research | https://www.nasa.gov/hrp/ongoing-hrp-research/ |
| CSA — Monitoring radiation for astronaut health (CANS) | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp |
| CSA — Why do we conduct science experiments in space? | https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp |

---

## 1. The five hazards — the "why" layer

HRP's framing: the hazards are not independent. They **feed off each other and exacerbate effects on the body**. That interaction is the argument for a single tool that looks at the whole astronaut instead of five disconnected monitors.

| Hazard | What it does to the crew | Product hook |
| --- | --- | --- |
| **Space radiation** | Invisible; one of the most hazardous aspects of flight. Raises cancer risk and compounds other damage. | Cumulative mission dose card with a budget, plus event markers (solar particle event) |
| **Isolation & confinement** | Behavioral responses in small groups over long periods; crews must be selected, trained, and supported. | Mood/conflict check-ins, crew-level attention view, private self-report |
| **Distance from Earth** | Supplies, instructions, and medical care get harder to receive; Mars is ~140M miles and a ~3-year mission. | Comms-delay clock, offline-first operation, handover packet for the next contact window |
| **Gravity fields** | Whole body adapts to new loads — muscles, bones, inner ear, organs — then re-adapts on return. | Baseline drift, bone/muscle and orthostatic indicators, exercise adherence |
| **Hostile / closed environments** | Temperature, pressure, lighting, noise, microbes, immune response. | Environmental context attached to readings (CO₂, noise, light, temperature) |

Key quote for the pitch: *"Planning and self-sufficiency will be key to successful deep space missions."*

## 2. The HRP risk list — our information architecture

This is the most useful page for us. Rather than inventing categories, we organize the whole app around HRP's own risk taxonomy.

### Physiology
| Risk | Product handle |
| --- | --- |
| Altered immune system responses | Temp, HR, symptom check-in, saliva sample reminders |
| Altered sensorimotor & vestibular function | Dizziness / balance self-report; post-landing mode |
| Cardiovascular adaptations | Resting HR, BP, orthostatic check, HR recovery |
| Decompression sickness | Pre/post-EVA check, symptom flowchart |
| Host-microorganism interactions | Skin/gut symptom log, habitat hygiene tasks |
| Hypoxia | SpO₂, EVA pre-breathe compliance |
| Inadequate food & nutrition | Weight, intake log, menu adherence |
| Injury / compromised performance from EVA | Suit-fit and fatigue readiness check before EVA |
| Reduced cardiorespiratory & musculoskeletal fitness | Exercise load, HR response, strength check-ins |
| Spaceflight associated neuro-ocular syndrome (SANS) | Vision self-test, head/eye symptom prompts, OCT reminders |
| Spaceflight-induced bone changes | Cumulative load, DXA-equivalent timeline, calcium/nutrition |

### Behavior & human factors
| Risk | Product handle |
| --- | --- |
| Behavioral changes & psychiatric disorders | Mood, sleep, isolation score; private journal; escalation path |
| Inadequate teamwork | Crew pulse, conflict flag, crew-level attention view |
| Inadequate sleep & irregular schedules | Sleep hours, sleep debt, light exposure (ARCHeR-style) |
| Inadequate systems operations support | Context-aware procedures and "what do I do now" guidance |
| Injury from dynamic loads | Landing/entry readiness and symptom check |

### Radiation
| Risk | Product handle |
| --- | --- |
| Radiation-induced cancers | Cumulative dose, dose-rate trend, event exposure attribution |

**Design consequence:** every indicator in the app must name the HRP risk it serves. If it doesn't, it doesn't ship.

## 3. Ongoing research — credibility anchors

- **ARCHeR (Artemis II)** — actigraphy measuring motion, sleep patterns, and light exposure. Justifies our sleep + light + activity model.
- **Tempus Pro** — commercial telemedicine device collecting and integrating health data for remote, near-real-time diagnosis. Precedent for a single integrated health record in flight.
- **CIPHER** — suite of studies across multiple body systems. Justifies a multi-system, whole-crew view.
- **Standard Measures / Artemis II Standard Measures** — consistent physiological and psychological measurements. Justifies standardized, comparable check-ins.
- **Immune Biomarkers** — blood and saliva analysis on Artemis II. Justifies immune-related indicators.
- **Venous Haemostasis** — blood flow and coagulation changes. Justifies BP/vascular focus.
- **Brain Fluid Pressure / Spinal Fluid Biomarkers / Thigh Cuff** — SANS research. Justifies neuro-ocular prompts.
- **B-Complex** — nutrition countermeasure for brain and eye changes.
- **Zero T2** — exercise without a treadmill. Justifies exercise-adherence tracking as a first-class feature.

## 4. CSA material — the two arguments we were missing

**Radiation is measurable and monitorable in flight.** CANS is autonomous and continuous; neutrons are ~30% of ISS dose. Gives us a defensible radiation card instead of a vague warning. Also note the Earth spin-offs: cancer therapy, aircrew protection, public safety.

**Dual-use impact.** CSA states spaceflight effects resemble **accelerated aging** and problems from a **sedentary lifestyle**, and that space research informs osteoporosis, balance disorders, cardiovascular disease, and Type-2 diabetes. That is our "who else benefits" answer, backed by a space agency rather than our own claim.

**Deep-space risk list from CSA:** more time in weightlessness, more radiation exposure, longer isolation, increased communication delays, and less ability to rely on Earth for food, materials, and emergency medical assistance. That list is effectively the product requirements document.

---

## What this changes about the design

1. **Organize by risk, not by metric.** A "Risk Radar" of HRP risks is more defensible and more novel than another vitals dashboard.
2. **Show unmonitored risks honestly.** Marking a risk "not instrumented on this mission" reads as competence, not as a gap.
3. **Make distance from Earth visible in the UI.** A live light-time delay is the single cheapest way to make the concept legible to judges.
4. **Attach context to every reading.** Sleep, light, CO₂, exercise, EVA — HRP's hazards interact, so the app should too.
5. **Cite on every card.** Each risk screen carries its HRP link and one sentence on what changes in microgravity.
