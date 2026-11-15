# Project Submission Text

Written 2026-11-14, updated 2026-11-15 to match the app. One section per field on the Space Apps Project Submission page, ready to paste. Field instructions are from the [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/). Submission closes Sunday, November 15, 2026, 11:59 p.m. local time.

Before submitting: the repository must be public, and both links must open in a private browser window without a login.

---

## Project Name

ORBIT

## High-Level Project Summary

ORBIT is health monitoring software for astronauts on long missions, built around one idea: judge each astronaut against their own normal, not Earth's, and let that normal follow the mission. The body changes with gravity: in weightlessness temperature runs about 1 °C higher, and after landing the heart runs fast for days. Earth's medical limits raise alarms for healthy crew again and again. Halfway to Mars, where every question to a doctor takes over 40 minutes to answer, a crew that gets false alarms stops trusting them and then misses the real one.

ORBIT learns each astronaut's normal for every phase of the mission (outbound, on Mars, return, back on Earth) from NASA bed-rest data and their own readings, within hard bounds, so a slow real problem is never learned as normal.

We tested the idea on real NASA bed-rest data from 29 healthy volunteers over 2,184 days, with the same rule on both sides. Earth's limits raised an alarm on 13.5% of days; ORBIT on 5.9%, 2.3 times fewer. For fevers and heart-rate rises, fewer alarms did not mean missing more: when we planted known problems into the same data, ORBIT caught 94% of fevers of +1 °C (Earth's limits: 8%) and 93% of heart-rate rises of 20 bpm (Earth: 20%). Earth's limits do better on small blood-pressure rises, and we show that too.

Around this sits a dashboard any crew member can read, step-by-step procedures, and a virtual doctor that runs on the device without contact with Earth.

## Link to Project Demo

https://github.com/jakobtfr/orbit/blob/phase-limits/docs/demo/orbit-demo.pdf

(Checked 15 Nov 13:25: the `blob/main` link is 404 until PR #1 is merged; the `phase-limits` link opens without login.)

A 7-slide deck (PDF), at most 7 slides as the rules require. Source: [`demo/deck.html`](demo/deck.html), screenshots of the running app in `demo/img/`. Re-export with Chrome: open the HTML and print to PDF, or `chrome --headless --print-to-pdf=orbit-demo.pdf deck.html`.

## Link to Final Project

Code: https://github.com/jakobtfr/orbit/tree/phase-limits

Live app (add only after it loads; 404 on 15 Nov 13:25 because GitHub Pages is off): https://jakobtfr.github.io/orbit/

The live app opens on mission day 100 of a Mars mission. The evidence is under Replay (`#/replay`). The virtual doctor uses its built-in answers on the live site; its local language model runs only where Ollama is installed. To run locally: `cd app && npm install && npm run dev`.

## Detailed Project Description

**What it does.** ORBIT helps astronauts check their own health without a doctor in reach. It is designed to take readings from equipment already on board (smart shirt, wrist tracker, radiation monitor, cabin sensors) plus a two-minute daily check-in; in the prototype these readings are scripted. It judges every reading against the astronaut's own normal for the current mission phase, and says what to do next in plain words.

- **Your normal, for this phase of the mission.** The mission day sets the phase: outbound, on Mars, return, back on Earth. For each phase ORBIT expects a set change from the astronaut's pre-flight values, taken from NASA bed-rest data: for example, heart rate about 12 bpm higher in the first days back in gravity. It learns how far this astronaut sits from that expectation in the two weeks after the body has settled, then holds it. The learned normal can never leave the range NASA's data shows between people, so a slow real problem is not learned as normal. For 14 days after each gravity change the limits are wider, while the body adapts. Fixed danger values apply in every phase. Heart rate, blood pressure, and temperature each show where their normal comes from and whether the value is NASA data, from outside NASA, or an estimate.
- **Dashboard.** An anatomical body map coloured by status, daily activity and sleep, one list of today's risks and open checks, and trend plots for heart rate, core temperature, and radiation dose rate. Charts draw Earth's limit next to the personal one. Example: our demo astronaut's temperature of 38.0 °C sits on Earth's fever line but is normal for her in flight.
- **One next action.** When something is off, ORBIT says what was observed and what to do: repeat the reading, apply a countermeasure, or contact the medical lead. One odd reading asks for a repeat instead of raising an alarm. Each finding names the NASA Human Research Program risk it bears on; all 17 HRP risks are mapped to what ORBIT measures or asks.
- **Call the doctor.** When a reading is off or a symptom was logged, the dashboard offers a call. A simulated doctor speaks, listens, and goes through the problem one step at a time, and can look at what the astronaut shows the camera. It runs on the device: with a local language model when one is installed, and with built-in answers when not. Anything that sounds urgent, such as chest pain or trouble breathing, is never left to the model: the astronaut is told to get the medical lead at once.
- **Family call (opt-in, always labelled AI).** At Mars distance a signal takes about 4 to 24 minutes one way, so a live call home is not possible. People on Earth who opted in record a short message each day. In the astronaut's off-duty time ORBIT plays the newest one as a call: caller name, an "AI call" label for the whole call, and "Message from Earth, recorded 47 min ago". The astronaut can answer, and the call plays the recorded part that fits; several people's messages sit in the same call. The call also carries one health prompt, so the check does not feel like a chore: when a reading is off, ORBIT's fixed rule is read out word for word, labelled "ORBIT". A language model never writes a health sentence. A reading said in the call is saved and judged again; "I am fine" is not accepted as a reading. Urgent words end the call and name the medical lead. Both sides can opt out with one switch. The conversation is stored encrypted on the device, apart from the health record. In the demo the people are invented and every voice is AI-generated speech, labelled on screen and in each audio file.
- **Resources.** Every procedure on board, one step at a time, each step acted out by a small animated astronaut, stored on the device.
- **Evidence built in.** A Replay screen runs real NASA bed-rest data through Earth's limits and ORBIT's rules, day by day, for any of the 29 volunteers, with the same two-day rule on both sides. A table shows every way of counting. A second table shows how many planted problems each rule set catches, including where ORBIT does worse.
- **Measurements and Mental Health.** The astronaut's own measurements, one indicator at a time against her normal, with CSV export; and a private mood, energy, and journal check-in that only the astronaut sees.

**How it works.** The app is a web front end that runs in the browser with no server; the optional doctor model runs locally through Ollama. NASA's UTMB head-down bed-rest data (29 volunteers, daily vital signs) is used three ways:
1. **Phase limits.** The expected change per phase and the allowed spread between people are computed from the data: the change in each volunteer's mean from their own pre-bed-rest mean, during bed rest (the stand-in for weightlessness) and after it (the return to gravity). A test reads the raw NASA file and checks the table against it. The +1 °C in-flight temperature rise is not in bed-rest data; it comes from an ESA/Charité study of ISS crew and is labelled "outside NASA". Mars values are labelled "estimate".
2. **False alarms.** Every day is judged by Earth's limits (pulse over 100, blood pressure 130/80 or more, temperature 38.0 °C or more) and by personal limits (pulse 20% above the person's own normal, blood pressure 20/15 mmHg above, or temperature 0.5 °C above), both needing two days in a row: 13.5% against 5.9% of days. On single days: 25.5% against 16.5%. A stricter Earth cutoff of 140/90 gives 5.4% but is still one line for everyone.
3. **Missed problems.** Fevers, heart-rate jumps, slow heart-rate drifts, and blood-pressure rises and drops are added to each volunteer's real readings. A problem counts as caught only where the rule had not already alarmed. A separate Python script recomputes all 65 results and matches the app.

Automated tests (160) reproduce the headline numbers and check the family call's rules (every health sentence comes from the fixed rules, urgent words end the call, a spoken reading is saved and judged again); the separate Python script rechecks all 65 planted-problem results. The demo astronaut's readings are scripted, with day-to-day variation taken from the same NASA data. The demo spacecraft's radiation dose stays under NASA's daily design limit of 1.3 mSv in free space ([NASA OCHMO standards overview, 2021](https://www.nasa.gov/sites/default/files/atoms/files/ochmo_standards_overview_sept_15_2021_francisco.pdf)).

**Benefits.** 2.3 times fewer false alarms on real data with the same rule on both sides, while catching more fevers and heart-rate changes, so the alarms that remain are believed. Limits that know the mission phase, including the risky days after landing. A tool written for a crew member with about 40 hours of medical training, not a doctor. No new hardware, and no contact with Earth needed. The same idea fits anyone far from a doctor on Earth: remote communities, ships, and polar stations.

**What we hope to achieve.** A working example of the onboard decision support NASA says exploration missions need. Next steps: test the phase limits on flight data, test with people who have no medical training, and have a clinician review the limits and the doctor's wording.

**Limits.** Bed rest is a ground stand-in for flight. It shows no in-flight temperature rise, and flight studies disagree on how much blood pressure changes; ORBIT says where each value comes from. NASA has no data for long stays at Mars gravity, so those values are estimates. The data contains no real illness, so missed problems are tested with planted ones, which are simpler than real illness. ORBIT catches fewer of the smaller blood-pressure rises than Earth's limits. Neither Replay rule set has a low side, so both miss every planted drop; the app's low-pressure rule is not tested on NASA data. Missed problems are tested with the Replay's rules, not the live phase-aware limits. Limits have not been reviewed by a clinician. The family call is untested with crews or families: we do not know yet whether a health prompt inside a call from home helps, or harms trust in the call. Its people and voices are invented for the demo; no real person's voice is copied. Speech recognition uses the browser, which on some browsers sends audio to a server; a flight version needs an on-board model. ORBIT is a prototype, not a medical device.

**Tools.** TypeScript, React, React Router, Vite, Vitest, SVG for all charts and the body map, Python with uv for the data export and the separate check, Ollama for the optional local doctor model, the browser's speech functions for the doctor's voice and for listening, Kokoro-82M through mlx-audio for the family call's rendered voices, Whisper large-v3-turbo to check the rendered audio, the browser's Web Crypto (AES-GCM) for the private conversation, Git and GitHub.

## Use of Super Intelligence (SI)

> Check this answer with the whole team before submitting. It is not shown to judges, but it must be true.

Yes. We used Claude (Anthropic), an AI coding assistant, to help write and refactor the app code, the data export script, and the tests; to search and summarise published sources; and to draft and edit documentation and this submission text. The team chose the challenge, framed the problem, made the product decisions, and reviewed the output. Every figure shown in the app is recomputed from the source data by automated tests. No images or video were generated with SI. Audio: all 21 voice files of the family call (`app/public/family/*.m4a`) are SI-generated speech, made on our own machine with the open model Kokoro-82M (Apache 2.0) from text the team wrote and from ORBIT's fixed rule sentences; each file says so in its metadata (artist, comment, genre), and the app labels every voice on screen. The voices are Kokoro's synthetic presets, not copies of any person. The idea of the family call is the team's own. In the product, the optional virtual doctor runs a local language model on the device; every limit, judgement, and urgent-symptom check is fixed code, not model output. In the family call the language model may say one linking sentence when no recording is left, and a filter replaces it if it mentions health or claims to be the person. The repository README states that AI assistance was used.

## NASA Data

- **UTMB head-down tilt bed-rest study, daily vital signs** (NASA Life Sciences Portal, Case Report Form dataset, [DOI 10.83263/wjw1-ta27](https://doi.org/10.83263/wjw1-ta27)). The core of the project: 2,184 days of pulse, blood pressure, and temperature with pre-bed-rest baselines from 29 volunteers. Used to set the expected change and the allowed spread for each mission phase (bed rest as weightlessness, the days after bed rest as the return to gravity), for the Earth-versus-personal comparison and the missed-problems test on the Replay screen, and for the day-to-day variation of the demo astronaut. Extracted with the help of the community project [ydtoloza/astronaut-health-dataset](https://github.com/ydtoloza/astronaut-health-dataset).
- **NASA Human Research Program**: the [five hazards of human spaceflight](https://www.nasa.gov/hrp/hazards/), the [risks of human spaceflight](https://www.nasa.gov/hrp/risks/), and [ongoing HRP research](https://www.nasa.gov/hrp/ongoing-hrp-research/), used to choose the indicators.
- **NASA-STD-3001**: [Volume 1, Rev C](https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf) (radiation limits); the daily design limit of 1.3 mSv in free space is from the [NASA OCHMO standards overview, 2021](https://www.nasa.gov/sites/default/files/atoms/files/ochmo_standards_overview_sept_15_2021_francisco.pdf), [Volume 2](https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_2) (cabin environment, display colours), and [6.0 Medical Operations](https://www.nasa.gov/reference/6-0-medical-operations/) (sleep).
- **NASA OCHMO technical briefs**: [TB-004 Carbon Dioxide](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf) and [TB-019 Orthostatic Intolerance](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf).
- **NASA HRP [Bone Fracture Evidence Report](https://humanresearchroadmap.nasa.gov/evidence/reports/Bone%20Fracture%20Evidence%20Report_07-18-2024.pdf)** (2024) and [Simonsen, Radiation protection for space exploration](https://ntrs.nasa.gov/citations/20250006168) (NTRS, 2025).
- **NASA Open Science Data Repository, Inspiration4** ([OSD-569](https://osdr.nasa.gov/bio/repo/data/studies/OSD-569), [OSD-575](https://osdr.nasa.gov/bio/repo/data/studies/OSD-575)): blood labs, explored and included in the repository; not used in the app.

## Space Agency Partner Data and Other References

**Space agency partners**

- Brazilian Space Agency: the [challenge intro video](https://www.youtube.com/watch?v=RERG3gEmdC8), whose chest-pain scenario shaped how the doctor hands urgent symptoms to a person.
- Canadian Space Agency: [Bio-Monitor smart shirt](https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp) (the onboard source of heart rate, blood pressure, and blood oxygen), [monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp), and [why we conduct science experiments in space](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp).

**Clinical and scientific sources**

- Stahn et al., Increased core body temperature in astronauts during long-duration space missions, Scientific Reports 7:16180, 2017 (the in-flight temperature rise, labelled outside NASA). https://www.nature.com/articles/s41598-017-15560-w
- Norsk et al., Fluid shifts, vasodilatation and ambulatory blood pressure reduction during long duration spaceflight, J Physiol 593, 2015 (in-flight blood pressure, compared in the method notes). https://doi.org/10.1113/jphysiol.2014.284869
- Zeitlin et al., Science 340:1080, 2013, and Hassler et al., Science 343:1244797, 2014 (radiation in cruise to Mars and on its surface). https://doi.org/10.1126/science.1235989, https://doi.org/10.1126/science.1244797
- Barger et al., Lancet Neurology, 2014 (sleep in spaceflight). https://www.thelancet.com/journals/laneur/article/PIIS1474-4422(14)70122-X/abstract
- Shibata et al., Cardiac Effects of Long-Duration Space Flight, JACC, 2023. https://www.jacc.org/doi/10.1016/j.jacc.2023.05.058
- Crucian et al., International Journal of General Medicine, 2016 (immune and illness events). https://pmc.ncbi.nlm.nih.gov/articles/PMC5098747/
- LeBlanc et al., JBMR, 2007, and Stavnichuk et al., npj Microgravity, 2020 (bone loss). https://doi.org/10.1359/JBMR.040307, https://pmc.ncbi.nlm.nih.gov/articles/PMC7200725
- SANS expert consensus, Eye, 2026, and Brunstetter et al., JAMA Ophthalmology, 2024 (eye changes). https://www.nature.com/articles/s41433-026-04651-6, https://jamanetwork.com/journals/jamaophthalmology/fullarticle/2821259
- ACC/AHA 2017 hypertension guideline. https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065
- American Heart Association, resting heart rate (the dashboard reference). https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse
- NASA, Space Communications: 7 Things You Need to Know, 2020 (signal delay to Mars: about 4 minutes at the closest, around 24 at the farthest). https://www.nasa.gov/missions/tech-demonstration/space-communications-7-things-you-need-to-know
- NASA Human Research Program, Evidence Report: Risk of Adverse Cognitive or Behavioral Changes and Psychiatric Disorders, 2025 (contact with family and friends supports crew well-being). https://ntrs.nasa.gov/citations/20250001454
- Institute of Medicine, Safe Passage: Astronaut Care for Exploration Missions, 2001, ch. 6 (fear of mission disqualification makes astronauts reluctant to report medical information). https://www.nationalacademies.org/read/10218/chapter/8
- Marquez, Integrating Human Performance Measures into Space Operations, NASA Ames, 2015 (crew time is one of the most limited resources). https://ntrs.nasa.gov/citations/20190002709
- Hollanek and Nowaczyk-Basińska, Griefbots, Deadbots, Postmortem Avatars, Philosophy & Technology 37:63, 2024 (risks of AI copies of loved ones; why ORBIT plays real recordings and labels every AI voice). https://doi.org/10.1007/s13347-024-00744-w
- Regulation (EU) 2024/1689 (AI Act), Article 50 (people must be told when they talk to an AI system). http://publications.europa.eu/resource/celex/32024R1689
- Billica et al., Perception of the medical risk of spaceflight, Aviat Space Environ Med 67(5), 1996 (serious-event rate).

**Code, fonts, and design**

- Anatomical SVG paths adapted from [Kacmisz/react-body-map](https://github.com/Kacmisz/react-body-map), a fork of hashangit/react-body-map, MIT licence. Attribution in `app/src/components/anatomy/NOTICE.md`.
- [Inter](https://rsms.me/inter/) typeface, SIL Open Font License 1.1.
- [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) speech model, Apache 2.0, MLX copy [mlx-community/Kokoro-82M-8bit](https://huggingface.co/mlx-community/Kokoro-82M-8bit), run with [mlx-audio](https://github.com/Blaizzy/mlx-audio), MIT. Used to render the family call's voices.
- [Whisper large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo), MIT. Used only to check that the rendered audio says the written words.
- [Qwen3 8B](https://huggingface.co/Qwen/Qwen3-8B), Apache 2.0, through [Ollama](https://ollama.com). The optional local language model.
- [React](https://react.dev), [React Router](https://reactrouter.com), [Vite](https://vite.dev), [Vitest](https://vitest.dev), [TypeScript](https://www.typescriptlang.org), all MIT or Apache 2.0.
- Colour palette based on the [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/color) dark-mode system colours, adjusted for contrast.
- No NASA logos or insignia are used.
