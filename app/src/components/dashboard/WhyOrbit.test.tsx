import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { WhyOrbit } from './WhyOrbit'

describe('Why ORBIT strip', () => {
  it('states the bed-rest result and links to the replay', () => {
    const html = renderToStaticMarkup(<MemoryRouter><WhyOrbit /></MemoryRouter>)
    expect(html).toContain('1 day in 4')
    expect(html).toContain('1 in 17')
    expect(html).toMatch(/>46<.*>11</s)
    expect(html).toContain('href="/replay?s=UTMB-01"')
    expect(html).toContain('54 Earth alarms against 1 ORBIT alarm')
  })
})
