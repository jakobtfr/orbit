# What in the demo is staged, and what is real

ORBIT is a prototype. This page says plainly which parts of the demo run for real, which parts are staged for the demo, and what the product would do in place of the staged parts. The same labels are on screen in the app.

## Real and tested

| Part | What runs | How it is checked |
|---|---|---|
| Phase-aware personal limits | Every reading is judged against the astronaut's own normal for the mission phase | Automated tests; the Replay screen reruns NASA's UTMB bed-rest data (13.5% against 5.9% alarm days) |
| The health prompt inside the family call | ORBIT's fixed rule is read out word for word. No language model writes it | Tests compare each health sentence with the rule's own text |
| A reading said or typed in the call | Saved to the health record and judged again; "I am fine" is not accepted as a reading | Tests, and clicked through in the running app |
| Symptoms and urgent words | A symptom gets ORBIT's fixed answer. Urgent words end the call and name the medical lead | Tests, and clicked through in the running app |
| The call as the reward for today's check | The day's family messages stay locked until today's daily check-in is saved; then they unlock and the call rings. Who has sent something is shown while locked | Tests, and clicked through in the running app |
| Opt-in of both sides | No message is shown unless the astronaut and the sender are both opted in, and not before the signal can have arrived | Tests |
| Private conversation | Stored on the device with AES-GCM encryption and a key the browser will not export, apart from the health record. Readings, symptoms and urgent words are never stored in it | Tests, and checked in the browser's storage |

## Staged for the demo

| Part | What you see | What it really is |
|---|---|---|
| The people | Marta, Jonas and Priya, the astronaut Lena Brandt, the crew | Invented. No real person's name, voice or data is used |
| The "recorded" messages | Labelled "Recorded on Earth · demo: AI-generated stand-in voice" | Text written by the team, spoken by the open speech model Kokoro-82M (Apache 2.0) with its synthetic preset voices. Every audio file says "AI-generated speech" in its metadata |
| "Talk freely": the suggestions | Tap, type or say one of the suggested things and the person answers in their voice | 16 replies written by the team, 5 or 6 per person, rendered ahead of time with Kokoro-82M. The follow-up suggestions are fixed. A notice "Staged demo … not the real person, not live" stays on screen while it is on |
| "Talk freely": anything else, without a model | "I cannot answer that yet. This demo only covers a few topics…", or one of about 180 short preset lines when the words match one of 22 everyday topics | Fixed text written by the team, spoken by the browser's own voice. This is what the live site does |
| "Talk freely": anything else, with a model | A reply "written by an AI model in Marta's character · not Marta" | Only where Ollama runs on the same machine (tested with Qwen3 8B, Apache 2.0). Two checks in code guard it: health talk never reaches the model, and each reply is checked before it is shown. The check is a word list and cannot catch everything |
| "Talk freely": anything else, on the live site | A button "Load an AI model in this browser (about 0.9 GB)". After it loads, replies are "written by an AI model in Marta's character · not Marta" | For the demo only. The open model Qwen2.5 1.5B (Apache 2.0) is downloaded once into the browser with WebLLM (Apache 2.0) and runs on the judge's own laptop through WebGPU; nothing typed leaves it. Chrome or Edge only. It is a small model: its answers are simpler than the product's would be, and it sits behind the same two checks in code |
| Signal delay | "signal 5 min one way" on mission day 100 | An illustrative curve inside NASA's range of about 4 to 24 minutes, not an ephemeris |
| The astronaut's readings | Low blood pressure on day 100 | Scripted, with day-to-day variation taken from NASA's bed-rest data |
| Speech recognition | You can speak in Chrome | The browser's own recognition; in Chrome the audio goes to a server. A flight version needs an on-board model |

## What the product would do instead

- **Real recordings.** Family, friends and colleagues who opted in record their own messages. ORBIT plays them unchanged.
- **A model per family member, on board.** For free conversation, a small open model for each person, built only from that person's own conversations, with their consent. It runs on the ship. Nothing leaves the ship, and nothing is sent back to Earth except the astronaut's own replies.
- **Always labelled.** Every call stays labelled as AI, and every line says whether it is a recording, an AI model, or ORBIT.
- **Health stays with fixed rules.** However good the model gets, health prompts, symptoms, readings and urgent words stay with ORBIT's fixed rules and the medical lead.
- **Not yet known.** Whether a health prompt inside a call from home helps, or harms trust in the call, has not been tested with crews or families.
