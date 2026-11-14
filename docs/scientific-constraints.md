# Scientific Constraints for Spaceflight Use

Written 2026-11-14. A checklist of what the health logic must respect to be scientifically valid in flight, not only on Earth.

Every constraint is built from the evidence already in this repo. File names point to the source. Anything marked *verify* is not confirmed and is listed under [Verify before relying on it](#verify-before-relying-on-it).

- **Hard (SH):** breaking one makes the health output scientifically wrong or misleading in flight.
- **Soft (SS):** makes the output more useful; skip if time runs out.
- **R1–R12** are the rules in [`clinical-thresholds.md`](clinical-thresholds.md#rule-table).

This file covers the science. It does not cover engineering constraints such as offline operation, compute, or privacy.

## The core problem

Terrestrial medicine assumes Earth-normal bodies, gravity, and a doctor nearby. None of these holds in flight.

- **The baseline moves.** Resting core temperature rises about 1.01 °C in flight. Systolic blood pressure fell from 122 to 111 mmHg in one cohort ([`clinical-thresholds.md`](clinical-thresholds.md#spaceflight-baseline-shifts)).
- **Some tests stop working.** A standing blood pressure test needs gravity. Bone density cannot be scanned onboard.
- **Real events are rare.** Crew have about 3.40 clinical events per flight year ([`operations.md`](operations.md#how-often-people-actually-get-sick)). A check that runs daily will produce mostly false alarms unless it is designed not to.
- **The evidence is thin.** Flight studies cover tens of people. The limits flight surgeons really use are not public ([`open-data.md`](open-data.md#10-what-is-not-openly-available)).

## Hard constraints

| ID | Constraint | Why | What we build |
| --- | --- | --- | --- |
| **SH1** | Every threshold, effect size, and piece of guidance traces to a published source and carries a confidence label. | Judges score scientific validity. Our green, amber, and red bands are derived for prototyping, not taken from NASA flight rules, so the basis must be visible. | Each rule stores `source` and `confidence`. The interface shows both next to the result. No number ships without them. |
| **SH2** | No Earth cutoff is used unadjusted where flight is known to shift the normal value. | A fever cutoff of 38.0 °C would flag almost every astronaut. Earth hypertension cutoffs overcall, while low pressure is the larger flight risk. | R4 and R2 use the flight adjustments in the rule table. Each rule states whether its range is terrestrial or flight-adjusted. |
| **SH3** | Status is judged against the person's own baseline and against an absolute safety limit. | Individual variation is wide; bone loss under exercise ranges from 0.3 to 0.8% per month. A rolling baseline alone slowly absorbs a decline and hides it. | Keep two baselines per indicator: a fixed preflight value and a rolling in-flight value. Flag change against either. Absolute red limits always apply. |
| **SH4** | A check runs only where its physics holds. | The standing blood pressure test is valid only in gravity (R3). Bone density is not measurable in flight (R9). Early fluid shifts distort body mass (R10). | Environment and mission phase switch rules on or off. Microgravity mode hides R3. Surface and landing modes enable it. |
| **SH5** | Every value is labelled as measured, self-reported, modelled, or simulated. | Bone load is an estimate from exercise adherence. Demo data comes from ground analogs. Presenting either as a flight measurement is false. | A provenance tag on every stored value, visible in the interface. A modelled value alone never produces a red status. |
| **SH6** | No amber or red comes from a single unconfirmed reading, unless the value is in the immediate-danger range or symptoms are present. | Cuff position, cold hands, and movement cause bad readings. With 3.40 real events per year, even a 5% daily false-alarm rate gives about 18 false alarms per person per year. | Rules require a repeat reading or persistence over days, as R1, R2, R4, and R5 already specify. Red with symptoms skips the wait. |
| **SH7** | Each reading is compared only with readings taken in the same context. | Temperature follows a daily cycle. Peak temperature during exercise runs 1.39 °C higher in flight than on Earth and can exceed 40 °C. Blood oxygen depends on cabin oxygen and suit state. | Every reading stores its unit, time, activity state (rest, exercise, after exercise), and environment mode. Resting rules reject non-resting readings. |
| **SH8** | Missing or stale data is never shown as green. | No reading is not a normal reading. A green tile from last week's value is a false reassurance. | Each indicator has a maximum age. Past it, the status becomes "no recent data" and the app prompts for a measurement. |
| **SH9** | The tool supports decisions; it does not diagnose. Treatment guidance is limited to sourced countermeasures and recognised first aid. | It is not a validated medical device. The mood rule (R7) is explicitly a heuristic. Wrong treatment advice with no doctor available is dangerous. | Wording says what was observed and what to do next, not what disease it is. Guidance draws on the countermeasures in [`operations.md`](operations.md#countermeasures-already-in-the-plan). No drug doses without a source. |
| **SH10** | Rules are tested on the real tables in `data/`, and claims stop where that data stops. | The bed-rest data is a ground analog. It shows no temperature rise (+0.04 °C), so it cannot test the space-fever rule. Inspiration4 is four crew for three days. | Replay the bed-rest daily vitals through the rules and report alert rates. State "tested on analog data, not validated in flight" wherever results are shown. |

## Soft constraints

| ID | Constraint | Why | What we build |
| --- | --- | --- | --- |
| **SS1** | Show trends and rate of change, not only the latest value. | Deconditioning, weight loss, and sleep debt develop over weeks. R10 already requires a rolling trend. | A trend chart per indicator and a slope-based flag. |
| **SS2** | Combine indicators where hazards interact. | NASA states the hazards feed off one another ([`resources.md`](resources.md#1-the-five-hazards-of-human-spaceflight)). Headache with high CO2 means something different from headache alone. | A few cross-indicator rules, such as symptoms plus R11, or heart rate plus temperature. Label them as heuristics. |
| **SS3** | Adjust expectations to mission phase. | Clinical events cluster in the first month. Core temperature plateaus near flight day 75. Eye and bone risks rise with duration. About 30% have orthostatic intolerance after return. | Mission day is an input to the rules. Phase-specific prompts, for example eye checks later in the mission. |
| **SS4** | Track countermeasure adherence as an early warning. | Exercise of 2 to 2.5 hours a day and an 8.5-hour sleep opportunity are the planned defences. Actual sleep averages 6.09 hours. | Log exercise and sleep against plan. Feed adherence into R6 and R9. |
| **SS5** | Show how sure each rule is. | Confidence ranges from high (radiation limits) to low (bone prediction, mood). | Display the confidence label from the rule table beside each status. |
| **SS6** | Record every alert and what followed. | Alert rates can only be tuned if false alarms are counted. | An alert log with outcome: confirmed, dismissed, or resolved. |
| **SS7** | Account for learning effects in repeated cognitive tests. | Scores improve with practice, which can hide a decline ([`open-data.md`](open-data.md#mapping-indicators-to-sources)). | Compare against the person's post-practice plateau, not their first sessions. |
| **SS8** | Treat radiation as a cumulative career quantity. | The limit is 600 mSv over a career, with a 250 mSv design limit for a solar particle event (R8). Dose never resets. | A running total per person that carries previous missions, plus a daily rate. |
| **SS9** | Allow personal factors to adjust a rule. | Age, sex, and medication change normal values. We have no flight-specific figures (*verify*). | A per-person notes field and optional per-person threshold overrides, each with a stated reason. |

## Verify before relying on it

These points are recalled from general knowledge or are unknown. None was checked against a NASA source for this file.

| Topic | What we believe | Status |
| --- | --- | --- |
| Onboard instruments | A station carries a blood pressure cuff, pulse oximeter, thermometer, ultrasound, and eye-imaging equipment. | Recalled, not sourced. A blood glucose meter in flight is unknown. |
| Body mass in microgravity | A scale does not work; mass is measured with a dedicated spring or acceleration device. | Recalled, not sourced. |
| Core temperature method | The space-fever study used a forehead sensor, not an ordinary thermometer. | Recalled. Check Stahn et al. 2017 before comparing with oral or ear readings. |
| Rest before a resting reading | How long after exercise a reading counts as resting. | Unknown. R2 uses 5 minutes of rest for blood pressure only. |
| Deep-space dose rate | Much higher than the 0.2 to 0.5 mSv per day on the station. | The repo says "far higher" with no figure. |
| Onboard medicines | Which drugs are carried, and whether they lose potency in flight. | Unknown. Needed before any drug guidance (SH9). |
| Sex, age, and medication effects | They change normal ranges in flight. | No flight-specific values in the repo. |
| Standard revisions | NASA-STD-3001 Volume 1 Rev C and Volume 2 Rev F are current. | Check the latest revision before quoting a limit. |
| Our colour bands | The green, amber, and red cutoffs are reasonable. | Derived for prototyping. Not reviewed by a clinician. |

## Validity tests

Run each against the prototype. A failed test means the matching hard constraint is broken.

- [ ] **SH1:** Pick any status on screen; its source and confidence are shown, and the source appears in a source list.
- [ ] **SH2:** Enter a resting temperature of 38.0 °C for a crew member on flight day 100 with a 37.8 °C baseline; the result is not a fever alert.
- [ ] **SH3:** Feed a heart rate that rises 1 bpm a day for 30 days; the app flags it against the preflight baseline.
- [ ] **SH4:** Switch to microgravity mode; the standing blood pressure test is unavailable. Switch to surface mode; it returns.
- [ ] **SH5:** Every value on every screen shows one of the four provenance labels, and no red status rests on a modelled value alone.
- [ ] **SH6:** Enter one blood pressure of 145/92 with no symptoms; the app asks for a repeat instead of showing red.
- [ ] **SH7:** Enter a temperature tagged "after exercise"; it is excluded from the resting-temperature rule.
- [ ] **SH8:** Advance the clock past an indicator's maximum age; its tile changes from green to "no recent data".
- [ ] **SH9:** Search all guidance text; none names a diagnosis as fact or gives a drug dose without a source.
- [ ] **SH10:** Replay the bed-rest daily vitals through the rules; the alert rate per subject-day is reported and the analog-data label is shown.

## Sources

All figures come from these repo files, which list the original papers and standards:

- [`clinical-thresholds.md`](clinical-thresholds.md) — rules R1–R12, baseline shifts, and their source list
- [`operations.md`](operations.md) — event rates, countermeasures, and crew medical training
- [`open-data.md`](open-data.md) — what the real datasets can and cannot show
- [`resources.md`](resources.md) — NASA's five hazards and 17 risks
