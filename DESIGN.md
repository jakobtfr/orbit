# ORBIT Design Guidelines

Written 2026-11-14, updated the same day for version 2. One dark theme, no light theme yet.

**Style.** ORBIT follows the look of apple.com in its dark sections: a black canvas, neutral rounded tiles without borders, the system font, pill-shaped buttons and controls, generous spacing, and no gradients, glows, or tinted panels. Colour is kept for status and for the one primary action. Tokens live in `app/src/styles.css`; the workspace screens (Dashboard, Measurements, Mental Health) are laid out in `app/src/dashboard.css` and `app/src/research.css` with the same tokens.

How ORBIT looks and reads. Every screen, the demo video, and the slide deck follow this file. Copy-paste values are in [Tokens](#tokens).

## Principles

| ID | Principle | What it means in practice |
| --- | --- | --- |
| **D1** | Quiet until something needs attention | A screen where everything is in range is almost entirely greyscale. Colour appears only where a status calls for it. |
| **D2** | Colour carries meaning, never decoration | Each status colour has one meaning and is used for nothing else. No gradients, glows, or coloured backgrounds for mood. |
| **D3** | Hierarchy through brightness, not size or colour | The value the crew needs is the brightest thing on screen. Labels, navigation, and borders step down in brightness. |
| **D4** | One job per screen | Each screen answers one question and offers one primary action. No menus inside menus. |
| **D5** | Never colour alone | Every status is shown by colour, a shape, and a word together. |

D2 and D5 are requirements of NASA's display standard, not only taste: colour "must be used to convey meaning, and not for decoration or aesthetic purposes", and critical colour coding needs an additional cue (NASA-STD-3001 Volume 2, Appendix F, section F.5.10).

## Name and mark

- **Name:** written `ORBIT`, all capitals, in every context.
- **Wordmark:** `ORBIT` in the system font, weight 600, letter-spacing 0.04em, colour `text-primary`.
- **Mark:** a ring with one dot on it. Use it alone where the wordmark does not fit, such as an app icon.
- **Colour:** the mark and wordmark are `text-primary` on `bg-canvas` only. Never a status colour, never the accent.
- **Clear space:** at least the height of the letter O on every side.
- **NASA insignia:** do not use the NASA logotype, insignia, or seal anywhere. Their use is restricted by US law (14 CFR 1221).

```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="17.66" cy="6.34" r="2.25" fill="currentColor"/>
</svg>
```

## Colour

Contrast figures are WCAG contrast ratios, calculated for this file. Text must reach 6:1 on its background, the minimum in NASA's display standard; 10:1 is preferred for anything the crew acts on.

### Surfaces and borders

| Token | Hex | Use |
| --- | --- | --- |
| `bg-canvas` | `#000000` | Page background |
| `bg-surface` | `#1D1D1F` | Tiles and cards |
| `bg-raised` | `#2C2C2E` | Tiles inside tiles, inputs, secondary buttons, popovers |
| `bg-hover` | `#3A3A3C` | Hover and selected states, the selected segment |
| `border-subtle` | `#2C2C2E` | Hairlines between list rows inside a tile |
| `border` | `#3A3A3C` | Rarely used; tiles have no edge |
| `border-control` | `#636366` | Chart frames and limit lines |

### Text

| Token | Hex | On canvas | On surface | Use |
| --- | --- | --- | --- | --- |
| `text-primary` | `#F5F5F7` | 19.3:1 | 15.5:1 | Values, headings, anything acted on |
| `text-secondary` | `#D2D2D7` | 13.9:1 | 11.2:1 | Body text |
| `text-muted` | `#A1A1A6` | 8.2:1 | 6.5:1 | Labels, units, timestamps, captions |

There is no dimmer text colour. Nothing that must be read is darker than `text-muted`. On `bg-raised`, `text-muted` drops to 5.4:1; use it there only for units and captions next to a brighter value.

### Accent

| Token | Hex | Contrast | Use |
| --- | --- | --- | --- |
| `accent` | `#4AA3FF` | 8.0:1 on canvas, 6.4:1 on surface | Links, focus rings, selected outlines |
| `accent-fill` | `#005FC4` | 6.1:1 with white text | Background of the one primary button per screen |
| `text-on-accent` | `#FFFFFF` | | Text on `accent-fill` |

The blues are darkened from Apple's `#2997FF` and `#0071E3` to reach 6:1. The accent marks things the crew can act on. It never carries a status. ORBIT has no advisory alert level; if one is added, revisit the accent first, because NASA assigns blue to advisory alerts.

### Status

The colours for warning, caution, no recent data, and unavailable follow the required colour table in NASA's display standard (Table F.5-1). Green for "in range" is our own addition; the standard assigns no colour to a normal state.

| State | Token | Hex | On canvas | Shape | Label | When |
| --- | --- | --- | --- | --- | --- | --- |
| In range | `status-ok` | `#30D158` | 10.4:1 | Filled circle | In range | The rule's green band |
| Caution | `status-caution` | `#FFD60A` | 14.9:1 | Triangle | Caution | The rule's amber band, confirmed |
| Warning | `status-warning` | `#FF6961` | 7.4:1 | Diamond | Warning | The rule's red band |
| No recent data | `status-stale` | `#64D2FF` | 12.2:1 | Dashed ring | No recent data | The last reading is older than the indicator's maximum age ([SH8](docs/research/scientific-constraints.md#hard-constraints)) |
| Unavailable | `status-unavailable` | `#8E8E93` | 6.4:1 | Dash | Unavailable | The rule is switched off in this environment ([SH4](docs/research/scientific-constraints.md#hard-constraints)) |
| Repeat reading | none | `text-primary` | 19.3:1 | Half-filled circle | Repeat reading | One out-of-range reading, not yet confirmed ([SH6](docs/research/scientific-constraints.md#hard-constraints)) |

These are Apple's dark-mode system colours, with the accessible red. The hues still follow NASA's required colour table (Table F.5-1).

Rules:

- The bands are the green, amber, and red columns of the [rule table](docs/research/clinical-thresholds.md#rule-table). The amber band is displayed in yellow.
- Status colour goes on the shape, the label, and an arrow after the value (`↑` above the limit, `↓` below). It never fills a tile.
- "No recent data" is its own state. Never show it as a dimmed green.
- "Repeat reading" is deliberately uncoloured: an unconfirmed reading is not a caution yet.
- Filled status backgrounds with black text are reserved for the small round icons of urgent items in Risks & checks.
- **One exception to D2:** the two activity rings on the Dashboard use green (movement) and blue (weekly plan), as in Apple Fitness. They show progress, not status, and always carry a number and a word.

## Typography

One family: the system font, which is SF Pro on Apple devices. Inter is the self-hosted fallback elsewhere (SIL Open Font License 1.1).

| Use | Stack |
| --- | --- |
| All text, values, and numbers | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Inter Variable", "Inter", "Segoe UI", sans-serif` |

| Style | Size / line height | Weight | Letter-spacing | Use |
| --- | --- | --- | --- | --- |
| `title-1` | 40 / 1.1 | 600 | −0.025em | Screen title |
| `title-2` | 28 / 1.14 | 600 | −0.02em | Section title |
| `title-3` | 20 / 1.3 | 600 | −0.01em | Card title, next action |
| Tile title | 17–19 / 1.25 | 600 | −0.01em | Title inside a dashboard tile |
| `body-lg` | 17 / 1.55 | 400 | 0 | Guidance steps |
| `body` | 15 / 1.5 | 400 | −0.01em | Default text |
| `body-sm` | 13 / 1.5 | 400 | 0 | Supporting text |
| `label` | 12 / 1.35 | 500 | 0 | Field and tile labels |
| `reading-xl` | 48 / 1.0 | 600 | −0.02em | The one value a screen is about |
| `reading` | 28 / 1.1 | 600 | −0.01em | Value on a tile |
| `data` | 13 / 1.4 | 400 | 0 | Units, timestamps, table cells |
| `tag` | 12 / 1.3 | 500 | 0 | Age and source of a reading, step counters |

Rules:

- Weights are 400, 500, and 600 only.
- Minimum size for anything that must be read is 12 px.
- All numbers use tabular figures (`font-variant-numeric: tabular-nums`, set on `body`).
- A value and its unit are separated by a non-breaking space; the unit is smaller and `text-muted`: `37.8 °C`.
- Mission time is shown in plain words: `Day 100`. NASA's `MET 57/14:08:33` format was not understood without explanation.
- Sentence case everywhere except the wordmark.
- No numbered section labels ("01 / BODY MAP") and no eyebrow labels above titles. A tile's title says what it is; if a title adds nothing, leave it out.

## Layout and shape

| Token | Value | Use |
| --- | --- | --- |
| `space-1` to `space-8` | 4, 8, 12, 16, 24, 32, 48, 64 px | All padding and gaps |
| `radius-sm` | 8 px | Small inner elements |
| `radius-md` | 18 px | Tiles inside tiles, cards |
| `radius-lg` | 22 px | Dashboard tiles, dialogs |
| `radius-full` | 980 px | Buttons, segmented controls, tags, status shapes |

- **Grid:** the Dashboard is a bento grid of tiles in three columns with 20 px gaps; two on tablets, one on phones.
- **Width:** reading text runs to 640 px at most. Pages are centred, up to 1440–1600 px.
- **Padding:** dashboard tiles have 24 px inside; screens have 24 px at the edges.
- **Touch targets:** at least 44 by 44 px for primary controls, with 8 px between neighbours.
- **Depth:** a higher layer is a lighter surface. No borders on tiles, no shadows, except on dialogs and popovers: `0 16px 48px rgba(0, 0, 0, 0.6)`. The header is translucent with a background blur.
- **Icons:** 1.5 px stroke, 15 to 20 px, in `text-muted` unless they carry a status. An icon never appears without a text label.

## Components

### Status tile

One indicator per tile, on `bg-surface`, with no edge. Top to bottom:

1. Indicator name in `label`, `text-muted`.
2. Value in `reading`, `text-primary`, with unit and limit arrow.
3. Status shape and label in the status colour.
4. A tag with the age of the reading.

The whole tile is one touch target and opens the indicator's detail screen.

### Tags

Small pill-shaped labels: `tag` text in `text-muted` on `bg-raised`. They never take a status colour.

Tags only say things anyone understands: how old a reading is ("45 min ago"), where it came from ("Smart shirt"), or a step counter ("2 of 4").

**No codes in the interface.** Rule IDs (`R4`), constraint IDs (`SH5`), confidence grades, upper-case provenance labels, study codes (`UTMB-01`), and statistics terms (SD, variance, n) stay in the docs and the code. On screen, say it in words: "Estimated, not measured." for a modelled value (SH5), "Volunteer 1" for a study subject, "7-day average" for a rolling mean. The rule behind each limit is documented in [`clinical-thresholds.md`](docs/research/clinical-thresholds.md#rule-table).

### Buttons

| Kind | Look | Use |
| --- | --- | --- |
| Primary | `accent-fill` background, white text, pill shape | The one main action on a screen |
| Secondary | `bg-raised` background, `text-primary`, pill shape | Other actions |
| Quiet | No background, `accent` text, underline on hover | Links and "show more" |
| Segmented | Pill track in `bg-surface` or `bg-raised`, selected segment in `bg-hover` | Ranges, front/back, navigation |

Height is 44 px (32–36 px for segmented controls and the header button), radius `radius-full`, text `body` at weight 400. Focus is a 2 px `accent` ring with a 2 px gap.

### Next-action card

Shown when an indicator needs something from the crew. On `bg-raised`:

1. What was observed, in `body`.
2. What to do next, in `title-3`, `text-primary`.
3. One primary button.

### Charts

- The line and points are `text-primary`, 1.5 px. On the dashboard trend plots the line takes the status colour of each reading.
- The personal baseline is a band in `bg-surface`. Limits are 1 px lines in `border-control`; Earth's limit is dashed. Labels are `data` in `text-muted`.
- Only points outside a limit take a status colour, with the matching shape.
- No tinted review bands, area fills, gradients, or smoothing that invents values between readings.

### Call the doctor

A phone call, not a page and not an alarm.

- **Prompt:** a compact alert near the top of the Dashboard, 600 px wide, 12 px radius, 1 px hairline border. One title line with the status shape, one line of finding in `text-muted`, an X in the corner, and two 32 px buttons at the right: the usual next action (outlined) and "Call the doctor" (white fill, black text). No other text.
- **Call:** a 420 px wide pop-up with 32 px corners over a blurred backdrop. It can be minimised to a 340 px bar in the bottom right corner with the caption and the controls, and then there is no backdrop. During a procedure the astronaut acting out the step takes the place of the doctor's face, and what the doctor did shows as a small `accent` note under its words. The ORBIT mark is the doctor's face. State is on the ring around it and in one word below: a ring that expands while calling, a steady `accent` ring while listening, a `status-ok` ring that pulses while speaking. With reduced motion the rings do not move.
- What the doctor says is one caption in `body-lg`; the viewer's last words sit above it in `text-muted`. No transcript, no suggestions.
- Four round 54 px controls: mute, camera, type, and end call in red. A control that is switched on is white.
- The viewer's camera is a small mirrored tile at the top right.

## Motion

- Transitions last 120 to 200 ms with ease-out. Use them for state changes only: opening, closing, selecting.
- No decorative or looping animation. Nothing moves on a screen where nothing has changed.
- Nothing flashes. The one looping animation is the ring around the virtual doctor while it speaks, because it shows a state.

## Wording

- Say what was observed and what to do next. Never name a diagnosis as fact ([SH9](docs/research/scientific-constraints.md#hard-constraints)).
- Use words a person with no medical training knows: "upper blood pressure value", not "systolic", unless the term is explained on the same screen.
- ORBIT does not speak as a person. Write "Reading is above your usual range", not "I noticed" or "I think".
- State the reason with every recommendation: which reading, against which baseline or limit.
- Buttons are verbs: "Repeat reading", "Log symptom", "Start check-in".

## Checks

Run each against a finished screen.

- [ ] In a greyscale screenshot, every status can still be told apart by shape and label.
- [ ] On a screen where every indicator is in range, the only colours are small green shapes and the accent.
- [ ] The accent appears only on things that can be pressed or focused, and on one filled button at most.
- [ ] No tile shows green for a reading older than its maximum age.
- [ ] A person with no medical or technical training can read every label: no codes, abbreviations, or statistics terms.
- [ ] Every modelled value says "Estimated, not measured."
- [ ] Every piece of text is 12 px or larger, and none is dimmer than `text-muted` except on disabled controls.
- [ ] No NASA logo appears anywhere in the app, video, or slides.

## Tokens

```css
:root {
  color-scheme: dark;

  /* Apple dark: black canvas, neutral tiles, system colours for status. */
  --bg-canvas: #000000;
  --bg-surface: #1d1d1f;
  --bg-raised: #2c2c2e;
  --bg-hover: #3a3a3c;

  --border-subtle: #2c2c2e;
  --border: #3a3a3c;
  --border-control: #636366;

  --text-primary: #f5f5f7;
  --text-secondary: #d2d2d7;
  --text-muted: #a1a1a6;

  --accent: #4aa3ff;
  --accent-fill: #005fc4;
  --text-on-accent: #ffffff;

  --status-ok: #30d158;
  --status-caution: #ffd60a;
  --status-warning: #ff6961;
  --status-stale: #64d2ff;
  --status-unavailable: #8e8e93;

  --ring-move: #30d158;
  --ring-plan: #0a84ff;

  --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'Inter Variable', 'Inter', 'Segoe UI', sans-serif;
  /* Numbers use the system font with tabular figures, as on apple.com. */
  --font-mono: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', 'Inter Variable', 'Inter', sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  --radius-sm: 8px;
  --radius-md: 18px;
  --radius-lg: 22px;
  --radius-full: 980px;

  --shadow-dialog: 0 16px 48px rgba(0, 0, 0, 0.6);
  --duration-fast: 120ms;
  --duration-base: 200ms;
}```

## Sources

- [NASA-STD-3001 Volume 2, Appendix F: Display Standard](https://www.nasa.gov/reference/appendix-f-vol-2/). Colour meanings (Table F.5-1), contrast, redundant cues, stale-data indication, limit arrows, flashing, and time format. The colour table was read from Revision E; check the current revision before quoting it.
- [Inter](https://rsms.me/inter/), by The Inter Project Authors. SIL Open Font License 1.1. The fallback when SF Pro is not available.
- [Apple Human Interface Guidelines, Color](https://developer.apple.com/design/human-interface-guidelines/color). The dark-mode system colours used for status.
- [`docs/research/scientific-constraints.md`](docs/research/scientific-constraints.md) for constraints SH1 to SH10 and SS1 to SS9.
- [`docs/research/clinical-thresholds.md`](docs/research/clinical-thresholds.md) for the green, amber, and red bands.

Inter must be listed under References on the project submission page ([`judging.md`](docs/challenge/judging.md#eligibility-gates-for-global-judging)).
