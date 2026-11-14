# ORBIT Spec, Version 2

Written 2026-11-14, rewritten the same day to match the app as built. What the app contains, how the screens connect, and the data and logic behind them.

**How to use this file.** This file says *what* each screen contains and does. [`DESIGN.md`](DESIGN.md) says *how* it looks and reads. If they disagree, `DESIGN.md` wins on look and wording, this file wins on content and behaviour. The reasons behind the product are in [`solution-overview.md`](docs/solution/solution-overview.md); the science rules (SH1 to SH10) are in [`scientific-constraints.md`](docs/research/scientific-constraints.md).

**What changed from version 1.** The 3D body became an anatomical body map on a three-column personal dashboard, styled after apple.com. The Flight, Sources, and Crew screens and the orbit model were removed. Replay, Measurements, and Mental Health were added. The emergency first-aid flow was replaced by a virtual doctor the viewer can talk to about their own results, opened from a button at the top right of every screen. The `SIMULATED` tag was removed.

## The one idea

ORBIT judges each reading against the astronaut's own normal, not Earth's. The app shows this twice: in the product, where indicator charts draw Earth's limit next to the personal one, and as evidence, where real NASA bed-rest data is replayed through both rule sets (25.5% of days with an alarm under Earth limits, 5.9% under personal rules). Every screen should support that idea or get out of its way.

## Scope

| In | Out |
| --- | --- |
| A front end that runs in the browser with no server or network | Accounts, login, a real server |
| One astronaut, Lena Brandt, seen from her own point of view | Switching between crew members |
| Scripted readings for Lena; real NASA UTMB bed-rest data in Replay | Real device connections |
| A simulated doctor that talks about the viewer's own results, by voice or text | Step-by-step first aid for a crewmate; a doctor that examines the camera picture |
| Place taken from the mission day: spacecraft while travelling, surface on Mars | A control that overrides where the crew is |
| Desktop, tablet, and phone widths | Translations, light theme |

## Words used in this spec

- **Indicator:** one thing ORBIT watches, such as heart rate or sleep.
- **Reading:** one value of an indicator at one time.
- **Status:** In range, Caution, Warning, No recent data, Unavailable, or Repeat reading (see `DESIGN.md`).
- **Personal normal:** the astronaut's own value from before flight, or the mean of their recent readings in flight, depending on the indicator.
- **Earth limit:** the fixed cutoff a ground clinic would use, such as a pulse over 100.

## Screen map

```
Header (every screen): ORBIT · mission phase · day · viewer · Talk to the doctor
Navigation: Dashboard · Measurements · Mental Health

Dashboard ──► Region ──► Indicator ──► Measure
    │    └──► Muscle group
    ├──► Check-in
    └──► Replay
Mental Health
Talk to the doctor (from the header, on every screen)
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
| Measurements | `#/measurements` | What do my own measurements look like over time? |
| Mental Health | `#/mental-health` | How am I feeling, privately? |
| Replay | `#/replay` | Does judging against my own normal really matter? |
| Talk to the doctor | `#/doctor` | Are my results fine, and what should I do? |

The app opens on the Dashboard.

## App shell

**Header**, left to right: the ORBIT mark and wordmark (links to the Dashboard), the mission phase and day, the viewer's name and role, and the **Talk to the doctor** button.

- **Talk to the doctor** is always at the top right, an accent pill. On narrow screens the phase label and viewer name hide so the button stays visible.
- **Navigation:** a floating bar with Dashboard, Measurements, and Mental Health. `#/deep-data` redirects to Measurements.
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

### Measurements

Lena's own measurements, for exploring the record. A list of every indicator, grouped by part of the body, with the latest value and status. Choosing one draws its trend for 7, 28, or 90 days, or the whole mission, using the same chart as Indicator: her readings, her normal, her personal limit, and the Earth cutoff where one exists. The footer shows the latest value, how many readings fall in the window, and the change from before flight. "Open this measurement" goes to that indicator. CSV export covers every measurement in the window. The NASA bed-rest comparison stays on Replay.

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

### Talk to the doctor

Inside the shell, in two parts. The doctor is simulated and runs on the device. When [Ollama](https://ollama.com) is running on the same machine, answers are written by its language model (`app/src/lib/localModel.ts`), which is given the viewer's readings, their status, and the findings from the rules in `judge.ts` and told to use nothing else. Sentences are spoken as they arrive. When no model is running or it does not answer, the doctor uses its built-in answers (`app/src/lib/doctor.ts`). The opening read and the answer to urgent words are always the built-in ones. Nothing is sent off the device.

1. **Call stage.** The doctor's tile with a "Simulated" tag, its state (Speaking, Listening, Ready), and its latest sentence as a caption. The viewer's own camera sits in the corner. Controls: "Start call" (voice and camera together), "Voice", "Camera", and "End call".
2. **Conversation.** The doctor opens with a read of today: "Your results look fine", or "Something seems off with your chest" followed by what was observed and the next action. Messages carry the status shape and buttons such as "Repeat reading". Four suggested questions and a text box work with voice off.
3. **Voice mode.** The doctor speaks each answer, then listens, then answers again. Units are read as words ("110 over 66"). If the browser cannot listen, the doctor still speaks and the viewer types.
4. **What it answers.** How the results look; one part of the body or one indicator; what to do next; a symptom the viewer describes, which it relates to the readings and sends to the check-in. Mood and the diary are private and are not read.
5. **Urgent words** (chest pain, cannot breathe, fainting, sudden loss of vision) are never handled by the doctor: it tells the viewer to stay still and call the medical lead now, and gives the latest heart rate, blood pressure, and blood oxygen to pass on.

The camera picture is shown only to the viewer and is not recorded or analysed. Speech recognition is the browser's own and may process audio online. The wording has not been reviewed by a clinician.

## Indicators

| Indicator | Region | Rule | Source shown | Provenance | Maximum age |
| --- | --- | --- | --- | --- | --- |
| Heart rate at rest | Chest | R1 | Smart shirt | Measured | 1 day |
| Blood pressure | Chest | R2 | Smart shirt | Measured | 1 day |
| Standing blood pressure test | Chest | R3 | Entered by hand | Measured | 7 days |
| Blood oxygen | Chest | R5 | Smart shirt | Measured | 1 day |
| Breathing rate | Chest | R13 | Smart shirt | Measured | 1 day |
| Body temperature | Whole body | R4 | Entered by hand | Measured | 1 day |
| Body weight | Whole body | R10 | Body mass device | Measured | 7 days |
| Blood sugar | Whole body | R14 | Fingerstick | Measured | 7 days |
| Food eaten | Whole body | R15 | Food log | Self-reported | 1 day |
| Fluid drunk | Whole body | R16 | Drink log | Self-reported | 1 day |
| Balance test | Whole body | R22 | Entered by hand | Measured | 7 days |
| Vision check | Head | R12 | Entered by hand | Self-reported | 30 days |
| Hearing check | Head | R19 | Hearing test | Measured | 30 days |
| Thinking check | Head | R18 | Short thinking test | Measured | 14 days |
| Symptoms | By region | None | Check-in | Self-reported | 2 days |
| Bone protection | Hips and spine | R9 | Estimated from exercise | Modelled | 1 day |
| Sleep | Activity | R6 | Wrist tracker | Measured | 1 day |
| Exercise | Activity | R9 | Exercise machines | Measured | 1 day |
| Radiation dose | Activity | R8 | Radiation monitor | Measured | 1 day |
| Cabin air | Activity | R11 | Cabin monitor | Measured | 1 hour |
| Cabin oxygen | Activity | R17 | Cabin monitor | Measured | 1 day |
| Cabin noise | Activity | R20 | Cabin monitor | Measured | 1 day |
| Potable water | Activity | R21 | Water monitor | Measured | 14 days |
| Mood | Mental Health, private | R7 | Check-in | Self-reported | 2 days |

Maximum ages are our own prototype values, not sourced.

## Data

| Data | File | Real or scripted |
| --- | --- | --- |
| Bed-rest vitals and baselines of 29 volunteers | `app/src/data/utmb-replay.json`, made by `app/scripts/replay_data.py` from `data/utmb/` | Real, unaltered |
| Day-to-day variation of Lena's vital signs | `app/src/data/utmb-residuals.json` | Real variation from four UTMB volunteers |
| Lena's levels, trends, sleep, exercise, radiation, cabin air | `app/src/data/demo.ts` | Scripted, with illustrative drift |
| Crew names, used by the doctor to name the medical lead | `app/src/data/demo.ts` | Invented; no real astronauts |

Lena's readings run daily from 30 days before launch to the end of the mission. The app opens on mission day 100, where her temperature reads 38.0 °C.

## Logic

| Behaviour | Rule |
| --- | --- |
| Judging a reading | Against the personal normal and flight-adjusted limits in `lib/judge.ts`, simplified from rules R1 to R12. |
| One odd reading | Spot readings out of range once show Repeat reading; a confirming reading makes it Caution or Warning (SH6). Readings dangerous on their own, such as blood oxygen below 90%, skip the repeat. |
| Old readings | Older than the maximum age shows No recent data, never green (SH8). |
| Place | Set by the mission day. The standing test and the balance test are Unavailable in the spacecraft (SH4). The radiation review line is 0.9 mSv/day on the surface and 1.3 mSv/day in free space. |
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
- [x] The doctor opens from every screen in one tap and starts with a read of today's results.
- [x] Urgent words are handed to the medical lead, never answered by the doctor; checked by tests.
- [x] In the flight system the standing test shows Unavailable with its reason (SH4).
- [x] No NASA insignia in the app.
- [ ] The doctor's wording is reviewed by someone with medical training.
- [ ] Three outsiders reach the right next action in under three minutes using only the app (H3).

## Open points

- **Radiation late in the mission.** With the published dose rates the total passes the 600 mSv career limit around day 460; from then on radiation stays at Warning.
- **Maximum ages and review bands** are our own values.
