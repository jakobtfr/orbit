# Dashboard methodology

## Data and variability

All displayed dashboard readings are simulated. Heart-rate and temperature variation
inherits the existing UTMB-derived demo series; those displayed values are not actual
flight measurements. Sleep, exercise, cabin CO2, and radiation are scripted.

The dashboard displays heart rate, core temperature, and radiation dose rate over
14 or 28 mission calendar days. Each point and connecting line shows an individual daily observation. Error bars
show the trailing seven-day mean ±1 sample SD (n−1 denominator). Windows overlap, so adjacent points are correlated.
No future observations are included. A single sample has no error bar. Missing daily
intervals are not connected when separated by more than 1.5 days.

The headline value is the latest individual reading. Daily means, sample counts,
standard deviations, variance, and source information appear in expandable Details.
SD describes temporal sample variability, not instrument uncertainty or a confidence
interval. Solid threshold lines bound faintly tinted review bands. Aggregation can
hide individual excursions. Sleep and cabin CO2 remain available on their existing
indicator screens; the source references below document those metrics as well.

Radiation is plotted as dose rate, calculated from consecutive cumulative-dose
readings divided by their elapsed time. Counter resets and duplicate timestamps are
excluded. The demo includes seeded correlated exposure drift. Cumulative dose retains three
decimal places to avoid artificial integer-rounding steps in daily rates. This is
illustrative variation, not a validated environmental forecast. Cabin data are defined as one
simulated daily sample of a one-hour mean partial pressure.

## References and interpretation

Colors indicate review bands, not a diagnosis or a guaranteed safe state. Points and
connecting segments use individual daily readings; the header classifies the latest sample and
shows its mission day. Binned averages can hide individual excursions. Existing
indicator detail screens retain their own prototype confirmation rules; a dashboard
review band is not automatically a confirmed clinical alert.

| Plot | Reference | Dashboard interpretation |
| --- | --- | --- |
| Resting heart rate | [American Heart Association](https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse) | 60–100 bpm is the general adult resting reference; lower values may occur in trained people. ORBIT amber at +20% of preflight baseline or 100 bpm; red below 40 or at/above 120. These review bands are prototype choices. |
| Core temperature | [Stahn et al., Scientific Reports, 2017](https://www.nature.com/articles/s41598-017-15560-w) | Compare with an in-flight baseline, not skin temperature. Amber at +0.5 °C from the preceding seven-day resting mean or 38.5 °C, whichever is lower; red at 39.5 °C. Absolute review bands are not validated flight fever limits. |
| Sleep duration | [NASA medical operations](https://www.nasa.gov/reference/6-0-medical-operations/) | NASA provides sleep opportunity requirements; ORBIT uses its own review bands below 6 h and below 4 h, and an illustrative 8-hour sleep goal. Sleep duration and scheduled sleep opportunity are different quantities. |
| Radiation dose rate | [NASA human performance, V1 4033](https://www.nasa.gov/reference/4-0-human-performance/) | For systems supporting crew longer than 60 days: GCR design reference below 1.3 mSv/day in free space, below 0.9 on planetary surfaces, using NASA effective dose. Amber at 80% is an ORBIT margin. This is not an acute-illness threshold or a solar-event prediction. Career dose is a separate 600 mSv limit. |
| Cabin CO2 | [NASA OCHMO-TB-004](https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/) | NASA reference: one-hour mean ppCO2 no more than 3 mmHg. Red at 5 mmHg is an ORBIT heuristic. Multi-day means and once-daily samples cannot prove continuous compliance. |

## Relationship to the five hazards

[NASA's five hazards](https://www.nasa.gov/hrp/hazards/) are radiation, isolation and
confinement, distance from Earth, altered gravity, and hostile/closed environments.
The selected plots are related indicators, not direct measurements of all five
hazards. Resting pulse relates to cardiovascular adaptation; sleep to isolation and
circadian disruption; dose to radiation; and CO2 to the closed environment. Core
temperature and symptom check-ins support health autonomy when Earth assistance is
delayed. Distance itself is mission context, not a vital sign.

## Risks and checks

The dashboard has three equal desktop columns: anatomy, activity plus a combined
risks/checks panel, and three health plots. The weekly summary and chatbot have
been removed. Radiation exposure is shown once, followed by other alerts,
temperature/symptom review, sleep/recovery, exercise, vision checks, and the daily
check-in. Red highlights indicate review priority and yellow marks items due soon;
they do not represent validated illness probabilities. Reminder times remain a demo
schedule. Links open existing indicator, measurement, and check-in screens.

## Validation

Unit tests cover sample variance, empty and singleton bins, boundary assignment,
missing intervals, elapsed-time dose rates, counter resets, future-data exclusion,
reversed sleep thresholds, and environment-specific radiation limits. Server-rendered
markup checks verify three plots, references, navigation destinations, one combined risks/checks panel,
and finite SVG geometry. These checks do not replace visual browser verification.
