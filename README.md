# ORBIT — Research Data

NASA Space Apps Challenge 2026 · Challenge: **Create Health Monitoring Software for Astronauts on Space Missions**

This repo holds the source data for the challenge: the official brief, the official resources, what NASA currently does operationally, and published clinical reference values with citations.

Looking for a specific fact? Start with the [data index](docs/index.md).

## Layout

| Folder | What belongs there |
| --- | --- |
| `docs/challenge/` | Given by the organisers: the brief, the intro video, official resources, judging rules. We do not edit the substance. |
| `docs/research/` | The problem as we found it: how NASA works today, published clinical values, open datasets. Sourced facts only. |
| `docs/solution/` | Our own decisions: the constraints our solution must meet. |
| `data/` | Real extracted data tables. |

## Contents

| File | What it contains |
| --- | --- |
| [`docs/index.md`](docs/index.md) | Topic-level index: which file and section holds each fact |
| [`docs/challenge/challenge-brief.md`](docs/challenge/challenge-brief.md) | Full official challenge text and considerations |
| [`docs/challenge/video-transcript.md`](docs/challenge/video-transcript.md) | Timestamped transcript of the official intro video (Rodrigo Leonardi, Brazilian Space Agency) |
| [`docs/challenge/resources.md`](docs/challenge/resources.md) | Official HRP/CSA resources, distilled: five hazards, 17 risks, current research, CSA findings |
| [`docs/research/operations.md`](docs/research/operations.md) | What NASA actually does today: roles, cadence, countermeasures, medical event rates, exploration gap |
| [`docs/research/clinical-thresholds.md`](docs/research/clinical-thresholds.md) | Published clinical values and spaceflight adjustments, with sources and confidence notes |
| [`docs/solution/problems-and-hypotheses.md`](docs/solution/problems-and-hypotheses.md) | Where the need comes from, ranked problems, the cut, five testable hypotheses, and the bed-rest data check |
| [`app/`](app/README.md) | The version 1 web app: ten screens, 3D body, scripted demo data. `cd app && npm install && npm run dev` |
| [`SPEC.md`](SPEC.md) | Version 1 build spec: screens, components, fake data, and done-when checks. Read with `DESIGN.md` |
| [`docs/solution/solution-overview.md`](docs/solution/solution-overview.md) | High-level solution: what ORBIT solves, how it works, and the impact |
| [`docs/solution/scientific-constraints.md`](docs/solution/scientific-constraints.md) | What the health logic must respect to be scientifically valid in flight, with a test per hard constraint |
| [`docs/research/open-data.md`](docs/research/open-data.md) | Open datasets and repositories: UTMB bed rest, Inspiration4, flight-crew signals, ASPA, OSDR, ESA HREDA |
| [`data/`](data/README.md) | Real extracted tables: UTMB daily vitals, labs, symptoms, sleep, tilt, cognition; Inspiration4 labs |
| [`docs/challenge/judging.md`](docs/challenge/judging.md) | Official 2026 judging criteria, three-phase process, 10 awards, eligibility gates |

## Challenge links

- Official page: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
- Intro video: https://www.youtube.com/watch?v=RERG3gEmdC8 ([transcript](docs/challenge/video-transcript.md))
- Skills: Human Exploration · Software · Space Exploration

## Use notes

- Captured 2026-11-14.
- Values are for a prototype, not medical advice or operational guidance.
- Where spaceflight-specific thresholds are not public, the source and confidence are stated explicitly.
- Always check the current revision of a NASA standard before relying on a number.