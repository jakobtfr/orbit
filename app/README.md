# ORBIT app

Version 1 of the ORBIT front end, built from [`../SPEC.md`](../SPEC.md) and [`../DESIGN.md`](../DESIGN.md). It runs in the browser with no server; all data is scripted.

## Run

```sh
npm install
npm run dev      # development server
npm run build    # type-check and build to dist/
npm test         # checks the fake logic and that the replay reproduces the bed-rest data check
uv run scripts/replay_data.py   # regenerates src/data/utmb-replay.json from ../data/utmb/
```

The app is shown as Lena Brandt. The anatomical body map uses SVG and works without WebGL. Switch between Front and Back, then select a region with the pointer or keyboard to open its health indicators.

## Layout

| Path | Contents |
| --- | --- |
| `src/screens/` | Body, region, indicator, measure, check-in, emergency, and Replay |
| `src/components/` | Status shapes and tags, tiles, next-action card, chart, interactive anatomical SVG body, dashboard panels, app shell |
| `src/components/anatomy/` | Front/back SVG paths adapted from Kacmisz/react-body-map, with attribution in `NOTICE.md` |
| `src/lib/indicators.ts` | The indicators, body regions, and their texts |
| `src/lib/judge.ts` | The fake logic: status rules, who sees what, next actions |
| `src/lib/mission.ts` | The mission plan: phase and place for a mission day |
| `src/lib/replay.ts` | Earth cutoffs against personal rules, replayed on real UTMB bed-rest days |
| `src/lib/store.tsx` | App state: mission day, readings, check-ins |
| `src/data/demo.ts` | The four scripted crew members and their readings |
| `src/data/utmb-residuals.json` | Day-to-day variation taken from four NASA UTMB bed-rest subjects (`../data/utmb/daily_vitals.csv`), used as noise on the scripted series |
| `src/data/utmb-replay.json` | Daily vitals and baselines of 29 NASA UTMB bed-rest subjects, made by `scripts/replay_data.py` |
| `src/data/emergency.ts` | Draft emergency steps. Not a protocol |
| `public/licenses/` | SIL Open Font License texts for Inter and Geist Mono |

## Limits

- Every value outside Replay is demo data. Levels and trends are invented; only the day-to-day variation of four vital signs is replayed from real ground data.
- Replay uses real, unaltered bed-rest values. Bed rest is a ground stand-in for flight, and the data has no confirmed illness.
- The status rules are simplified forms of R1 to R12 and have not been reviewed by a clinician.
- Emergency steps and all guidance wording are drafts without a source.
- State lives in memory. Reloading the page resets the demo.

## Personal dashboard

The home screen has four desktop columns: interactive anatomy; activity rings and
reminders; a mock weekly brief and review outlook; and five scientific-style plots.
At smaller widths the layout switches to two columns, then one.

- Heart rate, core temperature, nightly sleep, radiation dose rate, and cabin CO2.
- 14/28-day controls; seven non-overlapping bins with mean ±1 sample SD.
- Window SD, sample variance, sample count, threshold lines, and expandable tables
  and references. SD is variability in the demo series, not measurement uncertainty.
- Radiation rates are calculated from cumulative dose differences divided by elapsed
  days. A constant simulated rate legitimately has zero sample SD.
- The AI brief is a template over demo values; no illness or solar-event prediction
  model is connected. Reminder times are explicitly a demo schedule.

See [dashboard methodology](../docs/solution/dashboard-methodology.md) for threshold
scope, source links, hazard mapping, and validation.
