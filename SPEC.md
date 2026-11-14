# ORBIT Spec, Version 1

Written 2026-11-14. What to build for the first version of ORBIT: the screens, the components, how they connect, and the fake data behind them.

**How to use this file.** This file says *what* each screen contains and does. [`DESIGN.md`](DESIGN.md) says *how* it looks and reads. Build from both. If they disagree, `DESIGN.md` wins on look and wording, this file wins on content and behaviour. The reasons behind the product are in [`solution-overview.md`](docs/solution/solution-overview.md); the science rules (SH1 to SH10) are in [`scientific-constraints.md`](docs/research/scientific-constraints.md).

## Scope

Version 1 is a front end only. It must look and behave like the real product on scripted data.

| In | Out |
| --- | --- |
| All ten screens below, connected and clickable | A real server, accounts, or login |
| A 3D body as the home screen | Real device connections |
| Fake data loaded from local files | Real health logic beyond the few rules in [Fake logic](#fake-logic) |
| One complete emergency scenario | More than one emergency scenario |
| One dark theme, tablet and desktop | Light theme, phone layout, translations |
| A demo panel to change mission day and place | Notifications, gamification, sound |

**Build assumptions.** A single-page web app that runs in a browser with no network. Designed for a tablet in landscape (1024 × 768) and scaling up to a laptop (1440 × 900). Touch first; everything also works with mouse and keyboard. The framework is the builder's choice.

## Guiding principles

The five design principles in `DESIGN.md` decide every screen. In this spec they mean:

| Principle | What it means for the build |
| --- | --- |
| **D1** Quiet until something needs attention | A healthy person's body and tiles are greyscale. Nothing is marked on the body unless it needs attention. |
| **D2** Colour carries meaning | Status colours appear only on status shapes, labels, and limit arrows. |
| **D3** Hierarchy through brightness | The one value or action a screen is about is the brightest thing on it. |
| **D4** One job per screen | Every screen below has one question it answers and at most one primary button. |
| **D5** Never colour alone | Every status is a colour, a shape, and a word together, including on the 3D body. |

## Words used in this spec

- **Indicator:** one thing ORBIT watches, such as heart rate or sleep.
- **Reading:** one value of an indicator at one time.
- **Status:** one of the six states in `DESIGN.md`: In range, Caution, Warning, No recent data, Unavailable, Repeat reading.
- **Region:** a part of the 3D body that groups indicators.
- **Viewer:** the crew member using the app. **Selected person:** the crew member whose health is on screen.

## Screen map

```
Top bar (on every screen): ORBIT · mission time · place · viewer · Emergency

Crew ──► Body ──► Region ──► Indicator ──► Measure
          │                      
          ├──► Check-in
          └──► Before flight
Flight
Sources
Emergency (from the top bar, any screen)
```

| # | Screen | The question it answers | Primary button |
| --- | --- | --- | --- |
| 1 | Crew | Who needs attention? | None |
| 2 | Body | Where does this person need attention? | The top next action, or "Start check-in" |
| 3 | Region | What is watched in this part of the body? | None |
| 4 | Indicator | Is this reading normal for me? | The next action, if there is one |
| 5 | Measure | How do I take this reading? | "Save reading" |
| 6 | Check-in | How do I feel today? | "Next", then "Finish check-in" |
| 7 | Before flight | What were my values on Earth? | None |
| 8 | Flight | Where are we, and which checks apply here? | None |
| 9 | Sources | Where does each rule come from? | None |
| 10 | Emergency | What do I do right now? | The current step's action |

The app opens on **Body** for the viewer.

## App shell

Present on every screen except inside the emergency flow.

**Top bar**, left to right:

1. The mark and wordmark. Tapping it goes to Body for the viewer.
2. Mission time as a tag: `MET 100/08:15:00`.
3. Place as a tag: `SPACECRAFT`, `STATION`, `SURFACE BASE`, or `AFTER LANDING`.
4. Viewer name and role. Tapping it opens a list to switch viewer (demo only; there is no login).
5. **Emergency** button: Secondary style, with a diamond shape in `status-warning` before the word. This is the one place a status colour is used outside a status. Always visible, same position on every screen.

**Navigation**, four items with icon and label: Crew, Body, Flight, Sources. The current item uses `accent`.

**Demo banner.** A single line under the top bar on every screen: "Demo data. Replayed from ground studies or simulated. Not flight measurements." In `body-sm`, `text-muted`. It cannot be dismissed (SH5, SH10).

## Screens

### 1. Crew

Shows every crew member side by side.

- A grid of **crew cards**, one per person (four in the demo). Each card: name, role, overall status (shape and label), a count line such as "2 need attention", and time of last check-in.
- Tapping a card opens that person's Body.
- The viewer's own card comes first and is labelled "You".
- **Overall status** is the most serious status among the person's indicators, in this order: Warning, Caution, Repeat reading, No recent data, In range. Unavailable is ignored.
- All in range: every card is greyscale apart from a small green circle.

**Who sees what.** The viewer sees their own full record. The medical lead sees everyone's full record. Any other viewer opening a crewmate sees the overall status and the Body with only shared indicators marked, plus one line: "Other details are private to [name] and the medical lead." Mood is never shown to anyone but its author. In the emergency flow, the patient's full record is open to whoever responds.

### 2. Body

The home screen. One person's health as a map.

**Layout:** the 3D body in the centre, a region list on the left, "beside the body" tiles on the right, the next-action card below.

**The 3D body**

- A plain, neutral human figure with no face or clothing detail, in greyscale on `bg-canvas`. It can be turned left and right by dragging; two buttons, "Front" and "Back", snap it. It does not turn on its own.
- Five regions: **Head**, **Chest**, **Skin**, **Hips and spine**, **Whole body**.
- A region gets a **marker** only when its most serious status is Warning, Caution, Repeat reading, or No recent data. A marker is the status shape plus the status word, attached to the region with a thin line. Regions in range have no marker.
- Tapping a region or its marker opens the Region screen. A hovered or focused region gets an `accent` outline.
- If the device cannot show 3D, show a flat front-view figure with the same regions, markers, and taps.

**Region list.** The five regions as rows: name, status shape, status word. This is the keyboard and screen-reader path to everything the body does, and it shows green circles for regions in range.

**Beside the body.** Four status tiles for things with no place on the body: Sleep, Radiation, Cabin air, Exercise. Plus one row, "Mood (private)", shown only when the viewer is the selected person.

**Next-action card.** Shows the single most important action for this person. If nothing needs attention, the card is replaced by one line, "Everything is in range", and the primary button is "Start check-in" (or "Check-in done today" as plain text once completed).

**Other links.** Quiet buttons: "Before flight" and "All indicators" (opens Region for Whole body with every indicator listed).

### 3. Region

- Title: the region name.
- One short paragraph, `body`, max 640 px: what is watched here and why it matters in space. Text comes from the fake data.
- A grid of **status tiles**, one per indicator in the region, most serious first.
- Tapping a tile opens the Indicator screen.

### 4. Indicator

Top to bottom:

1. Indicator name as the screen title.
2. The latest value in `reading-xl` with unit and limit arrow, then the status shape and word, then tags: provenance, confidence, rule ID, age of the reading, and source device.
3. **Compared with you:** two rows, "Before flight" and "Your last 7 days", each with a value and the difference from the latest reading.
4. **Next-action card**, only when the status calls for one.
5. **Chart:** from before flight to today, following the chart rules in `DESIGN.md`. A vertical line marks launch. Range buttons: 7 days, 30 days, Whole mission.
6. **Why it matters in space:** one paragraph.
7. **Readings:** a table of the last ten readings: time, value, provenance, source.
8. Quiet buttons: "How to measure" (opens Measure) and "Source" (opens Sources at this rule).

Special cases:

- **Unavailable:** the value area says "Not available here" and gives the reason, such as "The standing test needs gravity." No chart button, no Measure link.
- **No recent data:** the last value is shown in `text-muted` with its age; the next action is "Take a reading".
- **Modelled value:** a line under the value says "Estimated, not measured." A modelled value never shows Warning (SH5).

### 5. Measure

Explains how to take a reading and records one.

1. Title: "Measure [indicator]".
2. **Where it comes from:** one line. Either "Arrives on its own from [device]" with the time of the last arrival, or "Entered by hand".
3. **Steps:** a short numbered list in `body-lg`, three to five steps.
4. **Context:** two choices the reading is stored with: activity (Resting, During exercise, After exercise) and time, pre-filled with now (SH7).
5. **Value input** with its unit, and the primary button "Save reading".

After saving, return to Indicator with the new reading shown.

### 6. Check-in

Four steps, one per screen, with a step counter ("2 of 4") and a Back button. It should take under two minutes.

| Step | Question | Input |
| --- | --- | --- |
| 1 | How do you feel today? | Three large choices: Fine, Not quite right, Unwell |
| 2 | Any symptoms? | Chips, choose any: Headache, Skin rash, Cold or cough, Pain, Trouble sleeping, Dizziness, Stomach or digestion, Vision change, Other, None. Choosing Pain asks "Where?" with the five regions and a 0 to 10 scale. |
| 3 | How is your mood? | A 1 to 5 scale. Under it: "Only you can see this." |
| 4 | Summary | What was logged, each with a `SELF-REPORTED` tag, and a next-action card if a symptom was chosen |

Primary button: "Next" on steps 1 to 3, "Finish check-in" on step 4. Finishing returns to Body. A logged symptom marks its region on the body.

### 7. Before flight

A plain table of the selected person's values measured on Earth: indicator, value, date, and how many readings it is based on. One line at the top explains why it exists: "Your readings in flight are compared with these."

### 8. Flight

- **Mission:** mission day, phase (Launch, Cruise, Surface, Return), and place.
- **Cabin:** status tiles for carbon dioxide and radiation dose rate.
- **Checks here:** two lists, "Available here" and "Not available here", each item with a one-line reason.
- **Demo controls**, in a clearly separated box titled "Demo controls": a mission-day slider (0 to 900), a place selector, and a "Reset demo" button. Changing either updates every screen at once.

### 9. Sources

A table of the rules R1 to R12: rule ID, indicator, where the limits come from, confidence. Content is taken from [`clinical-thresholds.md`](docs/research/clinical-thresholds.md#rule-table). A line at the top: "Colour bands were made for this prototype and have not been reviewed by a clinician."

### 10. Emergency

Follows the Emergency flow rules in `DESIGN.md`. The app shell is replaced by the warning header.

1. **Who needs help?** The crew as large buttons.
2. **What is happening?** One choice is fully built: "Chest pain or collapse". Others are listed as "Not in this version".
3. **Steps,** one per screen. Each has the instruction in `title-2`, one supporting line, and one primary button ("Done, next"). Completed steps stay listed above in `text-muted`. A timer in `tag` style shows time since the flow started.
4. **Patient panel,** always visible at the side: the patient's latest heart rate, blood pressure, blood oxygen, and before-flight values.
5. **End:** a summary of steps and times, and a button "Close and return to Body".

A quiet "Leave emergency" link is always present and asks for confirmation.

The step text is draft content. It must be replaced with a recognised first-aid protocol and a source before the demo (SH9).

## Components

Defined in `DESIGN.md`: status tile, tags, buttons, next-action card, chart, emergency header. New in this spec, built from the same tokens:

| Component | Used on | Description |
| --- | --- | --- |
| Top bar | All | `bg-surface`, 56 px high, `border-subtle` below |
| Navigation | All | Four items, icon above label, 44 px targets |
| Demo banner | All | One line, `body-sm`, `text-muted` |
| Crew card | Crew, Emergency | `bg-surface`, `border`, `radius-md`; name in `title-3`, role in `label` |
| Body figure | Body | Greyscale 3D figure; regions are the touch targets |
| Region marker | Body | Status shape and word on `bg-raised` with `border`, joined to the region by a 1 px `border-control` line |
| Region list | Body | Rows of name, shape, word; 44 px high |
| Compare row | Indicator, Before flight | Label in `label`, value in `reading`, difference in `data` |
| Readings table | Indicator | `data` text, `border-subtle` row lines |
| Step header | Check-in, Measure | Step counter in `tag`, question in `title-2` |
| Choice button | Check-in, Emergency | Large Secondary button; selected state has an `accent` outline |
| Chip | Check-in | `radius-full`, `border`; selected has an `accent` outline and a check mark |
| Scale | Check-in | A row of numbered choice buttons |
| Empty line | Any | One sentence in `body`, `text-secondary`, where a list has nothing in it |

## Indicators in version 1

| Indicator | Region | Rule | Source shown | Provenance |
| --- | --- | --- | --- | --- |
| Heart rate | Chest | R1 | Smart shirt | Measured |
| Blood pressure | Chest | R2 | Smart shirt | Measured |
| Standing blood pressure test | Chest | R3 | Entered by hand | Measured |
| Blood oxygen | Chest | R5 | Smart shirt | Measured |
| Body temperature | Whole body | R4 | Entered by hand | Measured |
| Weight | Whole body | R10 | Body mass device | Measured |
| Vision check | Head | R12 | Entered by hand | Self-reported |
| Symptoms | By region | None | Check-in | Self-reported |
| Bone load | Hips and spine | R9 | Estimated from exercise | Modelled |
| Sleep | Beside the body | R6 | Wrist tracker | Measured |
| Exercise | Beside the body | R9 | Exercise machines | Measured |
| Radiation | Beside the body | R8 | Radiation monitor | Measured |
| Cabin air | Beside the body | R11 | Cabin monitor | Measured |
| Mood | Beside the body, private | R7 | Check-in | Self-reported |

In the demo every value also carries the `SIMULATED` tag in place of its normal provenance, because no reading comes from a real flight.

## Fake data

All data is local files loaded at start. No server calls.

- **Crew:** four invented people with a name, a role, and one marked as medical lead. Do not use real astronauts' names.
- **Before-flight values:** per person, per indicator.
- **Readings:** per person, per indicator, daily from 30 days before launch to mission day 100. Heart rate, blood pressure, temperature, and weight may be replayed from `data/utmb/daily_vitals.csv`; the rest is invented.
- **Text:** per indicator: why it matters in space, how to measure, and next-action wording. Per region: the intro paragraph. Per rule: source and confidence.
- **Flight:** mission day, phase, place, cabin values.

Each indicator's status may be stored in the data instead of calculated, except where [Fake logic](#fake-logic) says otherwise.

### Demo crew

The four people are scripted so that every state appears somewhere.

| Person | What their data shows | What it proves |
| --- | --- | --- |
| A, the viewer by default | Everything in range. Temperature is 38.0 °C against a personal 37.8 °C on mission day 100, shown as In range. | The quiet screen (D1); no false fever alarm (SH2) |
| B | Heart rate rising slowly for 30 days: Caution on Chest. One reported headache: marker on Head. | Trend against before-flight values (SH3); symptoms on the body |
| C | One blood pressure reading of 145/92 with no symptoms: Repeat reading. Weight not measured for 12 days: No recent data. | Repeat instead of alarm (SH6); old data is not green (SH8) |
| D, medical lead | Sleep under 6 hours for three nights: Caution. Bone load shown as estimated. | Trends; modelled values (SH5); the medical lead's view of everyone |

## Fake logic

Only these behaviours are calculated live. Everything else is read from the data.

| Behaviour | Rule |
| --- | --- |
| Saving a reading outside its limits | Status becomes Repeat reading. A second out-of-range reading makes it Caution. An in-range reading returns it to In range. |
| Moving mission day forward | Any indicator whose latest reading is older than its maximum age becomes No recent data. |
| Changing place | Standing blood pressure test is Unavailable in Spacecraft and Station, available in Surface base and After landing. |
| Finishing a check-in | Logged symptoms appear on the body and in the region; the check-in shows as done for that mission day. |
| Switching viewer | Applies the "who sees what" rules. |
| Overall status | The most serious status, as defined under Crew. |

Maximum ages for the prototype (our own choice, not sourced): cabin air 1 hour; heart rate, blood pressure, blood oxygen, temperature, sleep, exercise, radiation 1 day; weight 7 days; vision check 30 days.

## States every screen must handle

- **All in range:** greyscale apart from small green shapes and the accent.
- **Needs attention:** markers, tiles, and one next action.
- **Nothing to show:** an empty line, never a blank area.
- **Private:** the privacy line in place of hidden content.
- **Keyboard focus:** a visible `accent` ring on every control, in a sensible order.
- **Reduced motion:** no transitions, no flashing.

## Done when

**Flows**

- [ ] From opening the app, the viewer can reach any indicator's detail in three taps: region, tile, done.
- [ ] A check-in can be completed in under two minutes and its symptom appears on the body.
- [ ] The emergency flow can be started from every screen in one tap, and the first step is on screen within three taps.
- [ ] Changing mission day or place in Flight changes what Body and Indicator show.
- [ ] Switching viewer changes what is visible for a crewmate, and mood is never visible to anyone else.

**Science rules visible in the UI**

- [ ] Every value shows a provenance tag; every status shows a confidence tag and rule ID (SH1, SH5).
- [ ] Person A's 38.0 °C shows In range (SH2).
- [ ] Person C's single high blood pressure shows Repeat reading, not Caution or Warning (SH6).
- [ ] Person C's weight shows No recent data, not green (SH8).
- [ ] In Spacecraft, the standing test shows Unavailable with its reason; in Surface base it is available (SH4).
- [ ] No guidance text names a diagnosis as fact (SH9).
- [ ] The demo banner is on every screen (SH10).

**Design**

- [ ] Every item under Checks in `DESIGN.md` passes on every screen.
- [ ] Each screen has at most one primary button (D4).
- [ ] The body shows no marker and no colour for a person with everything in range (D1).
- [ ] Every body marker has a shape and a word, and every region can be reached without the 3D body (D5).

## Open points

- **Who sees what** follows the proposal in the solution overview and is not yet confirmed.
- **Emergency step text and all guidance wording** are drafts until each has a source.
- **The Emergency button** uses a status colour outside a status. Add this exception to `DESIGN.md` or change the button.
- **Maximum ages** are our own values.
