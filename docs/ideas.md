# Concept Notes

Working scratchpad — update as decisions are made.

## Direction: risk-first, autonomy-first

Other teams will build a vitals dashboard and bolt on a body map (the brief suggests it). We organize around **NASA HRP's own risk taxonomy** and around the **distance-from-Earth** hazard. That gives us:

- **Validity** — every screen traces to a published HRP risk.
- **Creativity** — a "Risk Radar" instead of a metric grid; an autonomy story instead of a monitoring story.
- **Relevance** — gather → evaluate → act, exactly as the brief asks.
- **Impact** — dual-use case backed by CSA (accelerated aging, sedentary lifestyle, osteoporosis, cardiovascular, Type-2 diabetes).
- **Presentation** — comms delay + handover packet are visible, memorable demo beats.

## Proposed product

**Name (shortlist):**
1. **VIGIL** — the onboard health watch. *Recommended.*
2. **AEGIS** — astronaut health shield.
3. **HALO** — health autonomy for long-duration operations.

**One-liner:** *VIGIL turns a crew's own health data into a daily decision — and a clean handover for the next time Earth picks up the phone.*

**Core loop:** Sense → Interpret → Act → Handover.

| Screen | Job |
| --- | --- |
| **Crew Board** | 4 crew, status rings, who is due a check-in, next contact window, light-time delay clock |
| **Check-in** | 60-second guided capture: HR, BP, temp, SpO₂, sleep, mood, symptoms, exposure events |
| **Risk Radar** | The 13 HRP risks as a grid/target, each green/amber/red or "not instrumented" |
| **Risk detail** | Trend, personal baseline, evidence drawer with HRP citation, "what changes in space" |
| **Action card** | Next best action, countermeasure, re-measure timer, notify CMO, prepare for surgeon call |
| **Handover** | Auto-generated SBAR packet queued for the next comm window |

## Indicator → risk mapping (MVP set)

| Indicator | HRP risk served | Example rule |
| --- | --- | --- |
| Resting HR + HR recovery | Cardiovascular adaptations / reduced fitness | +15% over 7-day baseline → amber → re-measure, fluids, log exercise |
| Blood pressure | Cardiovascular adaptations | SBP > 140 or < 90 → amber/red → repeat after 5 min, escalate if symptomatic |
| Temperature | Altered immune responses | > 38.0 °C → amber; > 39.0 °C or with HR spike → red |
| SpO₂ | Hypoxia | < 92% → red → rest, O₂, abort EVA prep |
| Sleep hours + sleep debt | Inadequate sleep & irregular schedules | < 6 h for 3 nights → amber → light protocol, schedule adjustment |
| Mood + isolation score | Behavioral changes & psychiatric disorders | mood ≤ 2 for 2 days with sleep debt → amber → crewmate check-in, private channel |
| Cumulative radiation dose | Radiation-induced cancers | > mission budget → amber → shielding plan, storm protocol |
| Weight / intake | Inadequate food & nutrition | > 5% loss in 30 days → amber → dietitian tag in handover |

Stretch: EVA readiness check, SANS vision self-test, orthostatic stand test.

## Deliberate non-goals

- No AI diagnosis. Rules decide; language models may only rewrite explanations, never triage.
- No 20-metric wall. Six indicators done well beats fifteen done badly.
- No fake clinical validation. Label the prototype honestly and cite sources.

## Open questions

- [ ] Name: VIGIL / AEGIS / HALO / something else
- [ ] Demo scope: single astronaut deep-dive vs. full crew board
- [ ] Stack confirmation: Next.js + TS + Tailwind + Recharts, local-first
- [ ] Repo visibility for submission

## Decision log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-11-14 | Repo created | — |
| 2026-11-14 | Organize by HRP risk taxonomy, not by metric | Defensible validity, distinct from a generic dashboard |
| 2026-11-14 | Lead with distance-from-Earth / comms delay | Strongest narrative + clearest differentiator |
| 2026-11-14 | Deterministic rules engine, no AI triage | Validity with NASA judges; demo reliability |