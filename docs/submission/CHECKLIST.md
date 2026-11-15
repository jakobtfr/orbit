# Submission checklist

State at Sun 15 Nov 2026, 13:45. **Deadline: today 15:00** (organizer email, Space Apps Heilbronn), one email per team to the local lead. Email text: [`EMAIL.md`](EMAIL.md). Long texts for the Space Apps project page: version A [`submission-A.md`](submission-A.md), version B [`../submission.md`](../submission.md).

Legend: ✅ done · ❌ missing · ⛔ blocked (someone else must act)

## Fields the organizer email asks for

| Item | A (proven limits) | B (+ family call) | Who acts |
|---|---|---|---|
| Team name: Team TUM (from the deck title slide) | ⚠ Mohit confirms | ⚠ Mohit confirms | Mohit |
| Project title: ORBIT | ✅ | ✅ | – |
| Chosen challenge: Create Health Monitoring Software for Astronauts on Space Missions | ✅ | ✅ | – |
| Short description + NASA data use | ✅ in `EMAIL.md` | ✅ extra paragraph in `EMAIL.md` | – |
| Project link, opens without login | ✅ `tree/phase-limits` (200) | ⛔ 404 until `family-call` is pushed | Mohit (push yes) |
| Demo link, ≤ 7 slides or ≤ 30 s video, opens without login | ⚠ old PDF on `phase-limits` opens (200) but has no names; `orbit-demo-fallback.pdf` with names needs `family-call` pushed | ⛔ `orbit-demo.pdf` (7 slides, with names) needs `family-call` pushed | Mohit (push yes) |
| Email sent | ❌ | ❌ | Mohit (only Mohit sends) |

## Space Apps rules (global judging)

| Rule | State | Who acts |
|---|---|---|
| Slides show team name, member names, challenge | ✅ both new decks (on `family-call`); ❌ old deck on `phase-limits` | push `family-call` |
| Member names: Jakob Friedrich, Lukas Fuchs, Mohit Nandanwar, Patryk Ostern (from the deck) | ⚠ Mohit confirms | Mohit |
| Space Apps project page filled (spaceappschallenge.org), if the team also submits there | ❌ not verified; text ready in `submission.md` | Mohit / team owner |
| Repository public | ✅ (`visibility: public`) | – |
| Live app link | ⛔ 404: Pages not enabled, PR #1 not merged | repo owner jakobtfr; until then the email does not list it |
| Main branch shows the project | ⛔ main lacks PR #1 (old README, no `docs/demo`) | repo owner: merge PR #1 |
| NASA data named | ✅ `submission.md` "NASA Data", email | – |
| Use of AI stated, true | ✅ A and B (B names the Kokoro-82M voices; no model in the call) | team checks |
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

## Version B facts, checked at 435ca1d (13:40)

- 158 tests pass (`npx vitest run`).
- No language model in the family call (`app/src/lib/family.ts` header). Fixed the old sentence in `submission.md` that said a model may add a linking line.
- 20 voice files in `app/public/family/` (submission.md said 21; fixed). All are Kokoro-82M speech, stated in README, submission.md and the email.
- Microphone answers in the call: not verified in a real browser. Stated in the B limits.
