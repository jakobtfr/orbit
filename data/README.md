# Data

Real, openly licensed data for the challenge. No synthetic columns, no demo fixtures.

The tables are cleaned extracts of NASA's UTMB head-down tilt bed-rest studies and the SpaceX Inspiration4 mission. They are not spaceflight vitals: UTMB is a ground analog, and Inspiration4 provides blood labs pre- and post-flight only.

## Sources

| Source | What it is | License |
| --- | --- | --- |
| **NASA Life Sciences Portal (NLSP)** — UTMB bed rest | 60–70 days of 6° head-down tilt bed rest, the standard NASA analog for microgravity | DataCite lists each dataset as **CC0-1.0**; the NLSP portal itself publishes no explicit licence, so cite the DOI |
| **NASA Open Science Data Repository (OSDR)** — Inspiration4 | Blood counts, metabolic panel, CRP, and cytokine arrays from four commercial astronauts, 92 days before to 194 days after flight | **CC0-1.0** |

The extracts were assembled and documented by the community project [`ydtoloza/astronaut-health-dataset`](https://github.com/ydtoloza/astronaut-health-dataset), which includes an independent source audit and a reproducible pipeline. This repo keeps that project's real data tables, drops its simulated columns, and drops the event description and intervention free-text fields, which contain staff names.

### Primary DOIs

| Dataset | DOI |
| --- | --- |
| UTMB Case Report Form — daily vitals and symptoms | [10.83263/wjw1-ta27](https://doi.org/10.83263/wjw1-ta27) |
| UTMB Clinical Laboratory Assessment | [10.83263/rank-k271](https://doi.org/10.83263/rank-k271) |
| UTMB Neuroendocrine and Cardiovascular Response to Tilt | [10.83263/gz1q-a824](https://doi.org/10.83263/gz1q-a824) |
| UTMB Bed Rest Standard Measures: Actilight (actigraphy) | [10.83263/v7n1-ht75](https://doi.org/10.83263/v7n1-ht75) |
| UTMB Neurocognitive Assessment (WinSCAT) | [10.83263/sbne-th55](https://doi.org/10.83263/sbne-th55) |
| Inspiration4 whole blood (CBC, RNA-seq, WGS) | [OSD-569](https://osdr.nasa.gov/bio/repo/data/studies/OSD-569) |
| Inspiration4 serum metabolic panel and cytokine arrays | [OSD-575](https://osdr.nasa.gov/bio/repo/data/studies/OSD-575) |

## Files

### `utmb/`

| File | Rows | Subjects | Contents |
| --- | --- | --- | --- |
| `daily_vitals.csv` | 2,939 subject-days | 29 | Daily pulse, systolic and diastolic BP, respiration rate, body temperature, weight. Campaigns C1, C3, CFT70. Phases: `pre`, `mision`, `post`. |
| `labs.csv` | 8,036 values | 31 | Haematology, chemistry, CRP, urinalysis, electrophoresis. `marca_origen` preserves source flags; `atipico` marks outliers. |
| `events.csv` | 1,053 events | 26 | Symptom category, free-text symptom label, pain score (0–10), phase, mission day. |
| `cognition.csv` | 302 sessions | 29 | WinSCAT working memory, arithmetic, match-to-sample, delayed code substitution: reaction time and accuracy. |
| `sleep_actigraphy.csv` | 190 nights | 3 | Sleep duration, efficiency, latency from Actilight. |
| `tilt.csv` | 78 tests | 26 | Supine vs tilted pulse and systolic BP; tilt duration. Campaign 3. |
| `subjects.csv` | 40 | 40 | Subject profile: campaign, days, which data types exist. |
| `baselines.csv` | 40 | 40 | Personal pre-mission mean and SD for pulse, BP, temperature, weight, respiration. |
| `phase_summary.csv` | 72 | — | Mean, SD, P5 and P95 by phase for each vital sign. |
| `individual_change.csv` | 5 | 29 | Mean within-subject change from pre to in-mission for each vital sign. |

### `inspiration4/`

| File | Rows | Crew | Contents |
| --- | --- | --- | --- |
| `labs.csv` | 1,090 values | 4 | 40 analytes, pre- and post-flight only. Relative day: negative before launch, positive after landing. |
| `crew.csv` | 4 | 4 | Crew profile. |

## Column notes

- `astronauta_id` is the pseudonymous ID (`UTMB-01`, `I4-C001`). `sujeto` is the source subject number.
- `fase` is `pre`, `mision` (in bed rest), or `post`.
- `dia_mision` is days from the start of bed rest; `dia_relativo` for labs is days from launch/landing.
- `br_day` is the source bed-rest day.
- `pas_mmhg` / `pad_mmhg` are systolic / diastolic blood pressure.
- `pulso_lpm` is heart rate in beats per minute.
- `temp_c` is body temperature in °C.
- `analito` is the cleaned analyte name; `analito_original` preserves the source label.
- `atipico` is non-empty when the source pipeline flagged a value as an outlier.

## Caveats

- **UTMB is a ground analog, not spaceflight.** A 6° head-down tilt reproduces fluid shifts and unloading, not radiation, the closed environment, or the full mission stressor set.
- **No SpO₂, mood, radiation, or continuous ECG** in these tables. Those indicators are not present in the open UTMB or Inspiration4 extracts.
- **Temperature does not show the in-flight "space fever" here.** The mean within-subject change in bed rest is +0.04 °C (SD 0.12). The ~1 °C rise reported by Stahn et al. is a spaceflight finding; do not calibrate it from this dataset.
- **Sleep is thin.** Actigraphy covers three subjects and only two pre-bed-rest nights, so there is no reliable personal sleep baseline.
- **Cognition improves with practice.** Reaction times fall by about 10.7 ms per session, so compare by `sesion_n` or use later sessions.
- **Labs contain outliers.** Use `atipico` and inspect the flagged rows before computing statistics. A haemoglobin value of 131 is a probable decimal-point error for 13.1 g/dL.
- **Event free text was removed.** The original descriptions and interventions contain staff names. The structured category, symptom label, pain score, and timing are retained.
- **Not medical advice.** These are research data, not clinical guidance.

## Citation

If you use these tables, cite the primary datasets above and the curation project:

> NASA Life Sciences Portal, UTMB bed-rest datasets (DOIs above); NASA Open Science Data Repository, OSD-569 and OSD-575. Cleaned extracts from `ydtoloza/astronaut-health-dataset`. NASA Space Apps 2026 research snapshot, 2026-11-14.
