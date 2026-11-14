import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LENA, initialState } from '../../data/demo'
import { StoreProvider } from '../../lib/store'
import { risksAndChecks } from './RisksAndChecks'
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
    expect(html).not.toContain('Vision check')
    expect(html).not.toContain('Earth limits vs. your normal')
    expect(html).toContain('Day 100')
    expect(html).not.toMatch(/\bSD\b|n=\d/)
    expect(html.match(/class="daily-mean-point"/g)).toHaveLength(84)
    const plots = html.match(/<article class="science-plot">[\s\S]*?<\/article>/g) ?? []
    for (const plot of plots) expect(plot.includes('stroke-dasharray')).toBe(false)
    expect(html).not.toMatch(/NaN|Infinity/)
    expect(html).toContain('Chest: Caution. Open details')
  })
})

describe('risks and checks', () => {
  it('lists only risks and the checks still open today: red, then yellow, then checks', () => {
    const rows = risksAndChecks(initialState(), LENA)
    expect(rows.map((r) => `${r.kind}: ${r.title}`)).toEqual(['warning: Radiation exposure', 'caution: Blood pressure', 'check: Daily check-in'])
  })
  it('drops the check-in once it is done and the blood pressure once it is back in range', () => {
    const s = initialState()
    s.readings.lena.bp!.filter((r) => r.t > 99).forEach((r) => { r.v = 110; r.v2 = 66 })
    s.checkins.lena.push({ t: 100.3, feel: 'Fine', symptoms: [], mood: 4 })
    expect(risksAndChecks(s, LENA).map((r) => r.title)).toEqual(['Radiation exposure'])
  })
})
