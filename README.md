# ORBIT

**Onboard health monitoring that judges each astronaut against their own normal, not Earth's.**

NASA Space Apps Challenge 2026 · [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)

## The problem

Halfway to Mars, a question to a flight surgeon and its answer take more than 40 minutes. The crew must notice, judge, and act on health changes themselves, usually with about 40 hours of medical training.

Their bodies also change in flight: core temperature runs about 1 °C higher, blood pressure drops, heart rate shifts. A health app that uses Earth's fixed limits raises alarms for healthy astronauts again and again. A crew that gets an alarm every few days stops trusting it, and then misses the one that matters.

## What we found in NASA data

We replayed NASA's UTMB head-down bed-rest study, the standard way to imitate weightlessness on the ground: 29 healthy volunteers, 2,184 days of daily vital signs. Every day was judged with the same rule on both sides: an alarm only when two days in a row are over the line.

| Rule set, 2 days in a row | Days with an alarm | Alarms per person in 6 months |
| --- | --- | --- |
| Earth limits (pulse > 100, BP ≥ 130/80, temperature ≥ 38.0 °C) | **13.5%** | **24** |
| ORBIT: the person's own pre-bed-rest values | **5.9%** | **11** |

That is 2.3 times fewer alarms. Counted on single days instead, Earth limits alarm on 25.5% of days and ORBIT on 16.5%. A stricter Earth cutoff of 140/90 alarms on 5.4% of single days, but it is still one line for everyone and misses the slow rise below.

The personal rule also sees what Earth's limits miss. One volunteer's resting heart rate drifted from 55 to about 75 bpm during bed rest. That never reaches Earth's line of 100, so Earth limits stay silent; ORBIT flags a rise of more than 20%.

The result is reproduced by the app's own tests (`app/src/lib/replay.test.ts`). Bed rest is a ground stand-in for flight and the data has no confirmed illness, so missed problems are tested by planting known ones into the real readings: ORBIT caught 94% of +1 °C fevers (Earth's limits 8%) and 93% of +20 bpm heart-rate rises (Earth 20%), but fewer small blood-pressure rises (26% against 50%). These use the Replay's rules, not the live phase-aware limits ([`miss-rate.md`](docs/research/miss-rate.md)). Details: [problems and hypotheses](docs/solution/problems-and-hypotheses.md#what-the-data-check-showed).

## What ORBIT does

- **Personal dashboard.** An anatomical body map, daily activity and sleep, one list of today's risks and open checks, and trend plots for heart rate, core temperature, and radiation dose rate.
- **Your normal, not Earth's, for each phase of the mission.** Heart rate, blood pressure, and temperature are judged against the astronaut's own normal for the current phase (outbound, on Mars, return, back on Earth): their pre-flight value plus the change NASA bed-rest data shows for that gravity, plus their own learned offset, held within the range NASA's data shows between people. Limits are wider for 14 days after each gravity change. Fixed danger values never move. Indicator charts draw Earth's limit next to the personal one. Method: [`phase-limits.md`](docs/research/phase-limits.md).
- **One next action.** When something is off, ORBIT says what to do next in plain words: repeat the reading, apply a countermeasure, or contact the ground.
- **How to measure.** Step-by-step instructions for each reading, and a two-minute daily symptom check-in.
- **Call the doctor.** When a reading is off or a symptom was logged, the dashboard says so and offers an immediate call. The call is a pop-up like a phone call, which can be minimised to the corner: a simulated doctor speaks briefly, listens, goes through procedures with you one step at a time, and guides you through that one problem a step at a time, and can look at what you show the camera. It helps with anything you raise, not a fixed list of conditions. It runs on the device, with a local language model through Ollama when one is installed and built-in answers when not, so it works without contact with Earth.
- **Spaceflight risks in the rules.** All 17 risks named by NASA's Human Research Program are mapped to what ORBIT measures or asks in the check-in. A next action names the risk its finding bears on, and the doctor is told which risks have a finding behind them.
- **Resources.** Every procedure on board, one step at a time, each step acted out by a small animated astronaut: what is needed today and how to take each reading. It runs on the device, with no contact with Earth.
- **Replay.** The full bed-rest comparison: pick any of the 29 volunteers and watch both rule sets judge the same days.
- **Measurements and Mental Health.** Lena's own measurements, explored one indicator at a time against her normal, with CSV export; a private mood, energy, and journal check-in that only the astronaut sees.
- **Place.** The mission day sets it. Outbound and return are the spacecraft; the stay on Mars is the surface. The standing test needs gravity, and the radiation review line follows the place.

## Run it

```sh
cd app
npm install
npm run dev     # http://localhost:5173
npm test        # unit tests, including the bed-rest replay
npm run build   # type-check and build to app/dist/
```

The app runs in the browser with no server and no network.

## Data and sources

| Source | Used for |
| --- | --- |
| NASA Life Sciences Portal, UTMB bed rest case report forms ([DOI 10.83263/wjw1-ta27](https://doi.org/10.83263/wjw1-ta27)) | The Replay, the home-screen result, and the day-to-day variation of the demo vital signs |
| NASA-STD-3001, NASA OCHMO technical briefs, NASA Human Research Program | Radiation, CO₂, and sleep references; the five hazards |
| Published flight physiology, e.g. [Stahn et al. 2017](https://www.nature.com/articles/s41598-017-15560-w) | Flight adjustments to temperature and other limits |

All other values shown for the demo astronaut, Lena Brandt, are scripted. The full source lists are in [`data/README.md`](data/README.md), [`clinical-thresholds.md`](docs/research/clinical-thresholds.md#source-list), and [`dashboard-methodology.md`](docs/solution/dashboard-methodology.md).

## Limits

- A prototype, not a medical device. Status rules are simplified from published values and have not been reviewed by a clinician.
- No flight hardware is connected. Device feeds are scripted.
- The virtual doctor is simulated. It repeats what the prototype rules find in your readings; it does not diagnose, and its wording still needs review by a medical professional. Anything that sounds urgent is handed to the medical lead.

## AI assistance

The team used Claude (Anthropic), an AI coding assistant, to help write and refactor the app code, the data export script, and the tests, to search and summarise published sources, and to draft documentation. The team chose the challenge, framed the problem, and made the product decisions. Every figure shown in the app is recomputed from the source data by automated tests. No images, video, or audio were generated with AI.

## Repository

| Path | Contents |
| --- | --- |
| [`app/`](app/README.md) | The web app (React, TypeScript, Vite) |
| [`data/`](data/README.md) | Real extracted tables: UTMB bed-rest vitals, labs, symptoms, sleep, tilt, cognition; Inspiration4 labs |
| [`docs/index.md`](docs/index.md) | Index of every fact and where it lives |
| [`docs/challenge/`](docs/challenge/) | The official brief, intro video transcript, resources, and judging rules |
| [`docs/research/`](docs/research/) | How NASA handles crew health today, clinical thresholds, scientific constraints, open datasets |
| [`docs/solution/`](docs/solution/) | Problems and hypotheses, the solution overview, dashboard methodology |
| [`SPEC.md`](SPEC.md), [`DESIGN.md`](DESIGN.md) | What the app contains and how it looks |
| [`docs/demo/orbit-demo.pdf`](docs/demo/orbit-demo.pdf) | The 7-slide project demo |
| [`docs/submission.md`](docs/submission.md) | Text for the Space Apps submission form |
