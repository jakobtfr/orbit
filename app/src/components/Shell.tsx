import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { phaseFor } from '../lib/mission'
import { CallProvider, useCall } from '../lib/call'
import { FamilyProvider, useFamily } from '../lib/familyStore'
import { IncomingFamilyCall } from './IncomingFamilyCall'
import { useStore } from '../lib/store'
import { Doctor } from '../screens/Doctor'
import { FamilyCall } from '../screens/FamilyCall'

export function Shell() {
  return <CallProvider><FamilyProvider><ShellFrame /></FamilyProvider></CallProvider>
}

function ShellFrame() {
  const { state, viewer } = useStore()
  const { call, openCall, closeCall } = useCall()
  const { calling, closeFamilyCall } = useFamily()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const phase = phaseFor(state.day)
  useEffect(() => { mainRef.current?.scrollTo(0, 0) }, [pathname])
  return <div className="shell">
    <header className="topbar health-header">
      <Link className="brand" to={`/body/${viewer.id}`} aria-label="ORBIT, health overview">
        <Mark size={28} />
        <span className="wordmark">ORBIT</span>
      </Link>
      <div className="header-system"><span className="header-phase">{phase.label}</span><span className="header-day">Day {state.day}</span></div>
      <div className="topbar-space" />
      <div className="viewer"><span className="viewer-name">{viewer.name}</span><span className="label">{viewer.role}</span></div>
      <button className={`doctor-button ${call ? 'is-live' : ''}`} onClick={() => { if (!call) openCall() }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="10.5" height="10" rx="2.5" /><path d="m13 9 4.5-2.5v7L13 11" /></svg>
        {call ? 'On a call with the doctor' : 'Talk to the doctor'}
      </button>
    </header>
    <div className="shell-body">
      <nav className="planet-nav" aria-label="Health navigation">
        <NavLink to={`/body/${viewer.id}`} className={() => pathname.startsWith('/body') ? 'active' : ''}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="12" y="3" width="5" height="5" rx="1" /><rect x="3" y="12" width="5" height="5" rx="1" /><rect x="12" y="12" width="5" height="5" rx="1" /></svg>Dashboard</NavLink>
        <NavLink to="/family"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.500A2.500 2.500 0 0 1 5.500 3h9A2.500 2.500 0 0 1 17 5.500v6a2.500 2.500 0 0 1-2.500 2.500H9l-4 3v-3.100A2.500 2.500 0 0 1 3 11.500Z" /></svg>Family</NavLink>
        <NavLink to="/measurements"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3v14h14M6 12l3-4 3 2 4-6" /></svg>Measurements</NavLink>
        <NavLink to="/resources"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 5c-2-1.5-4.500-2-7-2v12c2.500 0 5 .5 7 2 2-1.500 4.500-2 7-2V3c-2.500 0-5 .5-7 2Zm0 0v12" /></svg>Resources</NavLink>
        <NavLink to="/mental-health"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17S2 12 2 7a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 10-8 10Z" /></svg>My Personal Diary</NavLink>
      </nav>
      <main className="main" ref={mainRef}><Outlet /></main>
      {call && <Doctor about={call.about} onClose={closeCall} />}
      <IncomingFamilyCall />
      {calling && !call && <FamilyCall key={calling} messageId={calling} onClose={closeFamilyCall} />}
    </div>
  </div>
}

export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.66" cy="6.34" r="2.25" fill="currentColor" />
    </svg>
  )
}

export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="title-3">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link className="btn btn-quiet back" to={to}>← {children}</Link>
}
