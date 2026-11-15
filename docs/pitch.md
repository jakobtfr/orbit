# ORBIT pitch

Written 2026-11-15. Follows the deck [`demo/deck.html`](demo/deck.html) ([PDF](demo/orbit-demo.pdf)), slide by slide. Every number here is on a slide with its source link. The live app link returned 404 at 13:26, so the slides link the code and the method on GitHub.

## One sentence

On the way to Mars nobody can call home, so ORBIT plays each day's recorded message from family as a call, puts the health check inside that call, and judges every reading against the astronaut's own normal, which we tested on NASA data: 2.3× fewer false alarms and 94% of fevers caught.

## 30 seconds

> "Good morning, Lena." Her mother said that minutes ago. At Mars, a voice from home travels up to 20 minutes, so nobody can have a live call.
>
> Crews far from home get lonely and tired, and they keep quiet about their health. And the health check they have cries wolf: Earth's limits gave healthy people 24 false alarms in six months.
>
> ORBIT puts the health check inside a call from home. Her mother's real recording, an AI voice that only links the recordings, and ORBIT's fixed health rules. Each voice is labelled.
>
> We tested the limits on 2,184 days of NASA data: 2.3 times fewer false alarms, and 94% of fevers caught, against 8%.
>
> Nobody should fly to Mars alone.

## 2 minutes

**Slide 1, the moment.**
> "Good morning, Lena." Her mother said that minutes ago. Lena is our demo astronaut, on day 100 of the flight to Mars. NASA says a signal takes up to 20 minutes one way. The answer takes 20 more. Nobody can talk like that. So what does that silence do to a crew?

**Slide 2, the problem.**
> Three things. Crews get lonely: less contact with family brings growing loneliness. They get tired: ISS crew sleep about 6 hours, with 8 and a half scheduled. And they get quiet: 56% of pilots have avoided healthcare for fear of losing their licence, and the National Academies describe the same fear in astronauts. In Mars simulations, problems are most likely after the halfway point. So who notices when something is wrong?

**Slide 3, why today's tools fail.**
> The health check should notice. But it is a chore, and it cries wolf. We ran Earth's medical limits over NASA data from 29 healthy volunteers. They raised an alarm on 13.5% of days: 24 false alarms per person in six months. The body changes in space. 38.0 degrees is a fever on Earth and normal for Lena in flight. A check that costs crew time and is often wrong gets skipped. What if the check were the moment she waits for all day?

**Slide 4, our idea.**
> ORBIT puts the health check inside a call from home. Family and friends who agreed record a short message every day. ORBIT plays it as a call in Lena's free time. She talks back, and her words go home as her reply. When a reading is off, ORBIT says so inside the call and asks for today's numbers. A machine speaks between her mother's words. Is that safe?

**Slide 5, safety.**
> There are three voices, and each one is labelled on screen. Her mother's own recording, never rewritten, never imitated. An AI voice that only links the recordings, and may not say one word about health. And ORBIT: every health sentence comes word for word from fixed rules. No language model writes one. An urgent symptom ends the role-play and names the medical lead. But rules are only as good as the limits behind them.

**Slide 6, the proof.**
> So we tested the limits on 2,184 days of NASA bed-rest data. Same two-day rule on both sides: Earth's limits alarm on 13.5% of days, ORBIT on 5.9%. That is 2.3 times fewer false alarms. And it misses less. We planted known problems into the same data: ORBIT caught 94% of fevers, Earth's limits 8%. One honest weak spot: for small blood-pressure rises, Earth's limits catch more, 50% against 26%.

**Slide 7, why it matters.**
> "Good morning, Mama." Lena's reply is on its way home, and her blood pressure is logged. Next comes video, when an open-source face model is good enough. ORBIT is a prototype, not a medical device. Nobody should fly to Mars alone.

## If the team submits the app without the family call

Use [`demo/deck-fallback.html`](demo/deck-fallback.html) ([PDF](demo/orbit-demo-fallback.pdf)). Slides 1 to 3 are the same. Slide 4 is the limits ("ORBIT judges Lena against her own normal"), slide 5 the proof, slide 6 the family call as the next step, marked as not in the submitted app. For this version, speak about the call in the future: "next, we put the health check inside a call from home". Do not say "ORBIT plays it as a call".

## Hard questions

### The family call

| Question | Answer |
|---|---|
| "Is this creepy? An AI that plays her mother?" | "It does not play her mother. Her mother's voice is her own recording, played as recorded. The AI voice only links the recordings, says it is an AI, and is labelled on screen. Both sides opt in, and either can stop." |
| "Does the AI give medical advice?" | "No. Every health sentence is taken word for word from ORBIT's fixed rules. The language model never sees her readings, and a filter blocks any model sentence that mentions health." |
| "Does it waste crew time?" | "It is offered only in free time, after waking and before sleep. The check happens inside a call she wants to take, so it replaces a chore; it does not add one." |
| "What does NASA see?" | "Only the readings. A reading she says in the call is saved to her health record as self-reported. The private talk is kept encrypted on the device, apart from the health record, and the medical lead cannot see it." |
| "What if she says she feels fine?" | "ORBIT goes by the reading, not by the feeling. It asks again for the number." |
| "What about an emergency in the call?" | "Chest pain or trouble breathing ends the role-play at once. ORBIT speaks alone and names the medical lead." |
| "Can you send a daily recording to Mars?" | "A signal takes up to 20 minutes one way, so it arrives late, not live. That is why it is a recording." (Data-rate figures: being checked; do not quote a number until verified.) |
| "Why no video?" | "We left it out on purpose. We found no open-source face model good enough to put a family on screen. Video is the next step." |
| "Is the voice in the demo real?" | "No. Lena's family is invented, so in the demo every voice is generated speech, and the slide says so. In the design, the family part is the person's own recording." |

### The limits and the proof

| Question | Answer |
|---|---|
| "Bed rest is not spaceflight." | "Right. It is NASA's standard ground stand-in, and the only daily vital-sign data NASA gives for this. Every limit in the app is labelled: NASA data, outside NASA, or estimate." |
| "Your 38.0 example is not NASA data." | "Correct. It is an ESA/Charité study of 11 ISS astronauts (Stahn 2017). NASA bed rest shows no rise. The app says so on the screen." |
| "Fewer alarms: just never alarm?" | "That is why we measured misses. Fevers and heart-rate changes: we catch far more. Small blood-pressure rises: Earth's limits catch more. Danger values never move." |
| "If she is sick while it learns, sickness becomes normal." | "The offset is learned once per phase, in days 14 to 28, then held. It is capped at NASA's spread between people. Fixed danger values never move." |
| "Where do +20%, +20/15 and +0.5 °C come from?" | "They are our prototype thresholds. Next step: set them from each person's day-to-day scatter in the NASA data." |
| "Were all volunteers healthy every day?" | "They were screened healthy volunteers. We count every alarm as false; a few may be real. We have not checked the symptom records yet." |
| "Two days in a row delays a real alarm." | "Not for the danger values. Systolic under 80, blood oxygen under 90% and temperature of 39.5 °C alarm on the first reading." |
| "Pilots are not astronauts." | "Correct. The 56% is from 3,765 US pilots. For astronauts we cite the National Academies report, which describes the same fear without a number." |
| "Mars values?" | "Estimates. NASA has no long-stay data at Mars gravity. The app labels them." |
| "Has a clinician or a user tested it?" | "Not yet. That is the next step." |
| "Is this a medical device?" | "No. A prototype. Lena, her family and her readings are scripted." |

## Do not say

- "AI family member" or "AI mother". Say "a call built from her mother's recordings".
- "ORBIT is better at everything." Name the blood-pressure weak spot first.
- "4 to 24 minutes, says NASA." The NASA page we link says "up to 20 minutes one way".
- "Medication use is 10 times higher than records show." The source does not say that.

## Sources on the slides

| Claim | Source |
|---|---|
| Signal delay up to 20 minutes one way | [NASA Human Research Program](https://www.nasa.gov/hrp/hazard-distance-from-earth/) |
| Less family contact, growing loneliness; delay up to 24 minutes each way | [Gushin et al. 2021](https://doi.org/10.3389/fphys.2021.750414) |
| "Limited Communication with Home" as a stressor | [NASA OCHMO-TB-016](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-016-behavioral-health.pdf) |
| 6.1 h sleep on the ISS, 8.5 h scheduled; 12 of 16 crew used sleep medication | [Barger et al. 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4188436/) |
| 56.1% of 3,765 US pilots avoided healthcare | [Hoffman et al. 2022](https://doi.org/10.1097/JOM.0000000000002519) |
| Astronauts' reluctance to report | [National Academies, Safe Passage, 2001, p. 174](https://www.nationalacademies.org/read/10218/chapter/8#174) |
| Problems most likely after the halfway point | [Rosenberg et al. 2022](https://doi.org/10.3389/fphys.2022.898841) |
| +1 °C body temperature in flight | [Stahn et al. 2017](https://doi.org/10.1038/s41598-017-15560-w) |
| Crew time "the most restricted resource" | [NASA ISS Medical Projects, 2017](https://ntrs.nasa.gov/api/citations/20170000487/downloads/20170000487.pdf) |
| 13.5% vs 5.9%, 24 vs 11 alarms, planted problems | NASA data: [doi:10.83263/wjw1-ta27](https://doi.org/10.83263/wjw1-ta27). Method: [`research/miss-rate.md`](research/miss-rate.md), [`research/phase-limits.md`](research/phase-limits.md) |
