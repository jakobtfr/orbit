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
    expect(html).toContain('Volunteer 1')
    expect(html).toContain('28 days measured')
    expect(html).not.toMatch(/>[^<]*(UTMB|\bSD\b|s²|n = \d)[^<]*</)
    expect(html).toContain('Download data')
    expect(html).not.toMatch(/NaN|Infinity/)
    expect(html).not.toContain('href="/flight"')
    expect(html).toContain('href="/emergency"')
    expect(html).not.toContain('nasa-logo')
  })
  it('renders a private check-in and breathing controls without a medical completion action', () => {
    const html = page('/mental-health')
    expect(html).toContain('My Personal Diary')
    expect(html).toContain('Private · on this device')
    expect(html).toContain('Save diary entry')
    expect(html).toContain('Start 60 seconds')
    expect(html).toContain('Entries stay in this browser on this device.')
    expect(html).toContain('How does being away from family and friends feel today?')
    expect(html).toContain('What would help you feel closer to them?')
    expect(html).toContain('Add family video')
    expect(html).toContain('Record a message')
    expect(html).not.toContain('Daily check-in complete')
  })
})
