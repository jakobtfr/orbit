# Submission checklist

State at Sun 15 Nov 2026, 13:30. **Deadline: today 15:00** (organizer email, Space Apps Heilbronn), one email per team to the local lead. Email text: [`EMAIL.md`](EMAIL.md). Long texts for the Space Apps project page: [`../submission.md`](../submission.md).

Legend: ✅ done · ❌ missing · ⛔ blocked (someone else must act)

## Fields the organizer email asks for

| Item | A (proven limits) | B (+ family call) | Who acts |
|---|---|---|---|
| Team name | ❌ | ❌ | Mohit |
| Project title: ORBIT | ✅ | ✅ | – |
| Chosen challenge: Create Health Monitoring Software for Astronauts on Space Missions | ✅ | ✅ | – |
| Short description + NASA data use | ✅ in `EMAIL.md` | ✅ extra paragraph in `EMAIL.md` | – |
| Project link, opens without login | ✅ `tree/phase-limits` (200) | ⛔ branch `family-call` not pushed with the call yet | family-call session |
| Demo link, ≤ 7 slides or ≤ 30 s video, opens without login | ✅ PDF on `phase-limits` (200), 7 slides | ⛔ deck does not show the family call | slides session |
| Email sent | ❌ | ❌ | Mohit (only Mohit sends) |

## Space Apps rules (global judging)

| Rule | State | Who acts |
|---|---|---|
| Slides show team name, member names, challenge | ❌ Deck at b3c57e9 has no team name or member names | slides session, needs names from Mohit |
| Member names | ❌ unknown | Mohit |
| Space Apps project page filled (spaceappschallenge.org), if the team also submits there | ❌ not verified; text ready in `submission.md` | Mohit / team owner |
| Repository public | ✅ (`visibility: public`) | – |
| Live app link | ⛔ 404: Pages not enabled, PR #1 not merged | repo owner jakobtfr; until then the email does not list it |
| Main branch shows the project | ⛔ main lacks PR #1 (old README, no `docs/demo`) | repo owner: merge PR #1 |
| NASA data named | ✅ `submission.md` "NASA Data", email | – |
| Use of AI stated, true | ✅ A. B: see note below | team checks |
| All external resources listed | ✅ `submission.md` references | – |
| Licence | ❌ no LICENSE file; not required by the email | Mohit decides (repo owner adds) |
| English | ✅ | – |

## Numbers checked against code (13:25)

| Number | Source | Check |
|---|---|---|
| 29 volunteers, 2,184 days | `replay.test.ts` (`t.days = 2184`) | ✅ |
| 13.5% vs 5.9% (2 days), 2.3x | `replay.test.ts` | ✅ 13.5 / 5.9 = 2.29 |
| 25.5% vs 16.5% (1 day), 5.4% at 140/90 | `replay.test.ts` | ✅ |
| Fever +1 °C: 94% vs 8% | `missRate.test.ts` 73/78, 6/78 | ✅ |
| HR +20 bpm: 93% vs 20% | 74/80, 17/84 | ✅ |
| BP +15/+9: 26% vs 50% | 22/84, 36/72 | ✅ |
| 112 tests | `npx vitest run` on a copy of b3c57e9: 112 passed | ✅ |
| 65 planted-problem results rechecked | `uv run scripts/miss_rate_check.py`: same counts | ✅ |
| ~40 h medical training | `docs/research/operations.md` | ✅ |
| "over 40 minutes" per question | operations.md: one-way delay "can exceed 20 minutes"; NASA HRP "up to 20 minutes one way" | ⚠ true only near the longest distance; email avoids it |

## Open notes for version B

- The family call plays `.m4a` "recordings" of demo family members. If these were made with a synthetic voice, they are AI-generated audio and must be acknowledged ("Use of AI"). Ask the family-call session.
- `submission.md` and `README.md` say "No images, video, or audio were generated with SI/AI". This becomes false in B if the AI voice or the demo recordings are synthetic.
- Working tree of `family-call` at 13:24: 147 tests pass, 1 test file fails (`family.test.tsx` imports a missing `familyStore`).
