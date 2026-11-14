# Open Data and Open-Source Sources

Searched 2026-11-14. The challenge's **Resources** tab lists five pages — NASA HRP's five hazards, the HRP risk list, ongoing HRP research, and two CSA articles — but **no dataset**. The sources below are where the actual open data is.

## At a glance

| Source | Type | What you get | Access | Licence |
| --- | --- | --- | --- | --- |
| **UTMB bed rest via NASA NLSP** | Ground analog | 2,939 subject-days of daily vitals, 8,036 lab values, sleep, tilt, cognition, symptoms | Public download | CC0-1.0 per DataCite |
| **Inspiration4 via NASA OSDR** | Real spaceflight | Blood counts, metabolic panel, CRP, cytokines from 4 crew, pre/post flight | Public download | CC0-1.0 |
| **NASA Flight Crew Physiological Data** | Real flight-crew signals | 256 Hz ECG, EEG, respiration, GSR from 18 pilots, with cognitive-state labels | Direct ZIPs | Not specified |
| **ASPA** | Astronaut metadata | Biographical and mission records, 1959–2023 | GitHub | ODC-By 1.0 |
| **NASA OSDR** | Space life sciences | 94 human studies in a `Homo sapiens` query; omics, phenotypic, behavioural | API / S3 | Open access |
| **ESA HREDA** | Partner agency | Human and robotic exploration investigations since 1972, incl. bed rest and isolation | Registration required | Per dataset |
| **NASA-STD-3001 / HRP evidence** | Standards and aggregates | Thresholds, risk evidence, prevalence figures | Public PDFs | Public |
| **PhysioNet** | Terrestrial clinical | ECG, PPG, sleep, ICU vitals for signal realism | Open or credentialed | Per dataset |

## 1. UTMB bed rest via NASA NLSP — the best fit for daily vitals

NASA's Life Sciences Portal has **30 UTMB bed-rest experiments marked public**, 28 with all datasets available. These are 60–70 day, 6° head-down tilt studies: NASA's standard ground analog for microgravity. The data are subject-level, not summaries.

| Dataset | Contents | Coverage |
| --- | --- | --- |
| Case Report Form | Daily pulse, systolic/diastolic BP, respiration, temperature, weight; symptom records | 2,939 subject-days, 29 subjects |
| Clinical Laboratory Assessment | Haematology, chemistry, CRP, urinalysis, electrophoresis | 8,036 values, 31 subjects |
| Response to Tilt | Supine vs tilted pulse and systolic BP | 78 tests, 26 subjects |
| Actilight | Sleep duration, efficiency, latency | 190 nights, 3 subjects |
| WinSCAT | Working memory, arithmetic, match-to-sample, delayed code substitution | 302 sessions, 29 subjects |

**Access:** the NLSP pages are JavaScript apps. The DOI links resolve to the experiment records; the download button is on the page. The public metadata API is:

```
https://nlsp.nasa.gov/api/v1/data/experiments/<GUID>/full
```

**DOIs:**

- Case Report Form — [10.83263/wjw1-ta27](https://doi.org/10.83263/wjw1-ta27)
- Clinical Laboratory Assessment — [10.83263/rank-k271](https://doi.org/10.83263/rank-k271)
- Response to Tilt — [10.83263/gz1q-a824](https://doi.org/10.83263/gz1q-a824)
- Actilight — [10.83263/v7n1-ht75](https://doi.org/10.83263/v7n1-ht75)
- WinSCAT — [10.83263/sbne-th55](https://doi.org/10.83263/sbne-th55)

**Caveats:** it is a ground analog. It has no SpO₂, mood, radiation, or continuous ECG. Body temperature did **not** rise in bed rest (mean within-subject change +0.04 °C), so it cannot calibrate the ~1 °C in-flight "space fever." Sleep is only three subjects.

## 2. Inspiration4 via NASA OSDR — real spaceflight labs

The 2021 SpaceX Inspiration4 mission flew four civilian astronauts for three days. OSDR hosts the processed biomedical data, including complete blood counts, a comprehensive metabolic panel, CRP, and cytokine arrays at seven timepoints from 92 days before launch to 194 days after landing.

- Whole blood / CBC: [OSD-569](https://osdr.nasa.gov/bio/repo/data/studies/OSD-569)
- Serum metabolic panel and cytokine arrays: [OSD-575](https://osdr.nasa.gov/bio/repo/data/studies/OSD-575)
- Related I4 studies: OSD-570, 571, 572, 573, 574, 630, 656, 687

**Licence:** CC0-1.0. **Caveat:** no in-flight continuous vitals, and only four crew on a three-day mission.

## 3. NASA Flight Crew Physiological Data — real signals at 256 Hz

NASA's Open Data Portal hosts physiological recordings from **18 pilots** in and out of a flight simulator: 20 EEG channels, 3-point ECG, respiration, and galvanic skin response at **256 Hz**. The benchmark files induce channelized attention, diverted attention, or startle/surprise; the LOFT files are full simulator flights with the same state labels.

- Dataset page: https://data.nasa.gov/dataset/flight-crew-physiological-data-for-crew-state-monitoring
- Direct ZIP pattern: `https://data.nasa.gov/docs/datasets/public/csm/5.zip` (18 subject ZIPs, IDs 5–26; subject 5 is ~115 MB)
- Description: https://data.nasa.gov/docs/datasets/public/csm/description.txt

**Use for:** real ECG/EEG/GSR signal pipelines, attention and fatigue analytics, and realistic sensor noise. **Caveat:** pilots in a simulator, not astronauts; no BP, SpO₂, temperature, or sleep.

## 4. ASPA — astronaut and spaceflight-participant archive

A validated database of astronauts and spaceflight participants from **1959 to 2023**: biographical data, mission records, organisations, craft, and programme links. Distributed as SQLite and CSV.

- Repository: https://github.com/OSMED-admin/aspa
- Licence: ODC-By 1.0
- Method paper: Kanikkannan, Hogan & Reynolds, *Scientific Data* (submitted 2025)

**Use for:** cohort context, mission dates, agency and programme stratification, and denominators for event rates. **Caveat:** no vitals or clinical measurements.

## 5. NASA OSDR — the broad space life sciences repository

OSDR combines GeneLab and the Ames Life Sciences Data Archive. It holds multi-modal spaceflight data: omics, phenotypic, physiological, behavioural, imaging, and environmental. A `Homo sapiens` metadata query returns **94 studies**, including the NASA Twins Study, Inspiration4, JAXA CFE, and Axiom/Polaris data through SOMA.

- Portal: https://osdr.nasa.gov/bio/repo/
- Biological Data API: https://visualization.osdr.nasa.gov/biodata/api/
- API tutorial: https://github.com/nasa/OSDR_Tutorials
- AWS Open Data bucket: `arn:aws:s3:::nasa-osdr` (no AWS account required)
- Registry entry: https://registry.opendata.aws/nasa-osdr/
- SOMA browser: https://soma.weill.cornell.edu/apps/SOMA_Browser/

**Caveat:** mostly molecular and sample-level. It is not a source of continuous mission vitals.

## 6. ESA HREDA — partner-agency human exploration data

The HRE Data Archive collects investigations funded or co-funded by ESA's Human and Robotic Exploration directorate, performed on microgravity and ground-based facilities since **1972**. It includes bed-rest, isolation, and physiological studies.

- Portal: https://hreda.esac.esa.int/hreda/
- Help and scripting interface: https://hreda.esac.esa.int/hreda-help/
- Overview: https://cosmos.esa.int/web/hreda

**Access:** registration is required, and authentication is mandatory to download any science data, including public data. **Caveat:** not a turnkey download; budget time for account approval.

## 7. Standards and aggregate evidence

These are not row-level datasets, but they are the authoritative source for thresholds and prevalence:

- NASA-STD-3001 Volume 1 (crew health, radiation): https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf
- NASA-STD-3001 Volume 2 (environment, CO₂, PIO₂): https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_2
- OCHMO technical briefs: https://www.nasa.gov/reference/6-0-medical-operations/
- HRP evidence reports: https://humanresearchroadmap.nasa.gov/evidence/
- HRP risk index: https://www.nasa.gov/hrp/risks/

## 8. PhysioNet — terrestrial clinical data for signal realism

PhysioNet hosts open and credentialed clinical datasets. Useful examples:

- Sleep-EDF / BIDSleep — sleep staging from EEG, EOG, EMG, heart rate, accelerometry
- MIMIC-IV — ICU vitals, labs, and waveforms (credentialed)
- WESAD — wearable stress and affect, ECG/EDA/PPG
- PPG-DaLiA — PPG and accelerometry during daily activity

- Portal: https://physionet.org/
- Access tiers vary: some datasets are open, others require a verified account and a data-use agreement.

**Use for:** validating ECG/PPG pipelines, sleep staging, and anomaly detection. **Caveat:** terrestrial patients, not astronauts.

## 9. Open-source repositories

| Repository | What it provides | Notes |
| --- | --- | --- |
| [`nasa/OSDR_Tutorials`](https://github.com/nasa/OSDR_Tutorials) | Runnable examples for the OSDR Biological Data API | Official NASA |
| [`nasa/AI4LS`](https://github.com/nasa/AI4LS) | AI for Life in Space projects, including `OSDR_MCP_Server` | Official NASA; code, not clinical data |
| [`OSMED-admin/aspa`](https://github.com/OSMED-admin/aspa) | ASPA astronaut database, SQLite + CSV | ODC-By 1.0 |
| [`ydtoloza/astronaut-health-dataset`](https://github.com/ydtoloza/astronaut-health-dataset) | Cleaned UTMB + Inspiration4 tables with a reproducible pipeline and an independent source audit | Community project; underlying data CC0; code has no licence |
| [`justinecua/strelka-space-apps-2026`](https://github.com/justinecua/strelka-space-apps-2026) | MIT-licensed Space Apps 2026 prototype with 180 days of synthetic mission data | Community; synthetic, not authoritative |

## 10. What is not openly available

- **Continuous in-flight astronaut vitals** — heart rate, BP, SpO₂, sleep, and mood time series from ISS or commercial missions are privacy-protected medical data.
- **NASA flight rules and MORD thresholds** — the operational limits used by flight surgeons are not public.
- **Crew medical records** — diagnoses, treatments, and clinical notes are not released.

Any row-level mission timeline therefore has to be **analog-derived, literature-calibrated, or synthetic**, and labelled as such.

## Mapping indicators to sources

| Indicator | Best open source | Note |
| --- | --- | --- |
| Heart rate | UTMB daily pulse; NASA flight-crew ECG | Real analog daily values and real 256 Hz ECG |
| Blood pressure | UTMB daily systolic/diastolic; UTMB tilt | No in-flight BP |
| Temperature | UTMB daily temperature | Analog only; no space-fever signal |
| Respiration | UTMB daily respiration; flight-crew respiration | Real values |
| Weight | UTMB daily weight | Fluid-shift confounded |
| Sleep | UTMB actigraphy; PhysioNet sleep datasets | UTMB only 3 subjects |
| Cognition | UTMB WinSCAT | Practice effect |
| Orthostatic response | UTMB tilt | 78 tests |
| Symptoms / events | UTMB event records | Structured fields; free text removed |
| Labs | UTMB labs; Inspiration4 labs | Real analog and real flight |
| SpO₂ | No open space data | Use clinical waveforms or label synthetic |
| Mood | No open space data | Label synthetic |
| Radiation | No row-level open data | Use published ISS dose rates and mission dates |
| CO₂ / environment | NASA-STD-3001 | Standard, not a time series |
| Vision / SANS | HRP evidence reports | Aggregate prevalence only |

## Access notes

- **NLSP:** DOI links resolve to experiment pages. The download UI is JavaScript-driven; the metadata API above is public.
- **OSDR:** use the Biological Data API or the S3 bucket. Cite each OSD accession.
- **NASA Open Data Portal:** CKAN API at `https://data.nasa.gov/api/3/action/package_search?q=<term>`.
- **ESA HREDA:** register before downloading; authentication is required even for public data.
- **PhysioNet:** check the access tier for each dataset before planning around it.
