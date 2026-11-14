# ORBIT Spec, Version 2

Written 2026-11-14, rewritten the same day to match the app as built. What the app contains, how the screens connect, and the data and logic behind them.

**How to use this file.** This file says *what* each screen contains and does. [`DESIGN.md`](DESIGN.md) says *how* it looks and reads. If they disagree, `DESIGN.md` wins on look and wording, this file wins on content and behaviour. The reasons behind the product are in [`solution-overview.md`](docs/solution/solution-overview.md); the science rules (SH1 to SH10) are in [`scientific-constraints.md`](docs/research/scientific-constraints.md).

**What changed from version 1.** The 3D body became an anatomical body map on a three-column personal dashboard, styled after apple.com. The Flight, Sources, and Crew screens and the orbit model were removed. Replay, Measurements, and Mental Health were added. The emergency first-aid flow was replaced by a virtual doctor the viewer can talk to about their own results, opened from a button at the top right of every screen. The `SIMULATED` tag was removed.

## The one idea

ORBIT judges each reading against the astronaut's own normal, not Earth's. The app shows this twice: in the product, where indicator charts draw Earth's limit next to the personal one, and as evidence, where real NASA bed-rest data is replayed through both rule sets (with the same two-day rule, 13.5% of days with an alarm under Earth limits, 5.9% under personal rules). Every screen should support that idea or get out of its way.

## Scope

| In | Out |
| --- | --- |
| A front end that runs in the browser with no server or network | Accounts, login, a real server |
| One astronaut, Lena Brandt, seen from her own point of view | Switching between crew members |
| Scripted readings for Lena; real NASA UTMB bed-rest data in Replay | Real device connections |
| A simulated doctor that talks about the viewer's own results, by voice or text | A doctor that examines the camera picture |
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
Navigation: Dashboard · Measurements · Resources · Mental Health

Dashboard ──► Region ──► Indicator ──► Measure
    │    └──► Muscle group
    ├──► Check-in
    └──► Replay
Mental Health
Call the doctor (a pop-up, from the Dashboard prompt or the header)
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
| Resources | `#/resources`, `#/resources/:id` | How do I do this, step by step? |
| Mental Health | `#/mental-health` | How am I feeling, privately? |
| Replay | `#/replay` | Does judging against my own normal really matter? |
| Call the doctor | pop-up, no route | Something is off: what do I do about it? |

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

**Risks & checks.** Only what needs the viewer today, in this order: risks at Warning (red), risks at Caution (yellow), then the checks still open today (a reading that is missing or needs repeating, the exercise session if the plan is not met, the daily check-in). A risk opens a call with the doctor; a check goes to where it is done. A check disappears once it is done. Nothing that is in range is listed.

**Trends.** Plots of the last 28 days of resting heart rate, core temperature, and radiation dose rate with their limits and expandable details. Method: [`dashboard-methodology.md`](docs/solution/dashboard-methodology.md).

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
- **Check-in:** four steps: how you feel, symptoms (with where and how bad for pain), mood and how it is going with the crew ("Only you can see these answers."), and a summary with a next action if a symptom was logged. The symptom list includes nausea or motion sickness, injury, and joint pain after suit work. Joint pain after suit work is a Warning with its own action (possible decompression sickness: tell the medical lead now).

### Measurements

Lena's own measurements, for exploring the record. A list of every indicator, grouped by part of the body, with the latest value and status. Choosing one draws its trend for 7, 28, or 90 days, or the whole mission, using the same chart as Indicator: her readings, her normal, her personal limit, and the Earth cutoff where one exists. The footer shows the latest value, how many readings fall in the window, and the change from before flight. "Open this measurement" goes to that indicator. CSV export covers every measurement in the window. The NASA bed-rest comparison stays on Replay.

### Resources

Every procedure on board, stored on the device: what is needed today (one entry for each risk or open check, built from the rules) and how to take each reading. The list shows one card per procedure. A procedure opens as a player: one step at a time, with a progress bar, Back and Next, and arrow keys. See [Resources and the astronaut](#resources-and-the-astronaut).

### Mental Health

Private to the astronaut: mood (1 to 5), energy, an optional journal note, a 60-second breathing timer, and the list of past entries. Entries live in memory and clear on reload. Saving here does not complete the medical check-in.

### Replay

The evidence screen. Built on real, unaltered NASA UTMB bed-rest data.

1. Title "Earth's normal or yours?" and one paragraph on bed rest as a stand-in for weightlessness.
2. **All volunteers:** two tiles with the same two-day rule on both sides, Earth limits 13.5% and ORBIT 5.9% of days with an alarm, with alarms per person in 180 days, and a table of every way of counting (single days 25.5% and 16.5%; stricter Earth 140/90: 5.4%).
3. **One volunteer, day by day:** two featured cases and a list of all 29.
   - *Normal runs high* (UTMB-01): blood pressure 132/80 before bed rest, on Earth's line. Earth 30 alarms on two days in a row (54 on single days), ORBIT 1.
   - *Slow heart-rate rise* (UTMB-40): resting pulse drifts from 55 to about 75. Earth 0 alarms on two days in a row (1 on single days), ORBIT 10.
4. **Player:** play/pause and a day slider; two alarm lanes with counters; a "today" panel showing each vital, the Earth verdict, and the personal verdict, including "Repeat reading" when a value is over the personal limit only once.
5. **Chart** of one vital at a time with Earth's limit, the volunteer's own normal, and their personal limit.
6. The rules, the source DOI, and the limit of the evidence: fewer false alarms, not proof that real problems are caught.

### Call the doctor

A phone call in a pop-up over whatever screen is showing, with a blurred backdrop. It can be minimised to a bar in the corner, which leaves the screen free to use, and expanded again. There is no doctor page.

**How a call opens and is led.** A call opened on a problem (the Dashboard prompt, a procedure page) starts with that problem. A call opened from the header starts neutral: "What is the problem?", with the problems the readings point to offered as answers to tap, plus "Something else" and "Just check my results". Picking one makes the call about it. From there the doctor leads: each answer ends with one question or one action, and the answers offered under its words change with what it asked (the built-in ones, or `[[options: A | B | C]]` from the language model). The doctor says what is most likely and what that is based on, as a recommendation from the resources on board that the medical lead checks over later; it does not answer that it cannot diagnose. While a procedure is in hand, the model moves it on from what the viewer says (`[[next]]`, `[[step:N]]`, `[[finish]]`), so a step they report as done is not asked for again.

**Procedures.** The doctor opens each call with a short list of what it means to get done: what is needed today and how to take those readings again. The list is not shown. The doctor goes through a procedure when the viewer says "start" or names one ("walk me through blood pressure"), when the language model decides it is the next thing to do (it ends its answer with `[[start:id]]`, which the app acts on and hides), or from "Go through it with the doctor" on a procedure page. The astronaut then acts out each step inside the pop-up while the doctor reads it. One button under the step marks it done and moves on. "Next" or "done", "back", "repeat", and "stop" also work by voice or typing. The steps are read by the app, not written by the model. Whatever the doctor did shows as a note under its words: "Going through: Blood pressure", "Blood pressure: step 2 of 2", "Done: Blood pressure", next to the existing "Saved" note for a reading. While a call is on, the header button reads "On a call with the doctor".

1. **Prompt.** When a reading is confirmed out of range or a symptom was logged, the Dashboard opens with a small alert: what needs attention, the finding in one line, "Call the doctor", the usual next action (such as "Repeat reading"), and an X. It appears once per session. The call also opens from "Talk to the doctor" in the header, from the item in Risks & checks, and from the indicator's screen.
2. **Call.** It rings for about two seconds, then connects with voice and camera on. The pop-up shows the doctor, the call time, its state (Speaking, Thinking, Listening), what it is saying as a caption, and the viewer's camera in the corner. Controls: mute, camera, type instead of speaking, end call.
3. **What it is about.** A call opened from a finding starts with that finding and the first question. Nothing is written per condition: the finding and next action come from the rules in `judge.ts`, and the doctor is given one general way of helping with anything the viewer raises, measured or not (a rash, a bump, a pain): ask, look, one practical step at a time, re-check, say when to tell the medical lead.
4. **Seeing.** When the model can read pictures and the viewer shows something or asks it to look, one still picture from the camera goes with that message. Otherwise no picture is sent.
5. **Readings said aloud** ("it says 106 over 68 now") are saved as a self-reported reading and judged at once, so the doctor can say whether it is back in range.
6. **Who answers.** When [Ollama](https://ollama.com) is running on the same machine, answers are written by its language model (`app/src/lib/localModel.ts`), which is given the readings, their status, and the findings and told to use nothing else. Without it, built-in answers are used (`app/src/lib/doctor.ts`). The opening and the answer to urgent words (chest pain, cannot breathe, fainting) are always built in: stay still and call the medical lead now.

The doctor is simulated and its wording has not been reviewed by a clinician. The model, the pictures, and the readings stay on the device. The doctor answers in one or two short sentences, in a neutral tone, spoken at 1.2 times the normal pace. The voice (Google US English in Chrome) and speech recognition are the browser's and may work online.

### Body map colours and muscle screens

The body map is coloured by status: each part takes the worst status of its health region and of the indicators watched for it (for the legs, hips and back that includes exercise and bone protection). The status shape is shown in the caption on hover, in the list of groups, and in a legend under the figure. A muscle screen shows that status, how the part fares without gravity, everything ORBIT watches that bears on it (symptoms, the region's indicators, and its own), and how it is trained. Nothing is measured per muscle; the screen says so.

### Resources and the astronaut

One tab, **Resources**, holds every procedure on board: what is needed today (one entry for each risk or open check, built from the rules) and how to take each reading. Each opens as a player with one step at a time. Every step is acted out by a small animated astronaut: resting, drinking, taking a reading, calling on the radio, exercising, sheltering. The picture is chosen from the wording of the step, The same astronaut appears beside the current step in each Next action card. When the last step of a Next action is done, the card goes away and the action is listed under "Done today" in Resources, where "Do again" brings it back; on the Dashboard its risk row shows "Steps done today" until the reading is back in range. With reduced motion the astronaut holds the pose and does not move.

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
| Spaceflight risks | `lib/risks.ts` maps all 17 risks named by NASA's Human Research Program (https://www.nasa.gov/hrp/risks/) to what ORBIT measures or asks: indicators, check-in symptoms, or the private mood and crew answers. There is no risks screen. A next action names the risk its finding bears on, the doctor is told which risks have a finding behind them, and two low crew answers in a row give a private note at the end of the check-in. Decompression sickness, injury during suit work, and injury at launch and landing rest on check-in symptoms only. Hearing maps to no HRP risk. |
| Replay | `lib/replay.ts`: Earth cutoffs and personal rules, each on single days and on two days in a row. Tests reproduce 13.5% vs 5.9% (same rule), 25.5% vs 16.5% (single days), and 5.4% for 140/90. |

## States every screen must handle

- **All in range:** quiet, with small green shapes only.
- **Needs attention:** status shapes and words, and one next action.
- **Nothing to show:** an empty line, never a blank area.
- **Private:** mood and journal entries are never shown outside Mental Health and the check-in.
- **Keyboard focus:** a visible ring on every control, in a sensible order.
- **Reduced motion:** no transitions, no flashing, no filling animation; the Resources pictograms stand still.

## Done when

- [x] The Dashboard shows the bed-rest comparison in one card and links to Replay.
- [x] Replay reproduces 13.5% vs 5.9% with the same two-day rule, plus the single-day and 140/90 figures, from the raw data, checked by tests.
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
