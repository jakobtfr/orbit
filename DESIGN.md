# ORBIT Design Guidelines

Written 2026-11-14, updated the same day for version 2. One dark theme, no light theme yet.

**Scope.** These rules apply to every screen. The dashboard workspace (Dashboard, Deep Data, Mental Health) uses its own charcoal palette and card styles in `app/src/dashboard.css`; on those screens the status colours, shapes, and words below still apply unchanged.

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
- **Wordmark:** `ORBIT` in Inter, weight 600, letter-spacing 0.12em, colour `text-primary`.
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
| `bg-canvas` | `#090A0C` | Page background |
| `bg-surface` | `#101114` | Tiles, cards, navigation |
| `bg-raised` | `#17181C` | Dialogs, popovers, inputs |
| `bg-hover` | `#1F2126` | Hover and pressed states |
| `border-subtle` | `#1D1F24` | Dividers inside a surface |
| `border` | `#2A2D34` | Edges of tiles and cards |
| `border-control` | `#6B717C` | Edges of inputs and other controls (3.6:1 on `bg-raised`) |

### Text

| Token | Hex | On canvas | On raised | Use |
| --- | --- | --- | --- | --- |
| `text-primary` | `#F4F5F7` | 18.2:1 | 16.3:1 | Values, headings, anything acted on |
| `text-secondary` | `#C8CCD4` | 12.3:1 | 11.0:1 | Body text |
| `text-muted` | `#9DA3AE` | 7.8:1 | 7.0:1 | Labels, units, timestamps, tags |

There is no dimmer text colour. Nothing that must be read is darker than `text-muted`.

### Accent

| Token | Hex | Contrast | Use |
| --- | --- | --- | --- |
| `accent` | `#A3A6FF` | 8.9:1 on canvas | Links, focus rings, selected outlines, active navigation |
| `accent-fill` | `#4F52C4` | 6.3:1 with white text | Background of the one primary button per screen |
| `text-on-accent` | `#FFFFFF` | | Text on `accent-fill` |

The accent marks things the crew can act on. It never carries a status. ORBIT has no advisory alert level; if one is added, revisit the accent first, because NASA assigns blue to advisory alerts.

### Status

The colours for warning, caution, no recent data, and unavailable follow the required colour table in NASA's display standard (Table F.5-1). Green for "in range" is our own addition; the standard assigns no colour to a normal state.

| State | Token | Hex | On canvas | Shape | Label | When |
| --- | --- | --- | --- | --- | --- | --- |
| In range | `status-ok` | `#3FBF6F` | 8.4:1 | Filled circle | In range | The rule's green band |
| Caution | `status-caution` | `#F2C230` | 11.8:1 | Triangle | Caution | The rule's amber band, confirmed |
| Warning | `status-warning` | `#FF7676` | 7.6:1 | Diamond | Warning | The rule's red band |
| No recent data | `status-stale` | `#4CC9E0` | 10.1:1 | Dashed ring | No recent data | The last reading is older than the indicator's maximum age ([SH8](docs/research/scientific-constraints.md#hard-constraints)) |
| Unavailable | `status-unavailable` | `#7B818C` | 5.1:1 | Dash | Unavailable | The rule is switched off in this environment ([SH4](docs/research/scientific-constraints.md#hard-constraints)) |
| Repeat reading | none | `text-primary` | 18.2:1 | Half-filled circle | Repeat reading | One out-of-range reading, not yet confirmed ([SH6](docs/research/scientific-constraints.md#hard-constraints)) |

Rules:

- The bands are the green, amber, and red columns of the [rule table](docs/research/clinical-thresholds.md#rule-table). The amber band is displayed in yellow.
- Status colour goes on the shape, the label, and an arrow after the value (`↑` above the limit, `↓` below). It never fills a tile.
- "No recent data" is its own state. Never show it as a dimmed green.
- "Repeat reading" is deliberately uncoloured: an unconfirmed reading is not a caution yet.
- `status-unavailable` is the one colour below 6:1. Use it for the shape and for disabled controls; write the label in `text-muted`.
- Filled status backgrounds with `bg-canvas` text are reserved for the emergency flow (see [Emergency flow](#emergency-flow)).

## Typography

Two typefaces, both open source under the SIL Open Font License 1.1.

| Family | Use | Stack |
| --- | --- | --- |
| **Inter** (variable) | All interface text and headings | `"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif` |
| **Geist Mono** | Readings, units, times, IDs, tags | `"Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace` |

| Style | Family | Size / line height | Weight | Letter-spacing | Use |
| --- | --- | --- | --- | --- | --- |
| `display` | Inter | 48 / 1.05 | 600 | −0.022em | Demo title, slide headlines |
| `title-1` | Inter | 32 / 1.15 | 600 | −0.02em | Screen title |
| `title-2` | Inter | 24 / 1.25 | 600 | −0.015em | Section title |
| `title-3` | Inter | 20 / 1.3 | 600 | −0.01em | Card title, next action |
| `body-lg` | Inter | 17 / 1.55 | 400 | 0 | Guidance steps |
| `body` | Inter | 15 / 1.55 | 400 | 0 | Default text |
| `body-sm` | Inter | 13 / 1.5 | 400 | 0 | Supporting text |
| `label` | Inter | 12 / 1.35 | 500 | 0 | Field and tile labels |
| `reading-xl` | Geist Mono | 40 / 1.0 | 500 | −0.02em | The one value a screen is about |
| `reading` | Geist Mono | 24 / 1.1 | 500 | −0.01em | Value on a tile |
| `data` | Geist Mono | 13 / 1.4 | 400 | 0 | Units, timestamps, table cells |
| `tag` | Geist Mono | 12 / 1.3 | 500 | 0.06em, uppercase | Provenance, confidence, mission time |

Rules:

- Weights are 400, 500, and 600 only. Emphasis below heading level comes from `text-primary` against `text-secondary`, not from bold.
- Minimum size for anything that must be read is 12 px.
- Numbers that change or sit in a column use tabular figures (`font-variant-numeric: tabular-nums`); Geist Mono already does.
- A value and its unit are separated by a non-breaking space; the unit is `data` size in `text-muted`: `37.8 °C`.
- Mission time is shown in plain words, in `tag` style: `Day 100`. NASA's `MET 57/14:08:33` format was not understood without explanation.
- Sentence case everywhere except `tag` and the wordmark.
- Self-host both fonts and ship each font's `OFL.txt` with them. Do not load them from a CDN.

## Layout and shape

| Token | Value | Use |
| --- | --- | --- |
| `space-1` to `space-8` | 4, 8, 12, 16, 24, 32, 48, 64 px | All padding and gaps |
| `radius-sm` | 6 px | Buttons, inputs, tags |
| `radius-md` | 10 px | Tiles, cards |
| `radius-lg` | 16 px | Dialogs |
| `radius-full` | 999 px | Status shapes, pills |

- **Width:** reading text runs to 640 px at most. Tile grids use 2 to 4 columns with a 16 px gap.
- **Padding:** tiles and cards have 16 px inside; screens have 24 px at the edges.
- **Touch targets:** at least 44 by 44 px, with 8 px between neighbours.
- **Depth:** a higher layer is a lighter surface with a 1 px border. No shadows, except one on dialogs: `0 16px 48px rgba(0, 0, 0, 0.5)`.
- **Icons:** 1.5 px stroke, 16 or 20 px, in `text-muted` unless they carry a status. An icon never appears without a text label.

## Components

### Status tile

One indicator per tile, on `bg-surface` with a `border` edge. Top to bottom:

1. Indicator name in `label`, `text-muted`.
2. Value in `reading`, `text-primary`, with unit and limit arrow.
3. Status shape and label in the status colour.
4. A row of tags: provenance, confidence, and age of the reading.

The whole tile is one touch target and opens the indicator's detail screen.

### Tags

Small `tag`-style labels in `text-muted` with a `border` edge and no fill. They never take a status colour.

- **Provenance** ([SH5](docs/research/scientific-constraints.md#hard-constraints)): `MEASURED`, `SELF-REPORTED`, `MODELLED`. Scripted demo values carry their indicator's normal provenance; the README and submission say which data is scripted.
- **Confidence** ([SS5](docs/research/scientific-constraints.md#soft-constraints)): `HIGH`, `MODERATE`, `LOW`.
- **Source** ([SH1](docs/research/scientific-constraints.md#hard-constraints)): the rule ID, such as `R4`, linking to the source list.

### Buttons

| Kind | Look | Use |
| --- | --- | --- |
| Primary | `accent-fill` background, `text-on-accent` | The one main action on a screen |
| Secondary | `bg-raised` background, `border` edge, `text-primary` | Other actions |
| Quiet | No background, `accent` text | Navigation and "show more" |

Height is 44 px, radius `radius-sm`, text `body` at weight 500. Focus is a 2 px `accent` ring with a 2 px gap.

### Next-action card

Shown when an indicator needs something from the crew. On `bg-raised`:

1. What was observed, in `body`.
2. What to do next, in `title-3`, `text-primary`.
3. One primary button.

### Charts

- The line and points are `text-primary`, 1.5 px.
- The personal baseline is a band in `bg-hover`. Limits are 1 px lines in `border-control`, labelled in `data`.
- Only points outside a limit take a status colour, with the matching shape.
- Axes and gridlines are `border-subtle`; axis labels are `data` in `text-muted`.
- No area fills, gradients, or smoothing that invents values between readings.

### Emergency flow

The only place where the quiet rules are suspended.

- Entry: an **Emergency** button at the top right of the header on every screen, outlined and labelled in `status-warning`, with the warning diamond. It is the only status colour in the header.
- A full-width header with `status-warning` background and `bg-canvas` text (7.6:1).
- One step per screen in `title-2`, with one primary button. Completed steps stay visible in `text-muted`.
- The header shape may flash at 0.8 Hz, on for 70% of each cycle. The crew can stop it, and it does not flash when the device asks for reduced motion. Text itself never flashes.

## Motion

- Transitions last 120 to 200 ms with ease-out. Use them for state changes only: opening, closing, selecting.
- No decorative or looping animation. Nothing moves on a screen where nothing has changed.
- Flashing is reserved for the emergency flow.
- One exception to "nothing moves": the "Earth limits vs. your normal" card on the Dashboard fills its 90 days once on load (about 1.6 s) and again on click. With reduced motion it shows the end state at once.

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
- [ ] Every value has a provenance tag, and every status has a confidence tag and a rule ID.
- [ ] Every piece of text is 12 px or larger, and none is dimmer than `text-muted` except on disabled controls.
- [ ] No NASA logo appears anywhere in the app, video, or slides.

## Tokens

```css
:root {
  color-scheme: dark;

  --bg-canvas: #090A0C;
  --bg-surface: #101114;
  --bg-raised: #17181C;
  --bg-hover: #1F2126;

  --border-subtle: #1D1F24;
  --border: #2A2D34;
  --border-control: #6B717C;

  --text-primary: #F4F5F7;
  --text-secondary: #C8CCD4;
  --text-muted: #9DA3AE;

  --accent: #A3A6FF;
  --accent-fill: #4F52C4;
  --text-on-accent: #FFFFFF;

  --status-ok: #3FBF6F;
  --status-caution: #F2C230;
  --status-warning: #FF7676;
  --status-stale: #4CC9E0;
  --status-unavailable: #7B818C;

  --font-sans: "Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 999px;

  --shadow-dialog: 0 16px 48px rgba(0, 0, 0, 0.5);
  --duration-fast: 120ms;
  --duration-base: 200ms;
}
```

## Sources

- [NASA-STD-3001 Volume 2, Appendix F: Display Standard](https://www.nasa.gov/reference/appendix-f-vol-2/). Colour meanings (Table F.5-1), contrast, redundant cues, stale-data indication, limit arrows, flashing, and time format. The colour table was read from Revision E; check the current revision before quoting it.
- [Inter](https://rsms.me/inter/), by The Inter Project Authors. SIL Open Font License 1.1.
- [Geist Mono](https://vercel.com/font), by The Geist Project Authors. SIL Open Font License 1.1.
- [`docs/research/scientific-constraints.md`](docs/research/scientific-constraints.md) for constraints SH1 to SH10 and SS1 to SS9.
- [`docs/research/clinical-thresholds.md`](docs/research/clinical-thresholds.md) for the green, amber, and red bands.

Both fonts must be listed under References on the project submission page ([`judging.md`](docs/challenge/judging.md#eligibility-gates-for-global-judging)).
