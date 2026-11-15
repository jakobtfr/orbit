# Submission email (NASA Space Apps Heilbronn)

Due: **today, Sun 15 Nov 2026, 15:00**. One email per team. Nobody sends it except a team member.

Fill in the two `[ ]` fields, then copy everything between the lines.

**To:** harasgarzondiaz@gmail.com
**Subject:** Space Apps Heilbronn 2026 submission: ORBIT ([TEAM NAME])
**Attachments:** none needed (both links open without login). Optional: `docs/demo/orbit-demo.pdf` as a backup copy.

---

Hi Sarah,

Here is our team's submission.

**Team name:** [TEAM NAME]

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
https://github.com/jakobtfr/orbit/blob/phase-limits/docs/demo/orbit-demo.pdf

We used an AI coding assistant (Claude) to help write code, tests and documentation; the team chose the challenge, framed the problem and made the product decisions.

Best regards,
[YOUR NAME], for team [TEAM NAME]

---

## Why these links (checked 15 Nov, 13:25, without login)

| Link | Status | Note |
|---|---|---|
| github.com/jakobtfr/orbit/tree/phase-limits | 200 | Shows the complete README of version A |
| github.com/jakobtfr/orbit (main) | 200 | Main does not have PR #1 yet: old README, no demo folder |
| …/blob/phase-limits/docs/demo/orbit-demo.pdf | 200 | GitHub shows the PDF in the browser |
| …/blob/main/docs/demo/orbit-demo.pdf | **404** | Main deleted `docs/demo` |
| jakobtfr.github.io/orbit (live app) | **404** | Pages is off; only the repo owner can turn it on |

If jakobtfr merges PR #1 before you send: replace `tree/phase-limits` with the plain repo link and `blob/phase-limits` with `blob/main`. If Pages goes live too: add `Live app: https://jakobtfr.github.io/orbit/`. Open each link again in a private window before you send.

## Version B (family call)

Only if the family-call branch is pushed, tested, and the deck shows it before about 14:30. Then add this paragraph after "What we built" and change both links from `phase-limits` to `family-call`:

> Optional AI family call: family and friends who opt in record daily messages. A live call is impossible at Mars distance, so ORBIT plays the recordings as a call in the astronaut's off-duty time. Every call is labelled AI. An AI voice only links the recordings. Every health sentence in the call comes word for word from ORBIT's fixed rules, never from a language model, and urgent words end the call and point to the medical lead.

And replace the AI sentence with:

> We used an AI coding assistant (Claude) to help write code, tests and documentation. In the product, the optional family call uses an AI voice to link real recorded messages, and an optional on-device language model may add one short line of small talk; a filter blocks any health content from the model. The team chose the challenge, framed the problem and made the product decisions.
