import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Replay } from './Replay'

const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/replay']}><Replay /></MemoryRouter>)
/** The text of the table row whose first cell starts with `name`, tags removed. */
function row(name: string): string {
  const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) ?? []
  const hit = rows.find((r) => r.replace(/<[^>]+>/g, '').startsWith(name))
  return (hit ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('Replay screen', () => {
  it('leads with the same two-day rule on both sides: 13.5% against 5.9%', () => {
    expect(html).toContain('Earth limits, 2 days in a row')
    expect(html).toContain('13.5%')
    expect(html).toContain('5.9%')
    expect(html).toContain('2.3 times fewer alarms')
  })

  it('shows how many planted problems each rule set catches (docs/research/miss-rate.md)', () => {
    expect(html).toContain('Does ORBIT miss real problems?')
    // Exact rows, Earth limits column first: share and (caught of cases), from docs/research/miss-rate.md.
    expect(row('Fever +1.0 °C')).toBe('Fever +1.0 °C, 3 days 8% (6 of 78) 94% (73 of 78)')
    expect(row('Heart rate +20 bpm')).toBe('Heart rate +20 bpm, 5 days 20% (17 of 84) 93% (74 of 80)')
    expect(row('Heart rate drifts up 0.5 bpm')).toBe('Heart rate drifts up 0.5 bpm a day, 30 days 14% (8 of 57) 71% (29 of 41)')
  })

  it('says plainly where ORBIT does worse and what nobody catches', () => {
    expect(row('Blood pressure +15/+9')).toBe('Blood pressure +15/+9, 3 days 50% (36 of 72) 26% (22 of 84)')
    expect(row('Blood pressure +25/+15')).toBe('Blood pressure +25/+15, 3 days 90% (65 of 72) 69% (58 of 84)')
    expect(row('Blood pressure −20/−12')).toBe('Blood pressure −20/−12, 3 days 0% (0 of 72) 0% (0 of 84)')
    expect(html).toContain('Earth limits catch more of the smaller blood-pressure rises')
    expect(html).toContain('Neither rule set here looks at drops')
  })
})
