import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StoreProvider } from './store'
import { GUIDES, guideById, stepsFor } from './guides'
import { GuidePlayer, Resources } from '../screens/Resources'

function page(path: string) {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><StoreProvider><Routes><Route path="/resources" element={<Resources />} /><Route path="/resources/:id" element={<GuidePlayer />} /></Routes></StoreProvider></MemoryRouter>)
}

describe('Resources', () => {
  it('gives every guide sources, steps, and links that resolve', () => {
    for (const g of GUIDES) {
      expect(g.sources.length, g.id).toBeGreaterThan(0)
      for (const place of ['spacecraft', 'surface'] as const) expect(stepsFor(g, place).length, g.id).toBeGreaterThan(2)
      for (const s of g.steps) if (s.link) expect(guideById(s.link.guide), s.link.guide).toBeDefined()
    }
  })
  it('adapts the collapse steps to the place', () => {
    const cpr = guideById('cpr')!
    expect(stepsFor(cpr, 'spacecraft').map((s) => s.title)).toContain('Secure both of you')
    expect(stepsFor(cpr, 'surface').map((s) => s.title)).toContain('Lay them flat')
    expect(stepsFor(cpr, 'surface').map((s) => s.title)).not.toContain('Secure both of you')
    expect(stepsFor(guideById('bleeding')!, 'surface')[0].text).not.toContain('weightlessness')
  })
  it('lists the guides and plays one from its first step', () => {
    const list = page('/resources')
    for (const g of GUIDES) expect(list).toContain(`href="/resources/${g.id}"`)
    const cpr = page('/resources/cpr')
    expect(cpr).toContain('Check for a response')
    expect(cpr).toContain('Step 1 of 7')
    expect(cpr).toContain('Steps for weightlessness')
    expect(cpr).toContain('guideline for CPR in microgravity')
    expect(cpr).not.toMatch(/NaN|undefined/)
  })
})
