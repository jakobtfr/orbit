# ORBIT app

Version 1 of the ORBIT front end, built from [`../SPEC.md`](../SPEC.md) and [`../DESIGN.md`](../DESIGN.md). It runs in the browser with no server; all data is scripted.

## Run

```sh
npm install
npm run dev      # development server
npm run build    # type-check and build to dist/
uv run scripts/replay_data.py  # regenerate the NASA bed-rest replay
npm test         # checks the scripted demo statuses and the fake logic
```

The app is shown as Lena Brandt. The anatomical body map uses SVG and works without WebGL. Switch between Front and Back, then select a region with the pointer or keyboard to open its health indicators.

## Layout

| Path | Contents |
| --- | --- |
| `src/screens/` | Dashboard, muscle details, indicators, measurements, check-in, symptoms, and NASA Replay |
| `src/components/` | Status shapes and tags, tiles, next-action card, chart, interactive anatomical SVG body, chat preview, app shell |
| `src/components/anatomy/` | Front/back SVG paths adapted from Kacmisz/react-body-map, with attribution in `NOTICE.md` |
| `src/lib/indicators.ts` | The indicators, body regions, and their texts |
| `src/lib/judge.ts` | The fake logic: status rules, who sees what, next actions |
| `src/lib/mission.ts` | The mission plan: phase and place for a mission day |
| `src/lib/store.tsx` | App state: mission day, readings, check-ins |
| `src/data/demo.ts` | The four scripted crew members and their readings |
| `src/data/utmb-residuals.json` | Day-to-day variation taken from four NASA UTMB bed-rest subjects (`../data/utmb/daily_vitals.csv`), used as noise on the scripted series |
| `src/data/emergency.ts` | Chest pain or collapse steps, each citing ERC 2021, AHA 2020, or the DGLRM/ESAM-SMG microgravity CPR guideline |
| `public/licenses/` | SIL Open Font License texts for Inter and Geist Mono |

## Limits

- Every value is demo data. Levels and trends are invented; only the day-to-day variation of four vital signs is replayed from real ground data.
- The status rules are simplified forms of R1 to R12 and have not been reviewed by a clinician.
- State lives in memory. Reloading the page resets the demo.
- Emergency steps follow published first-aid guidelines but have not been reviewed by a clinician.

## Personal dashboard

The home screen has four desktop columns: interactive anatomy; activity rings and
reminders; a mock weekly brief and review outlook; and three scientific-style plots.
At smaller widths the layout switches to two columns, then one.

- Heart rate, core temperature, and radiation dose rate.
- 14/28-day controls; daily observations and trailing seven-day mean ±1 SD bars.
- Solid threshold lines, subtle reference bands, and expandable statistics tables
  and references. SD is variability in the demo series, not measurement uncertainty.
- Radiation rates are calculated from cumulative dose differences divided by elapsed
  days, preserving fractional dose precision. Seeded drift adds illustrative variation.
- The AI brief is a template over demo values; no illness or solar-event prediction
  model is connected. Reminder times are explicitly a demo schedule.

See [dashboard methodology](../docs/solution/dashboard-methodology.md) for threshold
scope, source links, hazard mapping, and validation.

## Header settings

Open Settings beside the astronaut name to select Planet health system or Flight
health system. This sets the evaluation environment to surface or spacecraft,
respectively. Gravity-based check availability and radiation design references
follow this selection. Recorded readings and mission day are preserved; selecting
an environment does not manufacture new measurements. The selection lasts for the
current browser session until reload, like the rest of the demo state.

Flight and Sources pages have been removed. Emergency is a button at the top right of every screen.
Scientific references remain available in each plot's Details.

## Planet workspace

Planet mode opens by default. Its floating header links to Dashboard, Deep Data,
and Mental Health. Selecting Flight mode hides the Planet navigation.

Deep Data supports measurement and 7/28/90-day filters, raw readings, descriptive
statistics, baseline/threshold charts, and CSV export. Mental Health keeps private
mood, energy, and journal entries in provider memory while navigating between pages.
Reloading clears them. The optional 60-second breathing timer can be stopped and
respects reduced-motion settings. Mental check-ins are independent of the symptom
check-in; saving a journal entry does not mark the medical check-in complete.

## NASA bed-rest replay

The existing real-data replay remains available at `#/replay`, linked from Deep Data.
`src/lib/replay.ts` compares fixed Earth limits with personal rules using the real
UTMB extracts in `src/data/utmb-replay.json`. Regenerate them with
`uv run scripts/replay_data.py`. Bed-rest records are ground analog data, not
spaceflight measurements or confirmed illness events.
