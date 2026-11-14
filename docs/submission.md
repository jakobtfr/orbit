# Project Submission Text

Written 2026-11-14. One section per field on the Space Apps Project Submission page, ready to paste. Field instructions are from the [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/). Submission closes Sunday, November 15, 2026, 11:59 p.m. local time.

Before submitting: the repository must be public, and both links must open in a private browser window without a login.

---

## Project Name

ORBIT

## High-Level Project Summary

ORBIT is health monitoring software for astronauts on long missions, built around one idea: judge each astronaut against their own normal, not Earth's. In space the body changes. Temperature runs about 1 °C higher and blood pressure drops, so Earth's medical limits raise alarms for healthy crew again and again. Halfway to Mars, where every question to a doctor takes over 40 minutes to answer, a crew that gets false alarms stops trusting them and then misses the real one.

We tested this on real NASA bed-rest data from 29 healthy volunteers over 2,184 days. Earth's limits raised an alarm on 25.5% of days, about 46 per person in six months. Judged against each person's own normal, ORBIT raised one on 5.9% of days, about 11. It also caught a slow heart-rate rise that Earth's limits never saw.

ORBIT puts this into a dashboard any crew member can read: a body map, daily activity, one list of risks and checks with a clear next action, trends with Earth's limit drawn next to the personal one, and a one-tap emergency guide for chest pain or collapse with CPR adapted to weightlessness.

## Link to Project Demo

https://github.com/jakobtfr/orbit/blob/main/docs/demo/orbit-demo.pdf

A 7-slide deck (PDF). Source: [`demo/deck.html`](demo/deck.html), screenshots of the running app in `demo/img/`. Re-export with Chrome: open the HTML and print to PDF, or `chrome --headless --print-to-pdf=orbit-demo.pdf deck.html`.

## Link to Final Project

https://github.com/jakobtfr/orbit

The app runs locally: `cd app && npm install && npm run dev`. Instructions are in the README.

## Detailed Project Description

**What it does.** ORBIT helps astronauts check their own health without a doctor in reach. It is designed to take readings from equipment already on board (smart shirt, wrist tracker, radiation monitor, cabin sensors) plus a two-minute daily check-in; in the prototype these readings are scripted. It judges every reading against the astronaut's own normal, and says what to do next in plain words.

- **Dashboard.** An anatomical body map (tap a region or muscle group to explore it), daily activity and sleep, one list of risks and checks, and trend plots for heart rate, core temperature, and radiation dose rate.
- **Your normal, not Earth's.** Each indicator compares the latest reading with the value from before flight and the last seven days. Charts draw Earth's limit as a dashed line next to the personal one, so the difference is visible. Example: our demo astronaut's temperature of 38.0 °C sits on Earth's fever line but is normal for her in flight.
- **One next action.** When something is off, ORBIT says what was observed and what to do: repeat the reading, apply a countermeasure, or contact the ground. One odd reading asks for a repeat instead of raising an alarm.
- **How to measure.** Step-by-step instructions for each manual reading.
- **Emergency.** A red button on every screen opens a step-by-step flow for chest pain or collapse. It branches on whether the person breathes normally, adapts CPR to weightlessness, and cites a published guideline for every step.
- **Evidence built in.** A Replay screen runs real NASA bed-rest data through both rule sets, day by day, for any of the 29 volunteers. A card on the dashboard shows one of them: 54 alarms under Earth's limits against 1 against their own normal.
- **Deep Data and Mental Health.** Figures of the real bed-rest records with a drafted summary, and a private mood, energy, and journal check-in that only the astronaut sees.
- **Environments.** A setting switches between a planet surface and a spacecraft; checks that need gravity, such as the standing blood pressure test, turn off in weightlessness.

**How it works.** The app is a web front end that runs in the browser with no server or network. A Python script exports the daily vital signs and pre-bed-rest baselines of 29 volunteers from NASA's UTMB head-down bed-rest study. The app judges every day twice: Earth's limits (pulse over 100, blood pressure 130/80 or more, temperature 38.0 °C or more, on any single day) and personal limits (pulse 20% above the person's own normal, blood pressure 20/15 mmHg above, or temperature 0.5 °C above, on two days in a row). Automated tests reproduce the published result from the raw data: 25.5% and 5.9% of days. The demo astronaut's readings are scripted, with day-to-day variation taken from the same NASA data.

**Benefits.** About four times fewer false alarms on real data, so the alarms that remain are believed. A tool written for a crew member with about 40 hours of medical training, not a doctor. No new hardware. The same idea fits anyone far from a doctor on Earth: remote communities, ships, and polar stations.

**What we hope to achieve.** A working example of the onboard decision support NASA says exploration missions need. Next steps are testing with people who have no medical training, a review of the emergency steps by a clinician, and validation on flight data.

**Limits.** Bed rest is a ground stand-in for flight, and the data contains no confirmed illness, so it shows fewer false alarms, not that every real problem is caught. Limits are simplified from published values and have not been reviewed by a clinician. ORBIT is a prototype, not a medical device.

**Tools.** TypeScript, React, React Router, Vite, Vitest, SVG for all charts and the body map, Python with uv for the data export, Git and GitHub.

## Use of Super Intelligence (SI)

> Check this answer with the whole team before submitting. It is not shown to judges, but it must be true.

Yes. We used Claude (Anthropic), an AI coding assistant, to help write and refactor the app code, the data export script, and the tests; to search and summarise published sources; and to draft and edit documentation and this submission text. The team chose the challenge, framed the problem, made the product decisions, and reviewed the output. Every figure shown in the app is recomputed from the source data by automated tests. No images, video, or audio were generated with SI. The repository README states that AI assistance was used.

## NASA Data

- **UTMB head-down tilt bed-rest study, daily vital signs** (NASA Life Sciences Portal, Case Report Form dataset, [DOI 10.83263/wjw1-ta27](https://doi.org/10.83263/wjw1-ta27)). The core of the project: 2,184 days of pulse, blood pressure, and temperature with pre-bed-rest baselines from 29 volunteers. Used for the Earth-versus-personal comparison on the Replay screen and the dashboard, the Deep Data figures, and the day-to-day variation of the demo astronaut. Extracted with the help of the community project [ydtoloza/astronaut-health-dataset](https://github.com/ydtoloza/astronaut-health-dataset).
- **NASA Human Research Program**: the [five hazards of human spaceflight](https://www.nasa.gov/hrp/hazards/), the [risks of human spaceflight](https://www.nasa.gov/hrp/risks/), and [ongoing HRP research](https://www.nasa.gov/hrp/ongoing-hrp-research/), used to choose the indicators.
- **NASA-STD-3001**: [Volume 1, Rev C](https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf) (radiation limits), [Volume 2](https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_2) (cabin environment, display colours), and [6.0 Medical Operations](https://www.nasa.gov/reference/6-0-medical-operations/) (sleep).
- **NASA OCHMO technical briefs**: [TB-004 Carbon Dioxide](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf) and [TB-019 Orthostatic Intolerance](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf).
- **NASA HRP [Bone Fracture Evidence Report](https://humanresearchroadmap.nasa.gov/evidence/reports/Bone%20Fracture%20Evidence%20Report_07-18-2024.pdf)** (2024) and [Simonsen, Radiation protection for space exploration](https://ntrs.nasa.gov/citations/20250006168) (NTRS, 2025).
- **NASA Open Science Data Repository, Inspiration4** ([OSD-569](https://osdr.nasa.gov/bio/repo/data/studies/OSD-569), [OSD-575](https://osdr.nasa.gov/bio/repo/data/studies/OSD-575)): blood labs, explored and included in the repository; not used in the app.

## Space Agency Partner Data and Other References

**Space agency partners**

- Brazilian Space Agency: the [challenge intro video](https://www.youtube.com/watch?v=RERG3gEmdC8), whose chest-pain scenario is the basis of the emergency flow.
- Canadian Space Agency: [Bio-Monitor smart shirt](https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp) (the onboard source of heart rate, blood pressure, and blood oxygen), [monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp), and [why we conduct science experiments in space](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp).

**Clinical and scientific sources**

- Stahn et al., Increased core body temperature in astronauts during long-duration space missions, Scientific Reports 7:16180, 2017. https://www.nature.com/articles/s41598-017-15560-w
- Barger et al., Lancet Neurology, 2014 (sleep in spaceflight). https://www.thelancet.com/journals/laneur/article/PIIS1474-4422(14)70122-X/abstract
- Shibata et al., Cardiac Effects of Long-Duration Space Flight, JACC, 2023. https://www.jacc.org/doi/10.1016/j.jacc.2023.05.058
- Crucian et al., International Journal of General Medicine, 2016 (immune and illness events). https://pmc.ncbi.nlm.nih.gov/articles/PMC5098747/
- LeBlanc et al., JBMR, 2007, and Stavnichuk et al., npj Microgravity, 2020 (bone loss). https://doi.org/10.1359/JBMR.040307, https://pmc.ncbi.nlm.nih.gov/articles/PMC7200725
- SANS expert consensus, Eye, 2026, and Brunstetter et al., JAMA Ophthalmology, 2024 (eye changes). https://www.nature.com/articles/s41433-026-04651-6, https://jamanetwork.com/journals/jamaophthalmology/fullarticle/2821259
- ACC/AHA 2017 hypertension guideline. https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065
- American Heart Association, resting heart rate and heart-attack warning signs. https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse, https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack
- Olasveengen et al., European Resuscitation Council Guidelines 2021: Basic Life Support. https://doi.org/10.1016/j.resuscitation.2021.02.009
- Panchal et al., 2020 AHA Guidelines: Adult Basic and Advanced Life Support. https://doi.org/10.1161/CIR.0000000000000916
- Hinkelbein et al., CPR during spaceflight: a guideline for CPR in microgravity (DGLRM, ESAM-SMG), Scand J Trauma Resusc Emerg Med 28:108, 2020. https://doi.org/10.1186/s13049-020-00793-y
- Billica et al., Perception of the medical risk of spaceflight, Aviat Space Environ Med 67(5), 1996 (serious-event rate).

**Code, fonts, and design**

- Anatomical SVG paths adapted from [Kacmisz/react-body-map](https://github.com/Kacmisz/react-body-map), a fork of hashangit/react-body-map, MIT licence. Attribution in `app/src/components/anatomy/NOTICE.md`.
- [Inter](https://rsms.me/inter/) typeface, SIL Open Font License 1.1.
- [React](https://react.dev), [React Router](https://reactrouter.com), [Vite](https://vite.dev), [Vitest](https://vitest.dev), [TypeScript](https://www.typescriptlang.org), all MIT or Apache 2.0.
- Colour palette based on the [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/color) dark-mode system colours, adjusted for contrast.
- No NASA logos or insignia are used.
