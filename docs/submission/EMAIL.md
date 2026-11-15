# Submission email (NASA Space Apps Heilbronn)

Due: **today, Sun 15 Nov 2026, 15:00**. One email per team. Only a team member sends it.

Pick version A or B. Copy everything between the lines of that version.
Team name and members are taken from the title slide of `docs/demo/deck.html` (Team TUM: Jakob Friedrich, Lukas Fuchs, Mohit Nandanwar, Patryk Ostern). Mohit confirms them before sending.

| | Version A: proven limits only | Version B: + AI family call |
|---|---|---|
| Code branch | `phase-limits` (pushed, b3c57e9) | `family-call` (435ca1d + submission commits, **not pushed**) |
| Project link works now? | Yes (200, no login) | No: 404 until `family-call` is pushed |
| Demo link | Old deck on `phase-limits` works now, but has **no team or member names**. The new fallback deck with names needs `family-call` pushed. | `orbit-demo.pdf` on `family-call`, 7 slides, with names |
| Tests | 112 pass | 158 pass |
| Needs a push (Mohit's yes) | Only for the deck with names | Yes |

Both versions get the best demo link only after `family-call` is pushed. Without a push, version A uses the old deck.

---

## Version A

**To:** harasgarzondiaz@gmail.com
**Subject:** Space Apps Heilbronn 2026 submission: ORBIT (Team TUM)
**Attachments:** none needed. Optional backup: `docs/demo/orbit-demo-fallback.pdf`.

Hi Sarah,

Here is our team's submission.

**Team name:** Team TUM
**Members:** Jakob Friedrich, Lukas Fuchs, Mohit Nandanwar, Patryk Ostern

**Project title:** ORBIT

**NASA challenge:** Create Health Monitoring Software for Astronauts on Space Missions
https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/

**What we built**

ORBIT is health monitoring software for astronauts on long missions such as Mars. It judges each astronaut against their own normal for the current mission phase (outbound, on Mars, return, back on Earth), not against Earth's fixed medical limits. In space the body changes: core temperature runs about 1 °C higher, and after landing the heart runs fast for days. Earth's limits then raise false alarms for healthy crew, and a crew that gets false alarms stops trusting them. ORBIT shows a body map, trend charts and one plain next action for each finding, written for a crew member with about 40 hours of medical training, and works with no contact with Earth.

**How we used NASA data**

NASA's UTMB head-down bed-rest study (NASA Life Sciences Portal, DOI 10.83263/wjw1-ta27: 29 volunteers, 2,184 days of daily vital signs) is the core of the project:

1. It sets the expected change and the allowed spread for each mission phase.
2. We replayed it with the same two-day rule on both sides: Earth's limits raised an alarm on 13.5% of days, ORBIT on 5.9% (2.3 times fewer).
3. We planted known problems into the same data. ORBIT caught 94% of +1 °C fevers (Earth's limits: 8%) and 93% of +20 bpm heart-rate rises (Earth: 20%). Earth's limits do better on small blood-pressure rises (50% against 26%), and we show that too.

We also used NASA's Human Research Program hazards and 17 risks, NASA-STD-3001 and NASA OCHMO technical briefs. 112 automated tests reproduce the numbers, and a separate Python script rechecks all 65 planted-problem results.

Limits: bed rest is a ground stand-in for flight; the in-flight temperature rise comes from an ESA/Charité study of ISS crew; Mars values are estimates. ORBIT is a prototype, not a medical device.

**Project link (GitHub repository):**
https://github.com/jakobtfr/orbit/tree/phase-limits

**Demo (7 slides, PDF):**
https://github.com/jakobtfr/orbit/blob/family-call/docs/demo/orbit-demo-fallback.pdf
(If `family-call` is not pushed, use instead: https://github.com/jakobtfr/orbit/blob/phase-limits/docs/demo/orbit-demo.pdf — it opens, but shows no team names.)

Use of AI: we used an AI coding assistant (Claude) to help write code, tests and documentation. The team chose the challenge, framed the problem and made the product decisions.

Best regards,
Mohit Nandanwar, for Team TUM

---

## Version B

**To:** harasgarzondiaz@gmail.com
**Subject:** Space Apps Heilbronn 2026 submission: ORBIT (Team TUM)
**Attachments:** none needed. Optional backup: `docs/demo/orbit-demo.pdf`.

Hi Sarah,

Here is our team's submission.

**Team name:** Team TUM
**Members:** Jakob Friedrich, Lukas Fuchs, Mohit Nandanwar, Patryk Ostern

**Project title:** ORBIT

**NASA challenge:** Create Health Monitoring Software for Astronauts on Space Missions
https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/

**What we built**

ORBIT is health monitoring software for astronauts on long missions such as Mars. It judges each astronaut against their own normal for the current mission phase (outbound, on Mars, return, back on Earth), not against Earth's fixed medical limits. In space the body changes: core temperature runs about 1 °C higher, and after landing the heart runs fast for days. Earth's limits then raise false alarms for healthy crew, and a crew that gets false alarms stops trusting them. ORBIT shows a body map, trend charts and one plain next action for each finding, written for a crew member with about 40 hours of medical training, and works with no contact with Earth.

ORBIT also has an opt-in family call. At Mars distance a signal takes about 4 to 24 minutes one way, so a live call home is not possible. Family and friends who opt in record a short message each day, and ORBIT plays it as a call in the astronaut's off-duty time. The call is always labelled AI. When a reading is off, the call also carries one health prompt, read word for word from ORBIT's fixed rules. No language model takes part in the call. Urgent words end the call and name the crew's medical lead. Our next step, not built yet: a real-time conversational call in the family member's own cloned voice, made only with that person's consent. Today the call plays recorded lines in synthetic voices.

**How we used NASA data**

NASA's UTMB head-down bed-rest study (NASA Life Sciences Portal, DOI 10.83263/wjw1-ta27: 29 volunteers, 2,184 days of daily vital signs) is the core of the project:

1. It sets the expected change and the allowed spread for each mission phase.
2. We replayed it with the same two-day rule on both sides: Earth's limits raised an alarm on 13.5% of days, ORBIT on 5.9% (2.3 times fewer).
3. We planted known problems into the same data. ORBIT caught 94% of +1 °C fevers (Earth's limits: 8%) and 93% of +20 bpm heart-rate rises (Earth: 20%). Earth's limits do better on small blood-pressure rises (50% against 26%), and we show that too.

We also used NASA's Human Research Program hazards and 17 risks and its evidence report on behavioural health (contact with family supports crew well-being), NASA-STD-3001 and NASA OCHMO technical briefs. 158 automated tests reproduce the numbers and check the call's rules, and a separate Python script rechecks all 65 planted-problem results.

Limits: bed rest is a ground stand-in for flight; the in-flight temperature rise comes from an ESA/Charité study of ISS crew; Mars values are estimates. The family call is not yet tested with crews or families. ORBIT is a prototype, not a medical device.

**Project link (GitHub repository):**
https://github.com/jakobtfr/orbit/tree/family-call

**Demo (7 slides, PDF):**
https://github.com/jakobtfr/orbit/blob/family-call/docs/demo/orbit-demo.pdf

Use of AI: we used an AI coding assistant (Claude) to help write code, tests and documentation. In the demo, the family members are invented, and all their voices are AI-generated speech made with the open model Kokoro-82M; every voice is labelled AI on screen and in each audio file. The team chose the challenge, framed the problem, came up with the family call and made the product decisions.

Best regards,
Mohit Nandanwar, for Team TUM

---

## Before you send

1. Push the branch the version needs (only after Mohit says yes).
2. Open the project link and the demo link in a private window. Both must open without login.
3. If jakobtfr merges PR #1 and turns on Pages first: you may add `Live app: https://jakobtfr.github.io/orbit/`, but only after it loads (404 at 13:40).

## Link check, 15 Nov 13:40, no login

| Link | Status |
|---|---|
| github.com/jakobtfr/orbit/tree/phase-limits | 200 |
| …/blob/phase-limits/docs/demo/orbit-demo.pdf | 200 (old deck, no names) |
| …/tree/family-call | 200 (rechecked 13:48, head a73d8f4) |
| …/blob/family-call/docs/demo/orbit-demo.pdf | 200 (rechecked 13:48) |
| …/blob/main/docs/demo/orbit-demo.pdf | 404: main deleted `docs/demo` |
| jakobtfr.github.io/orbit | 404: Pages off |
| Space Apps challenge page | 200 |
