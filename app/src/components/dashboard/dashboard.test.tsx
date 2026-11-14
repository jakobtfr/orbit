import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StoreProvider } from '../../lib/store'
import { Body } from '../../screens/Body'

describe('dashboard rendering', () => {
  it('renders five scientific plots and working destinations without invalid geometry', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/body/lena']}><StoreProvider><Routes><Route path="/body/:pid" element={<Body />} /></Routes></StoreProvider></MemoryRouter>)
    expect(html.match(/class="science-plot"/g)).toHaveLength(5)
    expect(html.match(/Method &amp; reference/g)).toHaveLength(5)
    expect(html).toContain('AI PREVIEW · MOCK')
    expect(html).toContain('href="/body/lena/check-in"')
    expect(html).toContain('href="/body/lena/measure/vision"')
    expect(html).toContain('n=28')
    expect(html).not.toMatch(/NaN|Infinity/)
    expect(html).toContain('Explore Chest')
  })
})
