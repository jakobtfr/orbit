# High-Level Solution

Written 2026-11-14, extended the same day and updated to match the app as built (see [`SPEC.md`](../../SPEC.md)). What ORBIT solves, how it works at a high level, and the impact it can have. It builds on the problems (P1 to P7) and hypotheses (H1 to H5) in [`problems-and-hypotheses.md`](problems-and-hypotheses.md) and must respect [`scientific-constraints.md`](../research/scientific-constraints.md). Functional requirements come next.

## In one sentence

ORBIT is the crew's onboard health record and guide: it knows each person's values from before flight, collects every measurement from the equipment already on board, judges each one against that person's own normal instead of Earth's, shows on a body map where something is off, and tells a crew member with no medical training what to do next, without waiting for a doctor on Earth.

## What we solve

Today a doctor on the ground notices, judges, and decides. On a Mars-class mission that doctor is over 40 minutes away for every question and answer. ORBIT moves those three steps on board and puts them in the hands of a non-doctor.

| The crew's question | The problem behind it | What ORBIT does |
| --- | --- | --- |
| "Is something wrong with me?" | Most trouble is small, frequent, and felt, not measured (P1). | Asks how you feel every day, and treats that answer as a main signal next to the measurements. |
| "Is this reading normal?" | Earth limits do not fit a body in space (P2). | Judges each reading against your own values from before flight and in flight, with flight-adjusted limits. |
| "Where is the problem?" | The crew are not doctors (P3). | Marks the affected part of a body map, which you can tap to explore. |
| "What do I do now?" | No doctor is in reach (P3). | Gives one clear next action in plain words, with the reason and the source. |
| "My crewmate just collapsed." | A serious emergency is likely once per mission (P4). | Opens a step-by-step first-aid flow from a button on every screen, with each step sourced. |
| "Am I slowly getting worse?" | Bone, eyes, radiation, and sleep decline without symptoms (P5). | Shows trends since before flight and whether sleep and exercise follow the plan. |
| "How is the rest of the crew?" | The crew look after each other; nobody else can (P3, P4). | In an emergency, any crewmate can be chosen as the patient. A crew overview is designed below but not built. |

Two more problems shape the design: mood is private and never shown to the crew (P6), and the rules switch with the environment and mission day (P7).

**What we do not solve.** ORBIT does not diagnose disease, replace the flight surgeon, or prescribe drugs. It adds no new sensors: it uses the equipment the crew already has, plus what they report.

## What ORBIT knows

Three things are loaded before anything is judged.

| What | Contents | Why it is needed |
| --- | --- | --- |
| **You, before flight** | Each person's own values measured on Earth: heart rate, blood pressure, temperature, weight, sleep, eye exam, bone scan, radiation dose from earlier missions. | "Normal" is personal. A slow decline is only visible against where you started (SH3). |
| **The flight** | Mission day, phase (launch, cruise, surface, return), where you are (spacecraft, station, surface base), cabin conditions, and the day's plan for sleep and exercise. | The right checks and limits depend on place and time: the standing test needs gravity, illness clusters in the first month (P7, SH4). |
| **The crew** | Who is on board, their roles, and who is the medical lead. | An emergency is handled by a crewmate, so a crewmate must be able to see the patient's record at once (P4). |

## Where the data comes from

ORBIT's aim is a complete record: every measurement taken on board lands in one place, with nothing typed twice and nothing lost. Readings come from equipment that already flies; the crew adds only what a device cannot know.

| Source already on board | What it gives ORBIT | Evidence it exists |
| --- | --- | --- |
| Bio-Monitor smart shirt | Heart rate and rhythm, blood pressure, breathing, skin temperature, blood oxygen, activity | Canadian Space Agency, on the station |
| Wrist activity tracker | Sleep, movement, light exposure | Artemis II sleep and activity study ([`resources.md`](../challenge/resources.md#3-ongoing-hrp-research)) |
| Ultrasound | Heart and vein scans | NASA, Ultrasound 2 on the station |
| Eye imaging and eye pressure | Changes at the back of the eye | NASA eye-health exams on the station |
| Body mass device | Weight without gravity | NASA, on the station |
| Exercise machines | Exercise done against the plan | [`operations.md`](../research/operations.md#countermeasures-already-in-the-plan) |
| Personal and cabin radiation monitors | Dose per day and in total | [`operations.md`](../research/operations.md#countermeasures-already-in-the-plan) |
| Cabin monitors | Carbon dioxide, air, water, noise | [`operations.md`](../research/operations.md#countermeasures-already-in-the-plan) |
| The crew member | Symptoms, how they feel, mood, food | Daily check-in |

**Complete tracking, shown honestly.** Each indicator shows when it was last measured and from which source. A missing or old reading is shown as missing, never as normal (SH8). Each value is labelled measured, self-reported, modelled, or simulated (SH5).

**For the prototype.** We have no access to flight hardware. Device feeds are replayed from real bed-rest data or simulated, and labelled as such. Which of these devices would fly on a Mars vehicle is not known.

## How it works

One loop runs every day. Most of it is automatic.

| Step | What happens | Why it is built this way |
| --- | --- | --- |
| **1. Collect** | Readings arrive from the onboard equipment. For anything not automatic, ORBIT prompts when it is due and explains how to take it. | The brief asks for prompts and instructions. Automatic collection is what makes the record complete. |
| **2. Check in** | A two-minute set of questions: how you feel, any symptoms. | In our bed-rest data, vital signs were no more abnormal on days with a complaint than on other days. Devices alone miss most events (H1). |
| **3. Judge** | Each reading is compared with your values from before flight, your recent values in flight, and limits adjusted for flight and mission day. One odd reading leads to "repeat", not an alarm. | With the same two-day rule, Earth limits raised an alert on 13.5% of days in healthy volunteers; personal limits on 5.9% (H2). |
| **4. Show** | The body map and the dashboard show where attention is needed. | A non-doctor sees at a glance where to look. |
| **5. Act** | One next action: carry on, repeat, apply a countermeasure, or contact the ground. | A non-doctor needs a decision, not a number (H3). |

Around the loop:

- **Emergency flow.** One tap from the top right of every screen. Fixed steps, one per screen, for chest pain or collapse. It branches on whether the person breathes normally, adapts CPR to weightlessness, cites a guideline for every step, and shows the patient's readings to the crewmate who responds (H4).
- **Trends.** Charts from before flight to today, so slow changes are seen early (H5).
- **Place.** Taken from the mission day. The standing blood pressure test needs gravity, so it is unavailable while the crew is travelling.
- **Replay.** Real NASA bed-rest data judged by Earth's limits and by ORBIT side by side, so anyone can check the core claim (H2).

## What the crew sees

### The dashboard

The home screen is a personal dashboard for the astronaut.

- **Body map.** An anatomical figure, front and back. A region is marked only when it needs attention, with a colour, a shape, and a word together. Tapping a region opens what is watched there and why it matters in space, then each reading against your own normal, then its trend and the source of the rule. Tapping a muscle group explains what it does and links to exercise and bone load.
- **Regions.** Head (headache, vision, thinking), chest (heart, blood pressure, breathing, blood oxygen), skin (rashes), hips and spine (bone and muscle), whole body (temperature, weight).
- **Daily activity.** Exercise against the plan, sleep, resting heart rate, blood oxygen, and one list of risks and checks, each with its next action.
- **Trends.** Trend plots for heart rate, core temperature, and radiation dose rate. Above the plots, the Replay shows one real bed-rest volunteer judged by Earth's limits (30 alarms in 90 days with the same two-day rule) and by their own normal (1).
- **Measurements and Mental Health.** Lena's own measurements, explored against her normal; a private mood, energy, and journal check-in.

The brief suggests a body like this: "a human figure where each part of the body is clickable and displays information about its function and health status."

### The crew (designed, not built)

The app is shown from one astronaut's point of view. The sharing rules below are the design for a crew overview:

- Everyone sees each crewmate's overall status and anything that person has chosen to share.
- The medical lead sees the full record of every crew member.
- In an emergency, the patient's full record opens for whoever responds.
- Mood stays visible only to the person who wrote it.

This follows how agencies work today: medical talks are private, and details reach others only when they affect the mission ([`operations.md`](../research/operations.md#what-happens-on-a-normal-mission)).

### What makes it different

- **Your normal, not Earth's normal.** The yardstick is your own body, starting from before flight.
- **Shown on NASA data.** On NASA bed-rest data, with the same two-day rule on both sides, Earth limits raised an alarm on 13.5% of days, ORBIT's personal rules on 5.9%. The app replays this, and its tests reproduce the numbers.
- **Devices and feelings together.** The equipment gives the numbers; the check-in catches the common problems that numbers miss.
- **Where, then what to do.** A body to see the problem, and one action to handle it, written for someone with about 40 hours of medical training.
- **No new hardware.** It joins up equipment that is already on board.

## Impact

Each line says how solid the claim is.

| Who benefits | Impact | How solid |
| --- | --- | --- |
| Crew, every day | 2.3 times fewer false alarms with the same two-day rule: from 24 to 11 per person per 180 days. Fewer false alarms means the real ones are believed. | Measured on bed-rest data, not in flight. Reproduced in the app's Replay. |
| Crew, every day | A place to catch and handle the roughly 40 minor events expected for a crew of four over three years, most of which devices miss. | Rate from station records; the total is our arithmetic. |
| Crew, every day | Less time spent on health admin, because readings arrive on their own. | Expected, not measured. |
| Crew, in an emergency | A first correct action within one minute, taken by a crewmate with the patient's record in front of them, for the roughly one serious event expected per Mars mission. | Target, not yet tested with people. |
| Crew, long term | Earlier warning of slow harms, seen against values from before flight. | Partly testable on weight data; sleep is simulated. |
| Space agencies | A working example of the onboard decision support NASA says exploration missions need. In NASA's own simulation, better crew decision support cut deaths by at least 34%. | NASA's figure for the concept, not a result of ORBIT. |
| People on Earth | The same idea fits anyone far from a doctor: remote communities, ships, polar stations. The video names this as a goal. | Plausible, not studied by us. No figure yet. |

## Open decisions

- **Crew visibility.** The sharing rules above are our proposal. The alternative is that everyone sees everything, which is simpler but goes against current medical privacy practice.
- **Skin versus core temperature.** The smart shirt measures skin temperature; the space-fever finding is about core temperature. The two must not be compared directly (SH7).

## What has to be true

The solution only matters if the five hypotheses hold. H1 and H2 have first results from the bed-rest data. H3 and H4 need tests with real people this weekend. H5 is partly testable. Details and failure conditions are in [`problems-and-hypotheses.md`](problems-and-hypotheses.md#hypotheses). That the body map makes status easier to read is an assumption we take from the brief, not a tested finding.

## Sources for onboard equipment

- Bio-Monitor smart shirt: https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp
- Ultrasound 2: https://www.nasa.gov/blogs/spacestation/2025/08/21/ultrasound-scans-on-station-monitor-and-protect-crew-cardiovascular-health
- Eye imaging and eye pressure: https://www.nasa.gov/directorates/esdmd/hhp/cardiovascular-and-vision
- Body mass device (SLAMMD): https://en.wikipedia.org/wiki/Human_Research_Facility_1

We read search summaries of these pages, not the full pages.

## Next step

Test H3 and H4 with three outsiders, and have someone with medical training review the emergency steps.
