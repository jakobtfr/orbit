import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StoreProvider } from '../../lib/store'
import { Body } from '../../screens/Body'

describe('dashboard rendering', () => {
  it('renders three scientific plots and working destinations without invalid geometry', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/body/lena']}><StoreProvider><Routes><Route path="/body/:pid" element={<Body />} /></Routes></StoreProvider></MemoryRouter>)
    expect(html.match(/class="science-plot"/g)).toHaveLength(3)
    expect(html.match(/<summary>Details<\/summary>/g)).toHaveLength(3)
    expect(html).not.toContain('AI PREVIEW · MOCK')
    expect(html).not.toContain('health-chat')
    expect(html.match(/class="dashboard-column /g)).toHaveLength(3)
    expect(html).toContain('Risks &amp; checks')
    expect(html.match(/<strong>Radiation exposure<\/strong>/g)).toHaveLength(1)
    expect(html).toContain('href="/body/lena/check-in"')
    expect(html).toContain('href="/body/lena/measure/vision"')
    expect(html).toContain('Day 100')
    expect(html).not.toMatch(/\bSD\b|n=\d/)
    expect(html.match(/class="daily-mean-point"/g)).toHaveLength(84)
    const plots = html.match(/<article class="science-plot">[\s\S]*?<\/article>/g) ?? []
    for (const plot of plots) expect(plot.includes('stroke-dasharray')).toBe(false)
    expect(html).not.toMatch(/NaN|Infinity/)
    expect(html).toContain('Explore Chest')
  })
})
