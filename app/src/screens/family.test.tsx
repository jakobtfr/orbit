import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Shell } from '../components/Shell'
import { FamilyProvider } from '../lib/familyStore'
import { StoreProvider } from '../lib/store'
import { Body } from './Body'
import { Family } from './Family'
import { FamilyCall } from './FamilyCall'

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ')

function page(path: string) {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><StoreProvider><Routes><Route element={<Shell />}><Route path="/family" element={<Family />} /><Route path="/body/:pid" element={<Body />} /></Route></Routes></StoreProvider></MemoryRouter>)
}

describe('Family screen', () => {
  const html = page('/family')
  const t = text(html)

  it('is reachable from the navigation', () => {
    expect(html).toContain('href="/family"')
  })

  it('says plainly that every call is AI and why a live call is not possible', () => {
    expect(t).toContain('Every family call is AI')
    expect(t).toMatch(/signal takes \d+ min one way/i)
  })

  it('shows the opt-in of both sides, each with a switch', () => {
    expect(t).toContain('Your opt-in')
    expect(t).toContain('Marta Brandt')
    expect(t).toContain('Jonas Brandt')
    expect(t).toContain('Priya Nair')
    expect(t).toContain('Agreed to record daily messages')
    expect((html.match(/role="switch"/g) ?? []).length).toBe(4)
  })

  it('lists today\'s messages from several people with how long ago each was recorded', () => {
    expect((t.match(/recorded \d+ (min|h) ago/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('says where the conversation is kept and that it is apart from the health record', () => {
    expect(t).toContain('encrypted on this device')
    expect(t).toContain('apart from your health record')
  })

  it('discloses which voices are AI-generated', () => {
    expect(t).toMatch(/AI-generated/)
  })
})

describe('Family call', () => {
  const html = renderToStaticMarkup(<MemoryRouter><StoreProvider><FamilyProvider><FamilyCall messageId="marta-100" onClose={() => {}} /></FamilyProvider></StoreProvider></MemoryRouter>)
  const t = text(html)

  it('names the caller and keeps an AI label on screen', () => {
    expect(t).toContain('Marta Brandt')
    expect(t).toContain('Mother')
    expect(html).toContain('class="family-ai"')
    expect(t).toContain('AI call')
  })

  it('shows how long ago the message was recorded', () => {
    expect(t).toContain('Message from Earth, recorded 47 min ago')
  })

  it('does not look like the doctor call', () => {
    expect(t).not.toContain('ORBIT doctor')
  })
})

describe('Dashboard', () => {
  it('does not ring while today\'s check is still to do: the call is the reward for it', () => {
    const html = page('/body/lena')
    expect(html).not.toContain('family-incoming')
    expect(text(html)).toContain('Daily check-in')
  })
})

describe('Family screen while locked', () => {
  const html = page('/family')
  const t = text(html)

  it('shows who has sent something, but nothing can be played', () => {
    expect(t).toContain('Marta recorded a message for you')
    expect(t).toContain('Jonas recorded a message for you')
    expect(t).toContain('Priya recorded a message for you')
    expect(t).not.toContain('Play as a call')
    expect((t.match(/Locked(?! until)/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('says in one line what unlocks them, with a button straight to the check', () => {
    expect(t).toContain('The family call is the reward for today\'s health check.')
    expect(t).toContain('Do today\'s check-in to unlock your messages.')
    expect(html).toContain('href="/body/lena/check-in"')
  })
})
