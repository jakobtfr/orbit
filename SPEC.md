# ORBIT Spec, Version 2

Written 2026-11-14, rewritten the same day to match the app as built. What the app contains, how the screens connect, and the data and logic behind them.

**How to use this file.** This file says *what* each screen contains and does. [`DESIGN.md`](DESIGN.md) says *how* it looks and reads. If they disagree, `DESIGN.md` wins on look and wording, this file wins on content and behaviour. The reasons behind the product are in [`solution-overview.md`](docs/solution/solution-overview.md); the science rules (SH1 to SH10) are in [`scientific-constraints.md`](docs/research/scientific-constraints.md).

**What changed from version 1.** The 3D body became an anatomical body map on a three-column personal dashboard, styled after apple.com. The Flight, Sources, and Crew screens and the orbit model were removed. Replay, Deep Data, Mental Health, and the planet/flight setting were added. Emergency moved to a button at the top right and its steps now cite published guidelines. The `SIMULATED` tag was removed.

## The one idea

ORBIT judges each reading against the astronaut's own normal, not Earth's. The app shows this twice: in the product, where indicator charts draw Earth's limit next to the personal one, and as evidence, where real NASA bed-rest data is replayed through both rule sets (25.5% of days with an alarm under Earth limits, 5.9% under personal rules). Every screen should support that idea or get out of its way.

## Scope

| In | Out |
| --- | --- |
| A front end that runs in the browser with no server or network | Accounts, login, a real server |
| One astronaut, Lena Brandt, seen from her own point of view | Switching between crew members |
| Scripted readings for Lena; real NASA UTMB bed-rest data in Replay | Real device connections |
| One emergency scenario: chest pain or collapse | Other emergency scenarios (listed as "Not in this version") |
| A planet and a flight health system | A moving mission day or orbit model |
| Desktop, tablet, and phone widths | Translations, light theme |

## Words used in this spec

- **Indicator:** one thing ORBIT watches, such as heart rate or sleep.
- **Reading:** one value of an indicator at one time.
- **Status:** In range, Caution, Warning, No recent data, Unavailable, or Repeat reading (see `DESIGN.md`).
- **Personal normal:** the astronaut's own value from before flight, or the mean of their recent readings in flight, depending on the indicator.
- **Earth limit:** the fixed cutoff a ground clinic would use, such as a pulse over 100.

## Screen map

```
Header (every screen): ORBIT · health system · day · viewer · Settings · Emergency
Navigation (planet system): Dashboard · Deep Data · Mental Health

Dashboard ──► Region ──► Indicator ──► Measure
    │    └──► Muscle group
    ├──► Check-in
    └──► Replay  (also from Deep Data)
Mental Health
Emergency (from the header, on every screen)
```

| Screen | Route | The question it answers |
| --- | --- | --- |
| Dashboard | `#/body/lena` | How am I today, and is anything off? |
| Region | `#/body/lena/region/:region` | What is watched in this part of the body? |
| Muscle group | `#/body/lena/muscle/:muscle` | What does this muscle do, and how is my training going? |
| Indicator | `#/body/lena/indicator/:key` | Is this reading normal for me? |
| Symptoms | `#/body/lena/symptoms/:region` | What did I report for this part of the body? |
| Measure | `#/body/lena/measure/:key` | How do I take this reading? |
| Check-in | `#/body/lena/check-in` | How do I feel today? |
| Deep Data | `#/deep-data` | What do real bed-rest records look like in detail? |
| Mental Health | `#/mental-health` | How am I feeling, privately? |
| Replay | `#/replay` | Does judging against my own normal really matter? |
| Emergency | `#/emergency` | What do I do right now? |

The app opens on the Dashboard.

## App shell

**Header**, left to right: the ORBIT mark and wordmark (links to the Dashboard), the active health system and mission day, the viewer's name and role, a Settings button, and the **Emergency** button.

- **Settings** chooses the planet health system (surface, gravity checks) or the flight health system (spacecraft, microgravity). The choice sets the place used by the rules: the standing blood pressure test is Unavailable in the spacecraft, and the radiation reference changes. Readings and the mission day stay the same. Planet is the default.
- **Emergency** is always at the top right, outlined in `status-warning`. On narrow screens the system label and viewer name hide so the button stays visible.
- **Navigation** (planet system only): a floating bar with Dashboard, Deep Data, and Mental Health.
- No NASA insignia anywhere (14 CFR 1221).

## Screens

### Dashboard

The home screen. A bento grid of tiles in three columns; two on tablets, one on phones. No column headers or numbering: each tile's content says what it is.

**Body map.** An anatomical SVG figure in flat neutral greys, front and back. Tapping a body region opens Region; tapping a muscle group opens Muscle group. A list under the figure gives the same targets for keyboard and screen readers.

**Daily activity.** Movement against the 120-minute exercise plan (green ring), last night's sleep, resting heart rate with status, blood oxygen, and weekly plan adherence (blue ring). Each opens its Indicator.

**Risks & checks.** One list: radiation exposure against the reference, any other item that needs attention with its next action, temperature and symptoms, sleep and recovery, the scheduled exercise and vision check (marked "demo"), and the daily check-in button. Urgent items get a red round icon, items due soon a yellow one.

**Trends.** First, the card **Earth limits vs. your normal** ("NASA data"): two lanes for one real bed-rest volunteer (UTMB-01, 90 days), one bar per day, alarm days tall and red, with counters (Earth limits 54, your normal 1). The lanes fill once on load and again on click; with reduced motion they show the end state. One caption line, then a link "All 29: 46 vs 11 alarms in 6 months" to Replay. All numbers are calculated from `utmb-replay.json` at runtime. Then a 14/28-day switch and plots of resting heart rate, core temperature, and radiation dose rate with their limits and expandable details. Method: [`dashboard-methodology.md`](docs/solution/dashboard-methodology.md).

### Region and Muscle group

- **Region:** the region name, one paragraph on what is watched there and why it matters in space, and a tile per indicator plus a symptoms tile, most serious first.
- **Muscle group:** the muscle's name and function, a note that only whole-body exercise is tracked, tiles for exercise and bone protection, and a link to report soreness in the check-in.

### Indicator

Top to bottom:

1. The latest value with unit and limit arrow, status, and two tags: age and source.
2. **Compared with you:** before flight and the last 7 days, each with the difference from now.
3. **Next-action card**, when the status calls for one.
4. **Trend chart** (7 days, 30 days, whole mission). For heart rate, blood pressure, and temperature it draws **Earth's limit as a dashed line** next to the personal band and personal limit. Example: Lena's temperature of 38.0 °C on day 100 sits on Earth's fever line and shows In range, because her in-flight normal is about 37.8 °C.
5. **Readings:** the last ten, with time, value, context, and source.
6. A "How to measure" link to Measure.

Special cases: Unavailable shows the reason ("The standing test needs gravity."); No recent data shows the last value muted with its age; a modelled value says "Estimated, not measured." and never shows Warning (SH5).

### Measure and Check-in

- **Measure:** where the value comes from, three to five numbered steps, activity and time context (SH7), a value input, and "Save reading". Saving returns to Indicator.
- **Check-in:** four steps: how you feel, symptoms (with where and how bad for pain), mood ("Only you can see this."), and a summary with a next action if a symptom was logged.

### Deep Data

Real NASA UTMB bed-rest records, not Lena's data. A volunteer picker ("Volunteer 1" and so on, no study codes), 7/28/90-day windows, and an end day. Three figures (resting heart rate, systolic blood pressure, temperature) with daily observations, trailing seven-day mean ±1 SD, the pre-bed-rest mean, and the personal review threshold; each exports as SVG. Beside them a rule-based **Medical summary** (marked "Automated draft", not reviewed by a clinician) and short wellbeing prompts linking to Mental Health. CSV export, methods, and a link to Replay.

### Mental Health

Private to the astronaut: mood (1 to 5), energy, an optional journal note, a 60-second breathing timer, and the list of past entries. Entries live in memory and clear on reload. Saving here does not complete the medical check-in.

### Replay

The evidence screen. Built on real, unaltered NASA UTMB bed-rest data.

1. Title "Earth's normal or yours?" and one paragraph on bed rest as a stand-in for weightlessness.
2. **All volunteers:** two tiles, Earth limits 25.5% and ORBIT 5.9% of days with an alarm, with alarms per person in 180 days.
3. **One volunteer, day by day:** two featured cases and a list of all 29.
   - *Normal runs high* (UTMB-01): blood pressure 132/80 before bed rest, on Earth's line. Earth 54 alarms, ORBIT 1.
   - *Slow heart-rate rise* (UTMB-40): resting pulse drifts from 55 to about 75. Earth 1 alarm, ORBIT 10.
4. **Player:** play/pause and a day slider; two alarm lanes with counters; a "today" panel showing each vital, the Earth verdict, and the personal verdict, including "Repeat reading" when a value is over the personal limit only once.
5. **Chart** of one vital at a time with Earth's limit, the volunteer's own normal, and their personal limit.
6. The rules, the source DOI, and the limit of the evidence: fewer false alarms, not proof that real problems are caught.

### Emergency

Full screen; the shell is replaced by the warning header with a timer and "Stop flashing".

1. **Who needs help?** The four crew members.
2. **What is happening?** "Chest pain or collapse"; other scenarios are listed as "Not in this version".
3. **Steps,** one per screen, with "Done, next". Completed steps stay listed with their times. Each step shows its source.
   - Check for a response. Call for help and send for the defibrillator.
   - **Is the person breathing normally?** (10 seconds at most.)
   - **No:** chest compressions at once (Evetts–Russomano position when alone), defibrillator, move to the medical restraint and continue from a handstand, report to the ground and keep going.
   - **Yes:** keep at rest and note when the pain started, take readings, report to the ground. "Breathing stopped: start CPR" switches to the CPR steps at any time.
4. **Patient panel** beside the steps when the patient is the viewer: heart rate, blood pressure, blood oxygen, with before-flight values.
5. **End:** a summary and "Close and return". "Leave emergency" asks for confirmation.

Sources: ERC 2021 and AHA 2020 basic life support; Hinkelbein et al. 2020, CPR in microgravity; AHA heart-attack warning signs. Step text lives in `app/src/data/emergency.ts`. It has not been reviewed by a clinician.

## Indicators

| Indicator | Region | Rule | Source shown | Provenance | Maximum age |
| --- | --- | --- | --- | --- | --- |
| Heart rate at rest | Chest | R1 | Smart shirt | Measured | 1 day |
| Blood pressure | Chest | R2 | Smart shirt | Measured | 1 day |
| Standing blood pressure test | Chest | R3 | Entered by hand | Measured | 7 days |
| Blood oxygen | Chest | R5 | Smart shirt | Measured | 1 day |
| Body temperature | Whole body | R4 | Entered by hand | Measured | 1 day |
| Body weight | Whole body | R10 | Body mass device | Measured | 7 days |
| Vision check | Head | R12 | Entered by hand | Self-reported | 30 days |
| Symptoms | By region | None | Check-in | Self-reported | 2 days |
| Bone protection | Hips and spine | R9 | Estimated from exercise | Modelled | 1 day |
| Sleep | Activity | R6 | Wrist tracker | Measured | 1 day |
| Exercise | Activity | R9 | Exercise machines | Measured | 1 day |
| Radiation dose | Activity | R8 | Radiation monitor | Measured | 1 day |
| Cabin air | Activity | R11 | Cabin monitor | Measured | 1 hour |
| Mood | Mental Health, private | R7 | Check-in | Self-reported | 2 days |

Maximum ages are our own prototype values, not sourced.

## Data

| Data | File | Real or scripted |
| --- | --- | --- |
| Bed-rest vitals and baselines of 29 volunteers | `app/src/data/utmb-replay.json`, made by `app/scripts/replay_data.py` from `data/utmb/` | Real, unaltered |
| Day-to-day variation of Lena's vital signs | `app/src/data/utmb-residuals.json` | Real variation from four UTMB volunteers |
| Lena's levels, trends, sleep, exercise, radiation, cabin air | `app/src/data/demo.ts` | Scripted, with illustrative drift |
| Crew names for the emergency flow | `app/src/data/demo.ts` | Invented; no real astronauts |
| Emergency steps and sources | `app/src/data/emergency.ts` | From published guidelines |

Lena's readings run daily from 30 days before launch to the end of the mission. The app opens on mission day 100, where her temperature reads 38.0 °C.

## Logic

| Behaviour | Rule |
| --- | --- |
| Judging a reading | Against the personal normal and flight-adjusted limits in `lib/judge.ts`, simplified from rules R1 to R12. |
| One odd reading | Spot readings out of range once show Repeat reading; a confirming reading makes it Caution or Warning (SH6). Readings dangerous on their own, such as blood oxygen below 90%, skip the repeat. |
| Old readings | Older than the maximum age shows No recent data, never green (SH8). |
| Place | Set by the health system. The standing test is Unavailable in the spacecraft (SH4). |
| Saving a reading | Added to the record and judged at once. |
| Finishing a check-in | Logged symptoms mark their region; the check-in shows as done for the day. |
| Replay | `lib/replay.ts`: Earth cutoffs on any single day against personal rules on two days in a row. Tests reproduce 25.5% and 5.9%. |

## States every screen must handle

- **All in range:** quiet, with small green shapes only.
- **Needs attention:** status shapes and words, and one next action.
- **Nothing to show:** an empty line, never a blank area.
- **Private:** mood and journal entries are never shown outside Mental Health and the check-in.
- **Keyboard focus:** a visible ring on every control, in a sensible order.
- **Reduced motion:** no transitions, no flashing, no filling animation.

## Done when

- [x] The Dashboard shows the bed-rest comparison in one card and links to Replay.
- [x] Replay reproduces 25.5% and 5.9% from the raw data, checked by tests.
- [x] Indicator charts show Earth's limit next to the personal one for heart rate, blood pressure, and temperature.
- [x] Lena's 38.0 °C shows In range (SH2).
- [x] Emergency opens from every screen in one tap; the first step is on screen within three taps.
- [x] Every emergency step cites a source, checked by tests (SH9).
- [x] In the flight system the standing test shows Unavailable with its reason (SH4).
- [x] No NASA insignia in the app.
- [ ] The emergency step text is reviewed by someone with medical training.
- [ ] Three outsiders reach the right next action in under three minutes using only the app (H3).
- [ ] A crewmate reaches the first correct emergency action within one minute (H4).

## Open points

- **Radiation late in the mission.** With the published dose rates the total passes the 600 mSv career limit around day 460; from then on radiation stays at Warning.
- **Maximum ages and review bands** are our own values.
