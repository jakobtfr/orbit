import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Shell } from '../components/Shell'
import { StoreProvider } from '../lib/store'
import { DeepData } from './DeepData'
import { MentalHealth } from './MentalHealth'

function page(path: string) {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><StoreProvider><Routes><Route element={<Shell />}><Route path="/deep-data" element={<DeepData />} /><Route path="/mental-health" element={<MentalHealth />} /></Route></Routes></StoreProvider></MemoryRouter>)
}

describe('Planet workspace pages', () => {
  it('provides all three destinations and measured data context', () => {
    const html = page('/deep-data')
    expect(html).toContain('Planet health navigation')
    expect(html).toContain('href="/body/lena"')
    expect(html).toContain('href="/deep-data"')
    expect(html).toContain('href="/mental-health"')
    expect(html.match(/class="paper-plot"/g)).toHaveLength(3)
    expect(html).toContain('Medical summary')
    expect(html).toContain('Between check-ins')
    expect(html).toContain('UTMB-01')
    expect(html).toContain('n = 28')
    expect(html).toContain('Export CSV')
    expect(html).not.toMatch(/NaN|Infinity/)
    expect(html).not.toContain('href="/flight"')
  })
  it('renders a private check-in and breathing controls without a medical completion action', () => {
    const html = page('/mental-health')
    expect(html).toContain('Private · only you')
    expect(html).toContain('Save check-in')
    expect(html).toContain('Start 60 seconds')
    expect(html).toContain('Reloading clears your entries.')
    expect(html).toContain('Your private notes will appear here')
    expect(html).not.toContain('Daily check-in complete')
  })
})
