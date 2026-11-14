# Data Index

Where each piece of information lives. Start here when you need a specific fact. If a topic appears in more than one file, the link below points to the version to use.

## Challenge and rules

| What you need | Where to look |
| --- | --- |
| Official challenge text: description, goals, optional features | [`challenge-brief.md`](challenge/challenge-brief.md) |
| The intro video as text | [`video-transcript.md`](challenge/video-transcript.md) |
| Judging: five criteria, three phases, 10 awards, eligibility | [`judging.md`](challenge/judging.md) |
| Links to NASA and partner-agency resources | [`resources.md`](challenge/resources.md) |

## Spaceflight health context

| What you need | Where to look |
| --- | --- |
| The five hazards of human spaceflight | [`resources.md`](challenge/resources.md#1-the-five-hazards-of-human-spaceflight) |
| The 17 health risks NASA tracks, grouped by body system, behavior, and radiation | [`resources.md`](challenge/resources.md#2-the-17-hrp-risks) |
| Studies NASA is currently running | [`resources.md`](challenge/resources.md#3-ongoing-hrp-research) |
| Canadian Space Agency findings and Earth parallels | [`resources.md`](challenge/resources.md#4-csa-findings) |
| Quick numbers: Mars distance, mission length, radiation share, ISS experiments | [`resources.md`](challenge/resources.md#5-useful-numeric-facts-from-these-pages) |

## How NASA handles crew health today

| What you need | Where to look |
| --- | --- |
| Who does what: flight surgeon, biomedical engineer, crew medical officer | [`operations.md`](research/operations.md#who-is-involved) |
| Routine checks, private medical conferences, and data sent to the ground | [`operations.md`](research/operations.md#what-happens-on-a-normal-mission) |
| Current countermeasures: exercise, sleep, fluids, radiation, cabin environment | [`operations.md`](research/operations.md#countermeasures-already-in-the-plan) |
| How often crew get sick and which symptoms are most common | [`operations.md`](research/operations.md#how-often-people-actually-get-sick) |
| Why the current Earth-reliant model fails on long missions | [`operations.md`](research/operations.md#the-exploration-gap) |

## Clinical values

| What you need | Where to look |
| --- | --- |
| How spaceflight shifts "normal" core temperature and blood pressure | [`clinical-thresholds.md`](research/clinical-thresholds.md#spaceflight-baseline-shifts) |
| Green / amber / red values, flight adjustments, evidence, and confidence for 12 indicators | [`clinical-thresholds.md`](research/clinical-thresholds.md#rule-table) |
| One specific indicator | All in the rule table: **R1** heart rate · **R2** blood pressure · **R3** blood pressure on standing (orthostatic check) · **R4** core temperature · **R5** blood oxygen · **R6** sleep · **R7** mood · **R8** radiation · **R9** bone load · **R10** nutrition and weight · **R11** cabin carbon dioxide · **R12** vision and eye changes (SANS) — [`clinical-thresholds.md`](research/clinical-thresholds.md#rule-table) |

## Problems and hypotheses

| What you need | Where to look |
| --- | --- |
| Where the need comes from: the sourced chain from longer missions to an onboard decision-support tool, and which brief line drives which problem | [`solution/problems-and-hypotheses.md`](solution/problems-and-hypotheses.md#where-the-need-comes-from) |
| How NASA's five hazards map to our problems, and how well we cover each | [`solution/problems-and-hypotheses.md`](solution/problems-and-hypotheses.md#the-five-hazards-behind-the-problems) |
| The seven problems, with numbers, ranked, and what we leave out | [`solution/problems-and-hypotheses.md`](solution/problems-and-hypotheses.md#problems-ranked) |
| The five hypotheses, how to test each, and what would prove it wrong | [`solution/problems-and-hypotheses.md`](solution/problems-and-hypotheses.md#hypotheses) |
| Alert rates and symptom-versus-vitals results from replaying the bed-rest tables | [`solution/problems-and-hypotheses.md`](solution/problems-and-hypotheses.md#what-the-data-check-showed) |
| The same comparison inside the app, with the exact rules and tests | [`../app/README.md`](../app/README.md#methods) and `app/src/lib/replay.ts` |

## Solution

| What you need | Where to look |
| --- | --- |
| What ORBIT solves, in one sentence and per problem | [`solution/solution-overview.md`](solution/solution-overview.md#what-we-solve) |
| How it works: the daily loop and the parts around it | [`solution/solution-overview.md`](solution/solution-overview.md#how-it-works) |
| What ORBIT knows up front: values from before flight, flight information, the crew | [`solution/solution-overview.md`](solution/solution-overview.md#what-orbit-knows) |
| Which onboard equipment feeds ORBIT | [`solution/solution-overview.md`](solution/solution-overview.md#where-the-data-comes-from) |
| The dashboard, body map, and crew sharing rules | [`solution/solution-overview.md`](solution/solution-overview.md#what-the-crew-sees) |
| How the dashboard plots are calculated, their thresholds and references | [`solution/dashboard-methodology.md`](solution/dashboard-methodology.md) |
| Expected impact, and how solid each claim is | [`solution/solution-overview.md`](solution/solution-overview.md#impact) |

## Build spec and design

| What you need | Where to look |
| --- | --- |
| What the app contains: screens, data, logic, done-when checks | [`../SPEC.md`](../SPEC.md) |
| How it looks and reads: colours, type, components, wording | [`../DESIGN.md`](../DESIGN.md) |
| The web app and how to run it | [`../app/README.md`](../app/README.md) |
| Emergency steps and their first-aid sources | `app/src/data/emergency.ts` and [`../SPEC.md`](../SPEC.md#emergency) |

## Scientific constraints

| What you need | Where to look |
| --- | --- |
| What the health logic must respect to be valid in flight: hard and soft constraints | [`scientific-constraints.md`](research/scientific-constraints.md) |
| Spaceflight facts that are still unconfirmed | [`scientific-constraints.md`](research/scientific-constraints.md#verify-before-relying-on-it) |
| One test per hard constraint to run against the prototype | [`scientific-constraints.md`](research/scientific-constraints.md#hard-constraints) |

## Open data and extracted tables

| What you need | Where to look |
| --- | --- |
| Catalog of open datasets and repositories, with licences and caveats | [`open-data.md`](research/open-data.md) |
| Which dataset covers which health indicator | [`open-data.md`](research/open-data.md#mapping-indicators-to-sources) |
| UTMB bed-rest daily vitals, labs, symptoms, sleep, tilt, cognition | [`../data/README.md`](../data/README.md) and [`../data/utmb/`](../data/utmb/) |
| Inspiration4 pre- and post-flight labs | [`../data/README.md`](../data/README.md) and [`../data/inspiration4/`](../data/inspiration4/) |
| What is not openly available | [`open-data.md`](research/open-data.md#10-what-is-not-openly-available) |

## Sources

| What you need | Where to look |
| --- | --- |
| Source documents for NASA operations and event rates | [`operations.md`](research/operations.md#sources) |
| Source papers for clinical values | [`clinical-thresholds.md`](research/clinical-thresholds.md#source-list) |
| Dataset DOIs, licences, and access methods | [`../data/README.md`](../data/README.md) and [`open-data.md`](research/open-data.md) |
| Official hackathon pages and agency resources | [`resources.md`](challenge/resources.md) |

## Which file to trust

| Question | Use |
| --- | --- |
| What is the threshold or flight adjustment? | [`clinical-thresholds.md`](research/clinical-thresholds.md#rule-table) |
| What does NASA actually do, and how often do events happen? | [`operations.md`](research/operations.md) |
| What has NASA or a partner agency stated, and what research is running? | [`resources.md`](challenge/resources.md) |
| Which real data table should I use for an indicator? | [`open-data.md`](research/open-data.md#mapping-indicators-to-sources) and [`../data/README.md`](../data/README.md) |
| What are the submission rules and judging criteria? | [`judging.md`](challenge/judging.md) |
| What do we paste into the submission form? | [`submission.md`](submission.md) |
