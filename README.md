# ORBIT

**The onboard health watch for crews beyond Earth's reach.**

NASA Space Apps Challenge 2026 · Challenge: **Create Health Monitoring Software for Astronauts on Space Missions**

---

## The idea

On the ISS, a flight surgeon on console is never more than a voice call away. On a Mars transit, the round-trip delay is up to 44 minutes, and the person running medical care onboard is often an astronaut with about 40 hours of medical training.

ORBIT is the crew-side layer NASA's own exploration roadmap calls for: a **risk-first health monitor** that helps astronauts capture their own indicators, understand what changed, act on it, and hand a clean summary to the flight surgeon at the next contact window.

**Sense → Interpret → Act → Handover.** Offline-first, explainable, and built around NASA HRP's own risk taxonomy.

## Why it wins

| Pillar | ORBIT's answer |
| --- | --- |
| **Impact** | Crews on long-duration missions, plus the flight surgeons who receive better handovers. Dual-use on Earth: spaceflight physiology resembles accelerated aging and a sedentary lifestyle |
| **Creativity** | Organized by HRP risk, not by metric. Detects cross-risk clusters. Turns a 20-minute comm delay into a product feature |
| **Relevance** | Directly implements gather → evaluate → act, with a private behavioral channel and a handover packet |
| **Validity** | Every rule has a published source and a confidence label. Spaceflight-adjusted baselines, not terrestrial cutoffs |
| **Presentation** | A scripted Mars-transit anomaly that judges can watch resolve in under two minutes |

## The screens

- **Crew Board** — four astronauts, check-in status, next contact window, live light-time delay
- **Check-in** — 60 seconds: HR, BP, temperature, SpO₂, sleep, mood, symptoms
- **Risk Radar** — the 17 HRP risks, green / amber / red / not instrumented
- **Risk detail** — trend, personal baseline, evidence drawer, "what changes in space"
- **Action card** — next best action, re-measure timer, notify CMO, escalate
- **Handover** — auto-generated SBAR packet queued for the next comm window

## Research

- [`docs/challenge-brief.md`](docs/challenge-brief.md) — the official challenge, captured
- [`docs/resources.md`](docs/resources.md) — official HRP/CSA links, distilled into product implications
- [`docs/operations.md`](docs/operations.md) — **what NASA actually does today**: roles, cadence, countermeasures, medical event rates, and the EIMO/CDSS gap
- [`docs/clinical-thresholds.md`](docs/clinical-thresholds.md) — **rule values with sources**: 12 rules, 4 cluster rules, confidence labels
- [`docs/ideas.md`](docs/ideas.md) — concept notes and decision log

## Three findings that shaped the design

1. **"Space fever" is real.** Resting core temperature rises ~1.0 °C in long-duration flight. A standard fever rule would flag every astronaut, so ORBIT compares against personal baselines.
2. **In-flight blood pressure runs low.** Systolic BP averaged 111 mmHg in flight vs. 122 preflight in one cohort, while ~30% develop orthostatic intolerance after return. Absolute hypertension cutoffs are the wrong tool.
3. **NASA is already building this.** The Exploration Medical Capability element is developing Earth-Independent Medical Operations and a clinical decision support system. ORBIT is a crew-side prototype of that layer, not a speculative gadget.

## Challenge source

- Official page: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
- Intro video: https://www.youtube.com/watch?v=RERG3gEmdC8
- Skills: Human Exploration · Software · Space Exploration

## Status

🌱 Research complete. Concept locked. Build starting.

## Team

- [@jakobtfr](https://github.com/jakobtfr)