# Final email, version B (to send)

**Check before sending:** if commit 8d2f12c (optional on-device language model for small talk in the call) is pushed, add this sentence at the end of the "Use of AI" paragraph:
"In the family call, an optional on-device language model may answer everyday small talk in the family member's character, labelled "AI model"; health talk never reaches it, and code checks every reply before it is shown."
If it is not pushed, send as is. Every other sentence is true either way.

Names confirmed by Mohit, 15 Nov 13:50. Links checked without login at 14:08: live app, repository and PDF on `main` all 200. Due 15:00.

**To:** harasgarzondiaz@gmail.com
**Subject:** ORBIT (Team TUM): an astronaut's own normal, proven on NASA data, and a health check inside a call from home

---

Hi Sarah,

Here is Team TUM's submission for NASA Space Apps Heilbronn 2026.

**Team:** Team TUM (Jakob Friedrich, Lukas Fuchs, Mohit Nandanwar, Patryk Ostern)
**Project:** ORBIT
**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions
**Live app (opens in the browser, nothing to install):** https://jakobtfr.github.io/orbit/
**Code (GitHub):** https://github.com/jakobtfr/orbit
**Demo (7 slides):** https://github.com/jakobtfr/orbit/blob/main/docs/demo/orbit-demo.pdf

**The problem, in one scene**

Day 100 on the way to Mars. An astronaut's temperature reads 38.0 °C. On Earth that is a fever. In weightlessness it is normal: core temperature runs about 1 °C higher. The flight surgeon cannot help in time, because a question and its answer can take up to 48 minutes. The crew's medical lead has about 40 hours of medical training. So the crew decides alone, with a monitor that uses Earth's limits.

Such a monitor fails in two ways:

1. **It cries wolf.** Bodies change in space. Earth's limits raise alarms for healthy crew, the crew learns to ignore them, and then misses the real one.
2. **Nobody wants to use it.** Astronauts are known to under-report symptoms, for fear of being grounded. A health check is one more chore in a full day. And the farther a crew flies, the less contact with home it gets.

**Our two ideas**

1. **Judge every astronaut against their own normal for the current phase of the mission, not Earth's.** Outbound, on Mars, the return, and the days after landing each get their own expected values, learned from NASA data and the astronaut's own readings, and held inside hard bounds so a slow real problem can never be learned as "normal".
2. **Put the health check inside the best moment of the day: a call from home.** A live call is impossible at Mars distance (4 to 24 minutes per direction). So family who opt in record a message each day, and ORBIT plays it as a call. If a reading is off, the call carries one health prompt, word for word from ORBIT's fixed medical rules. A language model never writes a health sentence. The astronaut says the number back, ORBIT saves and judges it, and the call goes on. Urgent words end the call at once and name the medical lead.

**What we proved on real NASA data**

We replayed NASA's UTMB head-down bed-rest study (29 volunteers, 2,184 days of daily vital signs, DOI 10.83263/wjw1-ta27) through both rule sets, with the same two-day rule on both sides:

- **2.3 times fewer false alarms.** Earth's limits alarmed on 13.5% of days (about 1 day in 7), ORBIT on 5.9% (about 1 day in 17).
- **More real problems caught, not fewer.** We planted known problems into the real readings. Fever of +1 °C: ORBIT caught 94%, Earth's limits 8%. Heart rate +20 bpm: 93% against 20%.
- **We show where we lose.** On small blood-pressure rises Earth's limits do better (50% against 26%). The app and our documents show it.

Automated tests reproduce every number. A separate Python script, written apart from the app code, rechecks all 65 planted-problem results and matches. In the live app, the Replay screen lets anyone watch both rule sets judge the same NASA days, volunteer by volunteer.

**What is built, and what the demo changes**

| | In the submitted prototype | In the full ORBIT |
|---|---|---|
| Personal, phase-aware limits | Built and tested on NASA data | Same, then tested on flight data |
| Vital signs | Scripted demo astronaut, with day-to-day scatter from the NASA data | Onboard sensors (smart shirt, wrist tracker) |
| Family messages | Invented people; voices are AI speech (Kokoro-82M), labelled AI on screen and in every file | Real recordings by real family members, with their consent |
| The call | Plays recorded lines and ORBIT's fixed sentences; a language model never writes a health sentence | **Next step, not built yet:** a real-time conversation in the family member's own cloned voice, only with their consent; health sentences stay ORBIT's fixed rules |
| Where it runs | In the browser, no server | On the spacecraft, no contact with Earth needed |

If ORBIT goes to the next round, we would like to show the next step running live on our own machine.

**Honest limits.** Bed rest is a ground stand-in for flight. The in-flight temperature rise comes from an ESA/Charité study of ISS crew, not from NASA bed rest. Mars values are estimates. No clinician has reviewed the limits yet, and the family call is not yet tested with crews or families. ORBIT is a prototype, not a medical device.

**Use of AI.** We used an AI coding assistant (Claude) to help write code, tests and documentation. The demo voices are AI speech from the open model Kokoro-82M, labelled as AI. The team chose the challenge, framed the problem, came up with both ideas and made every product decision.

**Why it matters beyond Mars.** The same two ideas fit anyone far from a doctor: polar stations, ships, remote communities. They could also fit an older parent at home, whose family calls every day anyway.

Thank you for running the event.

Best regards,
Mohit Nandanwar, for Team TUM
