# Limits that follow the mission phase

Written 2026-11-14. Code: [`app/src/lib/phases.ts`](../../app/src/lib/phases.ts). Checked against NASA data by [`phases.nasa.test.ts`](../../app/src/lib/phases.nasa.test.ts).

## The problem

The body changes when gravity changes. A limit that fits on Earth raises false alarms in flight, and a limit learned in flight can hide a real problem. ORBIT used Earth's cutoffs (heart rate over 100, blood pressure 130/80, diastolic under 60) in every phase.

## How it works

1. **Phase.** The mission day gives the gravity: Earth before flight, weightlessness outbound, 0.38 g on Mars, weightlessness on return, Earth after landing.
2. **Expected change.** For each vital and gravity level, the table holds the expected change from the person's own pre-flight value, and how fast it settles.
3. **Re-entry.** Arriving in gravity from weightlessness adds a short heart-rate rise that fades over days.
4. **Personal offset.** In the 14 days after the body has settled (days 14–28 of a phase), the app learns how far this person sits from the expectation. It then holds that offset for the rest of the phase. It does not keep re-learning, so a slow drift is not absorbed.
5. **Hard bounds.** The offset is clamped to ±2 SD of the change between NASA volunteers. A person's normal can never be learned outside that range.
6. **Adapting.** For 14 days after any gravity change, personal limits are 1.5 times wider.
7. **Danger values never move.** The fixed values from [`clinical-thresholds.md`](clinical-thresholds.md) apply in every phase. NASA-STD-3001 sets no vital-sign alarm limits.

## The values and where they come from

Source of every "NASA data" value: NASA UTMB head-down bed-rest study, NASA Life Sciences Portal, [doi:10.83263/wjw1-ta27](https://doi.org/10.83263/wjw1-ta27), `data/utmb/daily_vitals.csv`. Change = each volunteer's mean minus their own pre-bed-rest mean; then mean and SD across volunteers.

| Period (NASA bed rest) | n | Heart rate | Systolic | Diastolic | Temperature |
|---|---|---|---|---|---|
| Bed rest days 1–14 | 29 | −2.1 (SD 4.2) | −0.7 (5.3) | −0.8 (4.7) | +0.03 (0.15) |
| Bed rest day 15 on | 29 | **+2.2 (4.7)** | **−0.1 (4.8)** | **+1.5 (5.3)** | +0.03 (0.12) |
| After bed rest, days 0–3 | 27 | **+11.7 (8.9)** | +1.6 (5.8) | +2.0 (6.1) | +0.06 |
| After bed rest, days 4–7 | 27 | +6.7 (8.7) | −0.7 | −0.9 | +0.05 |
| After bed rest, day 8 on | 25 | +5.0 (7.3) | −2.1 | −1.4 | +0.02 |

Tilt test (NASA UTMB "Response to Tilt", [doi:10.83263/gz1q-a824](https://doi.org/10.83263/gz1q-a824)): heart-rate rise on tilting 34 bpm before bed rest (n = 26), 44 bpm after (n = 41).

| Gravity | Vital | Expected change | Spread (±) | Evidence |
|---|---|---|---|---|
| Weightlessness | Heart rate | +2 bpm | 9 | NASA data |
| Weightlessness | Systolic / diastolic | 0 / +1 mmHg | 10 / 10 | NASA data |
| Weightlessness | Temperature | +1.0 °C over ~75 days | 0.3 | **Outside NASA**: ESA/Charité ISS study, Stahn et al. 2017. Bed rest shows no rise. |
| Earth after landing | Heart rate | +12 bpm, fading over ~10 days | 15 | NASA data |
| Earth after landing | Systolic / diastolic | 0 / 0 mmHg | 13 / 13 | NASA data |
| Earth after landing | Temperature | 0 (falls back over ~10 days) | 0.4 | NASA data |
| Mars, 0.38 g | All | Bed-rest values; temperature +0.5 °C | 15 / 13 / 13 / 0.6 | **Estimate**: NASA has no data for long stays at 0.38 g |

Spreads are 2 SD of the change between volunteers: weightlessness from bed-rest day 15 on, Earth from day 8 after bed rest. Mars takes the wider of the two. `phases.nasa.test.ts` checks the weightlessness and Earth values against the raw NASA file.

## Demo data change

The demo spacecraft's dose rate in transit changed from 1.8 to 1.1 mSv a day. 1.8 is Curiosity's lightly shielded cruise stage (1.84, Zeitlin et al. 2013). It breaks NASA's design limit of 1.3 mSv a day in free space for crewed vehicles ([NASA OCHMO standards overview, 2021](https://www.nasa.gov/sites/default/files/atoms/files/ochmo_standards_overview_sept_15_2021_francisco.pdf)), so the home screen showed radiation in red every day.

## Limits of this method

- Bed rest is a ground stand-in. It does not reproduce the in-flight temperature rise. Flight studies disagree on blood pressure: Norsk et al. 2015 found −8/−9 mmHg on the ISS; Hughson 2012 and others found no change. NASA's bed-rest data shows no change, so ORBIT uses no change, and the personal offset learns a real drop within ±10 mmHg.
- Mars values are estimates.
- Not validated on flight data. Not reviewed by a clinician.
