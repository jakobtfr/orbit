# Scientific Constraints for Spaceflight Use

Written 2026-11-14, simplified the same day. The rules our health logic must follow so its output is true in space, not only on Earth.

- **Hard (SH1 to SH10):** break one and the output is wrong or misleading in flight.
- **Soft (SS1 to SS9):** make the output more useful. Skip if time runs out.
- **R1 to R12** are the rules in [`clinical-thresholds.md`](../research/clinical-thresholds.md#rule-table).

This file covers the science only. It does not cover engineering limits such as offline use, compute, or privacy.

## Why we need them

Medicine on Earth assumes an Earth body, gravity, and a doctor nearby. None of these holds in flight.

- **Normal moves.** Body temperature rises about 1 °C and blood pressure drops ([`clinical-thresholds.md`](../research/clinical-thresholds.md#spaceflight-baseline-shifts)).
- **Some tests stop working.** A standing blood pressure test needs gravity. Bone density cannot be scanned on board.
- **Real events are rare.** About 3.4 per person per year ([`operations.md`](../research/operations.md#how-often-people-actually-get-sick)). A daily check will mostly raise false alarms unless it is built not to.
- **The evidence is thin.** Flight studies cover tens of people, and the limits flight surgeons use are not public ([`open-data.md`](../research/open-data.md#10-what-is-not-openly-available)).

## Hard constraints

Each row has one test. If the test fails on the prototype, the constraint is broken.

| ID | Rule | Why | Test |
| --- | --- | --- | --- |
| **SH1** | Every number and piece of advice shows its source and how sure we are. | Our colour bands are our own, not NASA flight rules. Judges score scientific validity. | Pick any status on screen: its source and confidence are shown. |
| **SH2** | Never use an Earth limit where flight is known to shift normal. | A 38.0 °C fever line would flag almost every astronaut. | Enter 38.0 °C on flight day 100 for someone with a 37.8 °C baseline: no fever alert. |
| **SH3** | Judge each person against their own baseline, and also against a fixed safety limit. Keep two baselines: one from before flight, one rolling in flight. | People differ widely. A rolling baseline alone slowly absorbs a decline and hides it. | Raise heart rate 1 bpm a day for 30 days: it is flagged against the preflight baseline. |
| **SH4** | Run a check only where it works. | The standing test needs gravity (R3). Bone density cannot be measured in flight (R9). Early fluid shifts distort weight (R10). | In microgravity mode the standing test is unavailable; in surface mode it returns. |
| **SH5** | Label every value as measured, self-reported, modelled, or simulated. | Bone load is an estimate. Demo data comes from the ground. Showing either as a flight measurement is false. | Every value shows one of the four labels, and no red status rests on a modelled value alone. |
| **SH6** | One odd reading is not an alarm. Ask for a repeat, unless the value is dangerous or the person has symptoms. | Cuff position, cold hands, and movement cause bad readings. A 5% daily false-alarm rate is about 18 false alarms per person per year. | Enter one blood pressure of 145/92 with no symptoms: the app asks for a repeat, not red. |
| **SH7** | Compare like with like: same time of day, same activity, same environment. | Temperature follows a daily cycle and runs higher during exercise. Blood oxygen depends on cabin air and suit state. | Enter a temperature tagged "after exercise": the resting rule ignores it. |
| **SH8** | Missing or old data is never shown as green. | No reading is not a normal reading. | Move the clock past an indicator's maximum age: the tile changes to "no recent data". |
| **SH9** | Support decisions; do not diagnose. Advice is limited to sourced countermeasures and recognised first aid. No drug doses without a source. | This is not a medical device, and wrong advice with no doctor in reach is dangerous. | Search all guidance text: no diagnosis stated as fact, no unsourced drug dose. |
| **SH10** | Test the rules on the real tables in `data/`, and claim no more than that data can show. | Bed rest is not spaceflight: it shows no temperature rise, so it cannot test the fever rule. | Replay the bed-rest vitals: the alert rate is reported with the label "tested on analog data, not validated in flight". |

## Soft constraints

| ID | Rule | Why |
| --- | --- | --- |
| **SS1** | Show the trend, not only the latest value. | Weight loss, sleep debt, and loss of fitness build over weeks. |
| **SS2** | Combine indicators where hazards interact, and label these rules as rough. | NASA says the hazards feed each other. A headache with high cabin CO₂ means something different from a headache alone. |
| **SS3** | Take the mission day into account. | Illness clusters in the first month. Temperature levels off near day 75. Eye and bone risks grow with time. About 30% feel faint on standing after return. |
| **SS4** | Track whether exercise and sleep follow the plan. | These are the main defences: 2 to 2.5 hours of exercise and 8.5 hours of sleep time a day. Actual sleep averages 6.09 hours. |
| **SS5** | Show how sure each rule is. | Confidence runs from high (radiation limits) to low (bone, mood). |
| **SS6** | Log every alert and what happened next. | False alarms can only be reduced if they are counted. |
| **SS7** | Allow for practice in repeated thinking tests. | Scores rise with practice, which can hide a decline. Compare against the level reached after practice. |
| **SS8** | Count radiation as a career total that never resets. | The limit is 600 mSv over a career (R8). |
| **SS9** | Let personal factors adjust a rule, with a stated reason. | Age, sex, and medication change normal values. We have no flight figures for this. |

## Verify before relying on it

These are from memory or unknown. None was checked against a NASA source.

- **Instruments on board:** we assume a blood pressure cuff, pulse oximeter, thermometer, ultrasound, and eye imaging. A blood sugar meter in flight is unknown.
- **Weighing in weightlessness:** a scale does not work; a special device is used.
- **Temperature method:** the space-fever study used a forehead sensor. Check before comparing with mouth or ear readings.
- **Rest before a resting reading:** unknown, apart from 5 minutes for blood pressure (R2).
- **Onboard medicines:** which are carried, and whether they weaken in flight. Needed before any drug advice (SH9).
- **Age, sex, and medication effects in flight:** no values in the repo.
- **Standard versions:** check that NASA-STD-3001 Volume 1 Rev C and Volume 2 Rev F are still current before quoting a limit.
- **Our colour bands:** made for the prototype and not reviewed by a clinician.

## Sources

All figures come from these repo files, which list the original papers and standards:

- [`clinical-thresholds.md`](../research/clinical-thresholds.md): rules R1 to R12 and baseline shifts
- [`operations.md`](../research/operations.md): event rates, countermeasures, and crew medical training
- [`open-data.md`](../research/open-data.md): what the real datasets can and cannot show
- [`resources.md`](../challenge/resources.md): NASA's five hazards and 17 risks
