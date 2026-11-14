# ORBIT app

The ORBIT front end, built from [`../SPEC.md`](../SPEC.md) and [`../DESIGN.md`](../DESIGN.md). React, TypeScript, and Vite. It runs in the browser with no server and no network.

## Run

```sh
npm install
npm run dev                     # development server
npm test                        # unit tests, including the bed-rest replay
npm run build                   # type-check and build to dist/
uv run scripts/replay_data.py   # regenerate src/data/utmb-replay.json from ../data/utmb/
```

The app is shown as Lena Brandt and opens on mission day 100.

## What is where

| Screen | Route | Notes |
| --- | --- | --- |
| Dashboard | `#/body/lena` | Three columns: body map; daily activity with risks and checks; health trends, starting with the "Earth limits vs. your normal" card |
| Region, Muscle group, Indicator, Symptoms, Measure, Check-in | `#/body/lena/...` | Reached from the dashboard |
| Deep Data | `#/deep-data` | Lena's own measurements: pick any indicator and see its trend against her normal, with CSV export |
| My Personal Diary | `#/mental-health` | Private mood, energy, separation reflections, family videos, and local recording |
| Replay | `#/replay` | Real NASA bed-rest data judged by Earth limits and personal rules. `?s=UTMB-40` opens a volunteer |
| Talk to the doctor | `#/doctor` | Button at the top right of every screen |

**Settings** (gear icon in the header) switches between the planet health system (default, surface, with the Dashboard / Deep Data / My Personal Diary navigation) and the flight health system (spacecraft). The setting changes which checks are available and the radiation reference; readings and mission day stay the same.

## Layout

| Path | Contents |
| --- | --- |
| `src/screens/` | One file per screen |
| `src/components/` | App shell, status shapes and tags, tiles, chart, anatomical SVG body |
| `src/components/dashboard/` | Dashboard columns: activity, risks and checks, trend plots, limits card |
| `src/components/research/` | Paper-style plots for Deep Data |
| `src/components/anatomy/` | Front and back SVG paths adapted from Kacmisz/react-body-map (MIT), attribution in `NOTICE.md` |
| `src/lib/judge.ts` | Status rules (simplified from R1 to R12), next actions |
| `src/lib/replay.ts` | Earth cutoffs against personal rules on the real bed-rest days |
| `src/lib/dashboard.ts` | Dashboard metrics, statistics, review bands and their references |
| `src/lib/research.ts` | Rolling means, SD bands, and the medical draft for Deep Data |
| `src/lib/indicators.ts`, `src/lib/anatomy.ts` | Indicators, body regions, muscle groups, and their texts |
| `src/lib/mission.ts` | Mission phase and place for a mission day |
| `src/lib/store.tsx` | App state: readings, check-ins, health system, mental-health entries |
| `src/data/demo.ts` | Lena's scripted readings and the crew names |
| `src/data/utmb-replay.json` | Daily vitals and baselines of 29 NASA UTMB bed-rest volunteers, made by `scripts/replay_data.py` |
| `src/data/utmb-residuals.json` | Day-to-day variation from four UTMB volunteers, used as noise on Lena's series |
| `src/lib/doctor.ts` | The virtual doctor's built-in answers and the briefing given to the local model, both from the readings and the rules in `judge.ts` |
| `src/lib/localModel.ts` | Talks to a language model on this machine through Ollama (`http://localhost:11434`) |
| `public/licenses/` | Licence texts for Inter, Geist Mono (installed, no longer used), and react-body-map |
| `src/styles.css`, `src/dashboard.css`, `src/research.css` | Tokens and base styles; workspace layout; Deep Data. The look follows apple.com, see `../DESIGN.md` |

## Methods

- **Replay.** Earth limits: pulse over 100, blood pressure 130/80 or more, temperature 38.0 °C or more, on any single day. Personal: pulse 20% over the volunteer's own pre-bed-rest mean, blood pressure 20/15 over, or temperature 0.5 °C over, on two days in a row. Tests reproduce 25.5% and 5.9% of days with an alarm.
- **Dashboard plots.** Daily observations with trailing seven-day mean ±1 SD; radiation dose rate from cumulative-dose differences over elapsed time. Thresholds, references, and caveats are in [dashboard methodology](../docs/solution/dashboard-methodology.md).
- **Deep Data.** Lena's own series, the same personal limits and Earth cutoffs as the indicator charts, over 7, 28, or 90 days or the whole mission. The NASA volunteer comparison is Replay, not this screen.

## Limits

- Lena's values are scripted. Only the Replay data and the day-to-day variation of four vital signs come from real ground data.
- Bed rest is a ground stand-in for flight, and its data has no confirmed illness.
- Status rules and review bands are simplified from published values and have not been reviewed by a clinician.
- The virtual doctor is simulated. To let a local model write its answers, run [Ollama](https://ollama.com) with any chat model (`ollama pull llama3.2`); a Llama model is preferred when several are installed. Without it the doctor uses built-in answers. Ollama only accepts calls from pages on `localhost`, so this works with `npm run dev` or `npm run preview`, not from a hosted copy. A local model can still make mistakes. Its wording has not been reviewed by a clinician. Voice mode needs a browser with speech recognition (Chrome, Edge, Safari), which may send audio to the browser's speech service.
- Mission/demo state lives in memory. Diary entries and videos use device-local IndexedDB storage.


## My Personal Diary

The diary logs mood, energy, free-form notes, and optional reflections about distance
from family and friends, recent connection, and support needs. Entries include a
creation timestamp and mission day. They are stored in this browser's IndexedDB and
remain available across navigation and reloads. They are separate from medical
symptom check-ins. Clearing site data removes the diary. Storage failures fall back
to the current session with a visible message.

Family videos can be selected from the device (up to 100 MB), played, and downloaded.
Camera recording requires an explicit click and camera/microphone permission. The
preview is muted; capture starts only after pressing Start recording. Stop & save
closes camera/microphone tracks and stores the clip locally. Recording is capped at
three minutes; leaving the page stops capture. Stored messages can be previewed and
downloaded. There is no upload, sharing service, or automatic transmission to family.
The browser selects a supported MediaRecorder format; unsupported devices and denied
permissions show an error. Localhost and HTTPS support the camera permission flow.

Validation covers compilation, diary page rendering, controls, and unavailable-storage
handling. Physical camera/microphone capture requires a browser/device check.
