# How many real problems each rule set misses

Written 2026-11-15. Code: [`app/src/lib/missRate.ts`](../../app/src/lib/missRate.ts). Tests: [`missRate.test.ts`](../../app/src/lib/missRate.test.ts). Separate check: [`app/scripts/miss_rate_check.py`](../../app/scripts/miss_rate_check.py).

## Why

The Replay shows that ORBIT raises fewer false alarms: 13.5% against 5.9% of days with the same two-day rule (`replay.test.ts`). Fewer alarms are only good if real problems are still caught. The NASA bed-rest data has no real illness, so this cannot be read from the data directly.

## Method

1. **Plant known problems** on top of each volunteer's real NASA readings (UTMB bed-rest study, [doi:10.83263/wjw1-ta27](https://doi.org/10.83263/wjw1-ta27)): a fever, a heart-rate jump, a slow heart-rate drift, a blood-pressure rise and a blood-pressure drop, each in several sizes. The real day-to-day scatter stays in.
2. Each problem starts on bed-rest day 20, 35 and 50 in each of the 29 volunteers. Left out: windows that run past a volunteer's record, volunteers with no baseline for the vital, and windows with no reading of the vital. That leaves 41 to 84 cases per problem and rule; every cell shows its count.
3. **Caught** = the rule alarms on that vital inside the problem window. A **two-day rule** needs the *same* vital over on two days in a row, *both inside the window*. Nothing before the problem, and no other vital, can confirm it.
4. **No free catches.** A window counts only if the rule did *not* already alarm on that vital there before anything was planted.
5. Same lines as the Replay: Earth limits (pulse > 100, BP ≥ 130/80, temperature ≥ 38.0 °C), stricter Earth (140/90), and ORBIT (+20% pulse, +20/+15 BP, +0.5 °C over the volunteer's own pre-bed-rest mean).
6. **Checked twice.** `miss_rate_check.py` is written separately in Python and gives the same counts in all 65 cells. The tests pin 9 of them.

## Results

Share of problems caught, clean windows only (caught / windows).

| Planted problem | Earth, 2 days | **ORBIT, 2 days** | Earth, 1 day | Stricter Earth, 1 day | ORBIT, 1 day | Mean days to alarm, Earth / ORBIT (2 days) |
|---|---|---|---|---|---|---|
| Fever +0.5 °C, 3 days | 0% (0/78) | **37% (29/78)** | 0% (0/78) | 0% (0/78) | 79% (58/73) | – / 1.1 |
| Fever +1.0 °C, 3 days | 8% (6/78) | **94% (73/78)** | 17% (13/78) | 17% (13/78) | 100% (73/73) | 1.2 / 1.0 |
| Fever +1.5 °C, 3 days | 47% (37/78) | **100% (78/78)** | 78% (61/78) | 78% (61/78) | 100% (73/73) | 1.1 / 1.0 |
| Heart rate +10 bpm, 5 days | 2% (2/84) | **39% (31/80)** | 11% (9/82) | 11% (9/82) | 60% (37/62) | 1.5 / 1.8 |
| Heart rate +20 bpm, 5 days | 20% (17/84) | **93% (74/80)** | 29% (24/82) | 29% (24/82) | 97% (60/62) | 1.8 / 1.3 |
| Heart rate +30 bpm, 5 days | 48% (40/84) | **100% (80/80)** | 83% (68/82) | 83% (68/82) | 100% (62/62) | 1.9 / 1.0 |
| Heart rate drifts up 0.5 bpm a day, 30 days | 14% (8/57) | **71% (29/41)** | 33% (18/54) | 33% (18/54) | 81% (13/16) | 21.8 / 21.0 |
| Heart rate drifts up 1 bpm a day, 30 days | 58% (33/57) | **100% (41/41)** | 87% (47/54) | 87% (47/54) | 100% (16/16) | 21.4 / 14.1 |
| Blood pressure +15/+9, 3 days | 50% (36/72) | **26% (22/84)** | 75% (41/55) | 33% (26/80) | 57% (43/75) | 1.3 / 1.3 |
| Blood pressure +25/+15, 3 days | 90% (65/72) | **69% (58/84)** | 98% (54/55) | 76% (61/80) | 96% (72/75) | 1.1 / 1.2 |
| Blood pressure +35/+21, 3 days | 100% (72/72) | **99% (83/84)** | 100% (55/55) | 98% (78/80) | 100% (75/75) | 1.0 / 1.0 |
| Blood pressure −20/−12, 3 days | 0% (0/72) | **0% (0/84)** | 0% (0/55) | 0% (0/80) | 0% (0/75) | – / – |
| Blood pressure −30/−18, 3 days | 0% (0/72) | **0% (0/84)** | 0% (0/55) | 0% (0/80) | 0% (0/75) | – / – |

Days to alarm: mean over clean catches, counted from the first day of the problem.

## What it shows

- **ORBIT catches far more fevers and heart-rate changes.** A +1 °C fever: 94% against 8%. A +20 bpm rise: 93% against 20%. A slow drift of 0.5 bpm a day: 71% against 14%. The bed-rest volunteers' temperatures sit near 36.5 °C, so a real fever often stays under Earth's 38.0 line.
- **ORBIT catches less of a small blood-pressure rise.** +15/+9: 26% against 50%. +25/+15: 69% against 90%. Earth's 130/80 line sits close to many people's normal, so a small rise crosses it. The cost: Earth's line already alarms in many of these windows with nothing wrong, which is why it gets only 72 clean windows. This is a real trade-off, and the pitch should say so.
- **Nobody catches a blood-pressure drop.** Neither Replay rule set has a low side. The live app does (a fixed floor under 90 systolic, and 20/15 below the personal normal); the Replay does not test it.
- **For fever and heart rate, fewer false alarms did not cost sensitivity.** With the same two-day rule, ORBIT raises fewer false alarms (5.9% against 13.5% of days, from `replay.test.ts`) *and* catches more of these problems.

## Limits

- Planted problems are simple steps and ramps added to real readings. Real illness can look different.
- Sizes are a range, not taken from clinical incidence. Each is reported on its own, so no single size decides the result.
- Some cells rest on few windows: ORBIT single-day drift has 16. Read those with care.
- Bed rest is a ground stand-in for flight.
- These are the Replay's prototype rules, not the phase-aware rules of the live app ([`phase-limits.md`](phase-limits.md)).
- The Replay's own headline counts (13.5% and 5.9%) confirm two days in a row on *any* vital, the team's original data-check rule, used the same way on both sides. This page confirms on the *same* vital, which is stricter.
