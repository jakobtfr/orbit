import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LimitsCard } from './LimitsCard'

describe('Earth limits vs. your normal card', () => {
  it('shows one volunteer and the all-volunteer result, and links to the replay', () => {
    const html = renderToStaticMarkup(<MemoryRouter><LimitsCard /></MemoryRouter>)
    expect(html).toContain('Replay: 54 Earth alarms, 1 ORBIT alarm in 90 days')
    expect(html).toContain('All 29: 46 vs 11 alarms in 6 months')
    expect(html).toContain('href="/replay?s=UTMB-01"')
  })
})
