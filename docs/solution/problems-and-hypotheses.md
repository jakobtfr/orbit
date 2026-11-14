# Problems and Hypotheses

Written 2026-11-14, revised the same day after rerunning the data checks. Where the need comes from, which problems we tackle, which few hypotheses must be true for our solution to matter, and how we test each one. Functional requirements come next and should trace back to a hypothesis here.

## Problem statement

The medical loop that keeps a station crew healthy today is a flight surgeon on console, live data, weekly private conferences, and evacuation as a last resort. On a Mars-class mission every link in that loop breaks. A crew with about 40 hours of medical training must notice, judge, and act on health changes on their own, using reference values that are wrong in flight, and no tool exists yet to help them do it.

## Where the need comes from

The need is not that astronauts get sick a lot. It is that the current way of handling it depends on Earth being close. Each link below is sourced.

| # | Link in the chain | Evidence | Source |
| --- | --- | --- | --- |
| 1 | Missions are getting longer and farther. | Artemis has flown a crewed lunar flyby. Mars is about 140 million miles away and a mission lasts about three years. | [`challenge-brief.md`](../challenge/challenge-brief.md#background), [`resources.md`](../challenge/resources.md#5-useful-numeric-facts-from-these-pages) |
| 2 | Distance is itself one of NASA's five hazards. | "Supplies, instructions, and medical care become harder to receive." One-way delay can exceed 20 minutes; evacuation and resupply become impossible. CSA lists "less ability to rely on Earth for emergency medical assistance". | [`resources.md`](../challenge/resources.md#1-the-five-hazards-of-human-spaceflight), [`operations.md`](../research/operations.md#the-exploration-gap) |
| 3 | Today's care model is ground-centred and real-time. | Flight surgeon on console 24/7, a biomedical engineer producing a daily medical status report, weekly private medical conferences, ground clearance before every EVA. All of it needs a live link. | [`operations.md`](../research/operations.md#what-happens-on-a-normal-mission) |
| 4 | The person on board is not a doctor. | The crew medical officer is usually a non-physician astronaut with about 40 hours of medical training. | [`operations.md`](../research/operations.md#who-is-involved) |
| 5 | The body in flight is not the body on Earth. | Resting core temperature rises about 1 °C. Systolic pressure fell from 122 to 111 mmHg in one cohort. Earth cutoffs misjudge both. | [`clinical-thresholds.md`](../research/clinical-thresholds.md#spaceflight-baseline-shifts) |
| 6 | The hazards produce three different kinds of problem, and each needs a different response. | Frequent minor events: 3.40 per flight year, 61% rashes and upper respiratory symptoms, clustered in the first month. Slow cumulative harms: sleep 6.09 h a night, bone loss 1 to 1.5% a month, concerning eye changes in 15 to 20%. Rare acute events: the video's chest-pain scenario. | [`operations.md`](../research/operations.md#how-often-people-actually-get-sick), [`clinical-thresholds.md`](../research/clinical-thresholds.md#rule-table), [`video-transcript.md`](../challenge/video-transcript.md) |
| 7 | NASA has already named the answer. | Earth-Independent Medical Operations with an onboard clinical decision support system. The crew must "detect, diagnose, treat, and prevent" on their own. In a 26-month simulation, raising the crew's scope of practice cut deaths by at least 34%. HRP: "Planning and self-sufficiency will be key." | [`operations.md`](../research/operations.md#the-exploration-gap), [`resources.md`](../challenge/resources.md#1-the-five-hazards-of-human-spaceflight) |

In one sentence: the hazards are old, the distance is new, and distance is what turns a manageable medical workload into an unsupported one.

### What the challenge asks for, in its own words

The brief and the video are the judges' reference. Each phrase below maps to a problem in the next section.

| The challenge says | Where | Problem |
| --- | --- | --- |
| "Astronauts carry much of the responsibility for spotting these changes in themselves." | Brief, description | P1, P2 |
| "Explain how to take each measurement, why it matters, and what to do when a value does not look normal." "Astronauts are not doctors." | Video 01:01 | P3 |
| "Your fellow crewmate feels a sharp pain in the chest and collapses. What should you do?" "Guidance on what to do in an emergency situation." | Video 00:43, 01:01 | P4 |
| "Immune system changes, bone density loss, cardiovascular events, inadequate nutrition, behavioral health conditions." Indicators: "blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, and mood." | Brief, background | P5, P6 |
| "Remind the crew to take measurements." "Prompt astronauts to take measurements or complete specific actions as part of the mission routine." | Video 01:01, brief considerations | P5 |
| "Adapt it to different environments like a spacecraft, a space station, or a base on the surface." | Video 01:01, brief considerations | P7 |
| "When might a result warrant attention from the crew or from flight surgeons on the ground?" "Which measurements can be performed in space?" | Brief, objectives | P2, P3, P7 |
| "Do not assume astronauts know everything about assessing their health." | Brief, considerations | P3 |

## The five hazards behind the problems

NASA's Human Research Program names five hazards of human spaceflight ([`resources.md`](../challenge/resources.md#1-the-five-hazards-of-human-spaceflight)). The challenge is built on them. Each of our problems comes from one or more of these hazards.

| Hazard | What it does | Problems it causes | How well we cover it |
| --- | --- | --- | --- |
| **Distance from Earth** | Advice, supplies, and rescue arrive late or not at all. | P3, P4 | Well |
| **Gravity fields** | The body adapts to weightlessness: fluids, heart, bones, and eyes change. | P2, P5, P7 | Well |
| **Isolation and confinement** | A few people live in a small space for years. | P6, and sleep in P5 | Partly: sleep has numbers, mood has none |
| **Space radiation** | An invisible dose adds up over the mission and raises cancer risk. | P5 | Thinly: one row on dose |
| **Hostile closed environment** | Cabin air, noise, microbes, and a stressed immune system. | P1, P7 | Thinly: the rashes and colds in P1 are linked to it; cabin air appears only as one row in P7 |

## Problems, ranked

Seven high-level problems, taken from the challenge brief, the intro video, and how space agencies run crew health today. Each is a general problem, not a single measurement. The table gives the idea; the sections below explain each one and show how big it is.

| ID | Problem | What it means | In scope |
| --- | --- | --- | --- |
| **P1** | Small illnesses are constant | Most health trouble is minor, frequent, and felt by the person, not shown on a sensor. | Yes, core (H1) |
| **P2** | Earth's "normal" does not fit a body in space | Almost every health reading shifts in flight, so Earth limits give false alarms and miss real problems. | Yes, core (H2) |
| **P3** | The crew are not doctors, and no doctor is in reach | People with little medical training must measure, judge, and act alone. | Yes, core (H3) |
| **P4** | A serious emergency will probably happen once | Rare on any given day, likely over a three-year mission. | Yes, as one demo flow (H4) |
| **P5** | Some damage builds slowly and silently | Bones, eyes, radiation dose, and sleep debt get worse for months without a clear symptom. | Lightly: trends and adherence (H5) |
| **P6** | Mood and strain stay private | People live under strain for years and will not share how they feel with the whole crew. | Lightly: a private mood entry |
| **P7** | The rules change with place and mission phase | What can be measured, and what counts as normal, differs between weightlessness, a surface, and the days after landing. | Lightly: an environment and mission-day switch |

### P1. Small illnesses are constant

**What it means.** The everyday burden is not dramatic. It is rashes, colds, headaches, and aches. The person feels it and reports it; a sensor mostly does not see it.

**Why it matters.** A tool that only watches vital signs misses most of what actually goes wrong.

| How big it is | Figure | Source |
| --- | --- | --- |
| Health events on the station | 3.40 per person per year, about 1.7 in a six-month stay | [`operations.md`](../research/operations.md#how-often-people-actually-get-sick) |
| Crew with a lasting or repeated event | 46% | [`operations.md`](../research/operations.md#how-often-people-actually-get-sick) |
| Share that is rashes and cold-like symptoms | About 61% (2.09 of 3.40) | [`operations.md`](../research/operations.md#how-often-people-actually-get-sick) |
| Expected on a Mars mission | About 40 events for a crew of four over three years | Our arithmetic: 3.40 × 4 × 3 |
| Bed-rest volunteers: days with a complaint | 20.4% of days; mostly pain (26%), headache (22%), and sleep difficulty (8%) | [Data check](#what-the-data-check-showed) |
| Do vital signs show it? | No: abnormal vital signs were no more common on complaint days than on other days | [Data check](#what-the-data-check-showed) |

### P2. Earth's "normal" does not fit a body in space

**What it means.** The body adapts to weightlessness, and most readings move with it. A healthy astronaut can look unwell by Earth limits, and a real problem can hide behind a value that looks fine. This is true across measurements, not for one of them: every one of the 12 indicators in our rule table needs a flight adjustment.

**Why it matters.** Wrong limits cause false alarms, and people stop trusting an alarm that is often wrong.

| Reading | What changes in flight | Source |
| --- | --- | --- |
| Body temperature | About 1 °C higher at rest; the usual 38.0 °C fever line would flag almost everyone | [`clinical-thresholds.md`](../research/clinical-thresholds.md#spaceflight-baseline-shifts) |
| Blood pressure | Lower: upper value fell from 122 to 111 mmHg in one study | [`clinical-thresholds.md`](../research/clinical-thresholds.md#spaceflight-baseline-shifts) |
| Heart rate | The heart pumps less per beat, so a small rise can mean more than on Earth | R1 |
| Sleep | The "normal" night in space is already too short (6.09 hours) | R6 |
| Body weight | Fluid moves around the body early in flight and distorts single weigh-ins | R10 |
| All vital signs together | With the same two-day rule, Earth limits raised an alert on 13.5% of days in healthy bed-rest volunteers; personal limits on 5.9% | [Data check](#what-the-data-check-showed) |

R numbers refer to the [rule table](../research/clinical-thresholds.md#rule-table).

### P3. The crew are not doctors, and no doctor is in reach

**What it means.** The video says it directly: "astronauts are not doctors." Today a doctor on the ground watches the station crew around the clock and makes the medical decisions. On the way to Mars the advice arrives late and leaving is not possible, so the crew must measure, judge, and treat with only basic training.

**Why it matters.** A tool that assumes medical knowledge will be misread or ignored. Clear guidance is what closes the gap.

| How big it is | Figure | Source |
| --- | --- | --- |
| Medical training of the crew's medical lead | About 40 hours; usually not a physician | [`operations.md`](../research/operations.md#who-is-involved) |
| Conditions that can occur in spaceflight | More than 100 | [`operations.md`](../research/operations.md#the-exploration-gap) |
| Support on the station today | Flight surgeon, biomedical engineer, and specialist network, on call 24/7 | [`operations.md`](../research/operations.md#who-is-involved) |
| Message delay to Mars | Over 20 minutes one way, so over 40 minutes for a question and its answer | [`operations.md`](../research/operations.md#the-exploration-gap) |
| Contact cut back by the Sun | About 2 weeks, every 26 months | JPL |
| Going home early | A week from decision to landing on the station's first medical evacuation (January 2026); impossible from Mars | Space.com |
| Value of good guidance | At least 34% fewer deaths in a simulated 26-month mission | [`operations.md`](../research/operations.md#the-exploration-gap) |

### P4. A serious emergency will probably happen once

**What it means.** This is the video's scenario: a crewmate has chest pain and collapses halfway to Mars. On any given day it is very unlikely. Over a whole mission it is not.

**Why it matters.** The person who responds is a crewmate with basic training, and a doctor's advice is at least 40 minutes away (P3).

| How big it is | Figure | Source |
| --- | --- | --- |
| Serious illness or injury in isolated crews | About 0.06 cases per person per year | Billica et al., 1996 |
| Expected on a Mars mission | 0.9 cases for six people over 2.5 years: about one per mission | Billica et al., 1996 |
| Direction of error | Likely too low; leaves out radiation and low gravity | Same |

### P5. Some damage builds slowly and silently

**What it means.** Several body systems decline a little every week. Nothing hurts, so nobody acts until the harm is done. The defence is daily prevention, which only works if people keep to it.

**Why it matters.** These are the harms that last after the mission, and they are caught by watching trends and habits, not single readings.

| System | How big it is | Source |
| --- | --- | --- |
| Bone | 1 to 1.5% lost per month without exercise; 0.3 to 0.8% with today's exercise plan; cannot be measured in flight | R9 |
| Eyes | About 81% of NASA astronauts show a finding; 15 to 20% develop changes that worry doctors | R12 |
| Radiation | 40 to 90 mSv in six months on the station; about 660 mSv for the trip to Mars and back, against a 600 mSv career limit | R8; Zeitlin 2013 |
| Sleep | 6.09 hours a night against 8.5 planned; 44% of nights under 6 hours | [`operations.md`](../research/operations.md#countermeasures-already-in-the-plan) |
| Body weight | Bed-rest volunteers lost 1.17 kg on average (1.6%); 24% lost more than 3% | [Data check](#what-the-data-check-showed) |
| Cost of prevention | About 2 hours of exercise every day | [`operations.md`](../research/operations.md#countermeasures-already-in-the-plan) |

R numbers refer to the [rule table](../research/clinical-thresholds.md#rule-table).

### P6. Mood and strain stay private

**What it means.** A crew lives for years in a small space with the same few people. How someone feels is personal, and they will not report it honestly to a tool that shows their answers to everyone.

**Why it matters.** Strained people make mistakes and miss their own symptoms, which feeds every other problem.

| How big it is | Figure | Source |
| --- | --- | --- |
| Time confined together | About 3 years | [`resources.md`](../challenge/resources.md#5-useful-numeric-facts-from-these-pages) |
| How agencies handle it today | Private medical talks every week and separate private psychological talks, kept off the mission channel | [`operations.md`](../research/operations.md#what-happens-on-a-normal-mission) |
| Mood | No number: no open mood data from spaceflight exists | [`open-data.md`](../research/open-data.md#10-what-is-not-openly-available) |

### P7. The rules change with place and mission phase

**What it means.** A spacecraft, a station, a surface base, and the days after landing are different medical settings. Some tests only work in some of them, and what counts as normal shifts as the mission goes on. The brief asks for this directly: "Which measurements can be performed in space?"

**Why it matters.** One fixed rule set is wrong somewhere: it either asks for a test that cannot work or misses a risk that belongs to that phase.

| Setting or phase | What changes | Source |
| --- | --- | --- |
| Weightlessness | The standing blood pressure test does not work; bone density cannot be measured | R3, R9 |
| After return to gravity | About 30% feel faint or dizzy on standing | R3 |
| First month | Health events cluster here | [`operations.md`](../research/operations.md#how-often-people-actually-get-sick) |
| Around flight day 75 | The rise in body temperature levels off | [`clinical-thresholds.md`](../research/clinical-thresholds.md#spaceflight-baseline-shifts) |
| Later in the mission | Eye and bone risks grow with time | R9, R12 |
| Cabin and suit | Blood oxygen depends on cabin air and suit state; cabin carbon dioxide is limited to 3 mmHg | R5, R11 |

R numbers refer to the [rule table](../research/clinical-thresholds.md#rule-table).

## Hypotheses

Each hypothesis is written so it can fail. Order follows the problems.

| ID | Hypothesis | Serves | Evidence so far | How we test it | It is wrong if |
| --- | --- | --- | --- | --- | --- |
| **H1** | A two-minute daily symptom check-in is the primary detection channel. Vital signs alone miss most real events. | P1 | On 2,184 bed-rest subject-days, 20.4% had a logged symptom. Abnormal vital signs were no more common on those days than on the others (22.7% vs 26.3% Earth cutoffs; 4.3% vs 6.3% personal rules). Only 15% of personal-rule alerts landed on a symptom day, below the 20% base rate. | Done once; rerun with the final rules R1 to R4 and report the same two rates. Then show that the check-in's categories cover at least 80% of the logged bed-rest and station event types. | Symptom days show a clearly higher abnormal-vital rate than symptom-free days, so sensors alone would do. Or the check-in categories miss most event types. |
| **H2** | Judging vital signs against a personal baseline, with a confirming reading, cuts false alarms by more than half compared with Earth cutoffs, without hiding a real shift. | P2 | With the same two-day confirmation on both sides, alerts fell from 13.5% to 5.9% of days, or from 24 to 11 per person per 180 days (2.3×). On single days: 25.5% to 16.5%. A strict Earth red cutoff (≥140/90) also gives about 5%, but it is blind to change: an astronaut whose systolic baseline fell to 111 and then rose to 135 is +24 from baseline yet below every Earth cutoff. | Replay `data/utmb/daily_vitals.csv` through both rule sets with the final R1 to R4. Then run the scripted flight cases from [`scientific-constraints.md`](../research/scientific-constraints.md#hard-constraints): 38.0 °C on flight day 100 with a 37.8 °C baseline must not be a fever; a 1 bpm a day rise over 30 days must be flagged. | The rerun gives less than a 2× reduction. Or a scripted flight case is misjudged. **Note:** the bed-rest data contains no vital-sign events (no fever, no low pressure), so sensitivity to real vital-sign events cannot be tested on it. That half of H2 rests on the literature in [`clinical-thresholds.md`](../research/clinical-thresholds.md#spaceflight-baseline-shifts). |
| **H3** | A person with no medical training can take a measurement correctly and reach the right next action in under three minutes, using only the app. | P3 | The brief and video require it. No test data yet. | Give three to five outsiders three scripted cases: raised temperature with headache; one isolated high blood pressure reading with no symptoms (correct action: repeat after 5 minutes of rest); a symptom with normal vitals (correct action: log it, follow the care card, recheck tomorrow). Time them and record the action chosen. | Fewer than four in five reach the right action, or they need help, or the median time exceeds three minutes. |
| **H4** | In an acute event, a fixed step-by-step flow gets a crewmate to the first correct action within one minute. | P4 | The video's scenario. The 34% figure shows scope of practice matters. No test data yet. | Timed walk-through of the chest-pain-and-collapse case with an outsider, starting from the home screen. | The first correct action takes longer than a minute, or the flow is abandoned, or the tester cannot find it from the home screen. |
| **H5** | For slow harms, a trend or adherence rule fires earlier than a fixed limit, and not constantly. | P5 | Mean bed-rest weight change was −1.17 kg (−1.6%); 24% of subjects crossed the R10 amber line of −3%. Sleep debt and bone loss build over weeks. | Replay weight through a slope rule and the fixed −3% limit; record the day each fires per subject. For sleep and exercise, show adherence against the 8.5 h and 2 to 2.5 h plan on scripted data, labelled simulated. | The trend rule fires no earlier than the fixed limit, or it fires on more than 10% of days. Sleep cannot be tested on real data: only three bed-rest subjects have actigraphy. |

### Assumptions we take from the brief without testing

These are design choices the challenge asks for. We build them but will not have evidence for them this weekend. They should not be presented as findings.

- Prompting the crew to measure increases how often they measure.
- Environment and mission-phase modes make the output more useful.
- Colour coding and a body figure make status easier to read at a glance.
- Gamification improves engagement with countermeasures.

## What the data check showed

Rerun on 2026-11-14 against `data/utmb/`. Mission-phase days only (`fase == mision`), 2,184 subject-days, 29 subjects. Symptom days are days with any event logged in `events.csv` between mission day 0 and 70.

**Rules used.** Earth: pulse > 100, or systolic ≥ 130, or diastolic ≥ 80, or temperature ≥ 38.0 °C, any single reading. Personal: pulse ≥ 20% above pre-mission mean, or systolic ≥ +20 or diastolic ≥ +15 mmHg above pre-mission mean, or temperature ≥ +0.5 °C above pre-mission mean, on two consecutive days. Baselines from `baselines.csv`.

| Measure | Value |
| --- | --- |
| Days flagged by Earth cutoffs, any single day | 25.5% (46 per person per 180 days) |
| Days flagged by personal rules | 5.9% (11 per person per 180 days) |
| Days flagged by Earth cutoffs, two consecutive days (same confirmation as the personal rule) | 13.5% (24 per person per 180 days) |
| Days flagged by personal rules, any single day | 16.5% |
| Days flagged by stricter Earth cutoffs (140/90), any single day | 5.4% |
| Per-subject Earth flag rate | 0% to 88%; median 14%; four subjects above 50% |
| Earth flags on symptom days vs symptom-free days | 22.7% vs 26.3% |
| Personal alerts on symptom days vs symptom-free days | 4.3% vs 6.3% |
| Share of personal alerts that fell on a symptom day | 15% (base rate 20%) |
| Days with temperature ≥ 38.0 °C | 0.0% |
| Event categories | other 28%, pain 26%, headache 22%, sleep difficulty 8%, constipation 4%, back pain 3%, dizziness 2%, dry skin 2% |
| Mission-window events in the first 14 / 30 days of 70 | 27% / 46% |
| Weight, pre-mission mean to last mission day | −1.17 kg, −1.6%; 24% of subjects below −3% |

The two percentages for temperature and the absence of low blood pressure confirm [SH10](../research/scientific-constraints.md#hard-constraints): the analog cannot test the flight-specific rules.

## Limits of the evidence

- Bed-rest volunteers are healthy people on Earth. An alert there is probably, not certainly, a false alarm. The first version of this file reported 4.9% for the personal rule; the rerun gives 5.9% with the rules stated above.
- The data contains no vital-sign events, so H2's claim that personal rules still catch real shifts is untested on data. It rests on the published baseline shifts.
- "Symptom day" includes minor and recurring complaints. It is a day someone said something was wrong, not a day something was clinically significant.
- About 28% of bed-rest events are in a catch-all "other" category, so the symptom shares are approximate.
- Station event rates come from one 2016 review of 46 crew. Flight studies cover tens of people.
- The whole field rests on few people: fewer than 800 have ever been to space (counts range from about 640 to 780), and nobody has flown a three-year mission. Long-mission figures are stretched from shorter flights.
- Day-by-day health readings from real astronauts are not public ([`open-data.md`](../research/open-data.md#10-what-is-not-openly-available)).
- H3 and H4 have no evidence until we test with people. H5's sleep part cannot be tested on real data.

## Sources for figures not in our other docs

- Serious-event rate of 0.06 per person per year and 0.9 cases per Mars mission: Billica et al., "Perception of the medical risk of spaceflight," Aviat Space Environ Med 67(5), 1996, as summarised in https://en.wikipedia.org/wiki/Illness_and_injuries_during_spaceflight. We read the summary, not the paper.
- Mars transit radiation of 0.66 ± 0.12 Sv: Zeitlin et al., Science, 2013: https://www.swri.org/newsroom/press-releases/swri-led-team-calculates-the-radiation-exposure-associated-trip-mars
- Two-week contact pause about every 26 months: https://www.jpl.nasa.gov/news/mars-missions-to-pause-commanding-in-june-due-to-sun/
- First station medical evacuation, January 2026: https://www.space.com/space-exploration/international-space-station/spacex-crew-11-astronauts-return-to-earth-after-1st-ever-medical-evacuation-of-iss
- Number of people who have flown: https://www.astronomy.com/space-exploration/how-many-people-have-gone-to-space/ and https://ourworldindata.org/grapher/cumulative-people-space

## Next step

The app is built ([`SPEC.md`](../../SPEC.md)). H2 is now replayed inside the app on the same bed-rest data, and the app's tests reproduce every figure above (13.5% vs 5.9% with the same two-day rule; 25.5% and 16.5% on single days). Still open: test H3 and H4 with three outsiders, and have someone with medical training review the emergency steps. A feature that serves no hypothesis and is not in the untested-assumptions list is a candidate to cut.
