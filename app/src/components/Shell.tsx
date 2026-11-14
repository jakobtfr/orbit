import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'

export function Shell() {
  const { state, viewer, healthSystem, setHealthSystem } = useStore()
  const { pathname } = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const settingsButton = useRef<HTMLButtonElement>(null)
  useEffect(() => { mainRef.current?.scrollTo(0, 0); setSettingsOpen(false) }, [pathname])
  useEffect(() => {
    if (!settingsOpen) return
    const dismiss = (event: PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSettingsOpen(false); settingsButton.current?.focus() }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape) }
  }, [settingsOpen])
  return <div className="shell">
    <header className="topbar health-header">
      <Link className="brand" to={`/body/${viewer.id}`} aria-label="ORBIT, health overview">
        <img className="nasa-logo" src={`${import.meta.env.BASE_URL}nasa-logo.svg`} width="48" height="40" alt="NASA" />
        <span className="brand-text"><span className="wordmark">ORBIT</span><span className="brand-subtitle">Space Apps prototype</span></span>
      </Link>
      <div className="header-system"><span className="system-dot" />{healthSystem === 'planet' ? 'Planet health system' : 'Flight health system'}<span className="header-day">Day {state.day}</span></div>
      <div className="topbar-space" />
      <div className="viewer"><span className="viewer-name">{viewer.name}</span><span className="label">{viewer.role}</span></div>
      <div className="header-settings" ref={settingsRef}>
        <button className="settings-button" ref={settingsButton} aria-label="Settings" aria-expanded={settingsOpen} aria-controls="health-settings" onClick={() => setSettingsOpen((open) => !open)}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="m9 3-.7 2.5-2 .9L4 5.8 2 9.2l1.8 1.8v2L2 14.8l2 3.4 2.3-.6 2 .9L9 21h6l.7-2.5 2-.9 2.3.6 2-3.4-1.8-1.8v-2L22 9.2l-2-3.4-2.3.6-2-.9L15 3Z" /><circle cx="12" cy="12" r="3.2" /></svg>
        </button>
        {settingsOpen && <div className="settings-popover" id="health-settings" role="region" aria-label="Health system settings">
          <h2>Settings</h2><fieldset><legend>Health system</legend>
            <label className={healthSystem === 'planet' ? 'selected' : ''}><input type="radio" name="health-system" checked={healthSystem === 'planet'} onChange={() => setHealthSystem('planet')} /><span><strong>Planet health system</strong><small>Surface environment · gravity checks</small></span></label>
            <label className={healthSystem === 'flight' ? 'selected' : ''}><input type="radio" name="health-system" checked={healthSystem === 'flight'} onChange={() => setHealthSystem('flight')} /><span><strong>Flight health system</strong><small>Spacecraft environment · microgravity</small></span></label>
          </fieldset>
        </div>}
      </div>
    </header>
    <div className="shell-body">
      {healthSystem === 'planet' && <nav className="planet-nav" aria-label="Planet health navigation">
        <NavLink to={`/body/${viewer.id}`} className={() => pathname.startsWith('/body') ? 'active' : ''}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="12" y="3" width="5" height="5" rx="1" /><rect x="3" y="12" width="5" height="5" rx="1" /><rect x="12" y="12" width="5" height="5" rx="1" /></svg>Dashboard</NavLink>
        <NavLink to="/deep-data"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3v14h14M6 12l3-4 3 2 4-6" /></svg>Deep Data</NavLink>
        <NavLink to="/mental-health"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17S2 12 2 7a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 10-8 10Z" /></svg>Mental Health</NavLink>
      </nav>}
      <main className="main" ref={mainRef}><Outlet /></main></div>
  </div>
}

export function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link className="btn btn-quiet back" to={to}>← {children}</Link>
}
