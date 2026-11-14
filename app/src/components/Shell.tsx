import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { clock } from '../lib/format'
import { now } from '../lib/judge'
import { phaseFor } from '../lib/mission'
import { useStore } from '../lib/store'
import { Tag } from './Status'

export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.66" cy="6.34" r="2.25" fill="currentColor" />
    </svg>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  body: (
    <>
      <circle cx="10" cy="4" r="2" />
      <path d="M4 8h12M10 8v5M10 13l-3 5M10 13l3 5" />
    </>
  ),
  flight: (
    <>
      <circle cx="10" cy="10" r="7" />
      <circle cx="14.95" cy="5.05" r="1.6" fill="currentColor" />
    </>
  ),
  emergency: (
    <>
      <path d="M10 2.5 17.5 10 10 17.5 2.5 10Z" />
      <path d="M10 6.5v4M10 13.2v.3" />
    </>
  ),
  sources: (
    <>
      <path d="M5 2.5h7l3 3v12H5Z" />
      <path d="M8 9h4M8 12h4M8 15h3" />
    </>
  ),
}

function NavIcon({ name }: { name: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

export function Shell() {
  const { state, viewer } = useStore()
  const { pathname } = useLocation()
  const phase = phaseFor(state.day)
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to={`/body/${viewer.id}`} aria-label="ORBIT, go to your body view">
          <Mark />
          <span className="wordmark">ORBIT</span>
        </Link>
        <Link className="topbar-where" to="/flight" aria-label="Mission day and phase, open Flight">
          <Tag>Day {state.day}</Tag>
          <Tag>{phase.label}</Tag>
          <Tag>{clock(now(state))}</Tag>
        </Link>
        <div className="topbar-space" />
        <div className="viewer">
          <span className="viewer-name">{viewer.name}</span>
          <span className="label">{viewer.role}</span>
        </div>
      </header>
      <div className="shell-body">
        <nav className="nav" aria-label="Main">
          <NavLink to={`/body/${viewer.id}`} className={() => (pathname.startsWith('/body') ? 'active' : '')}>
            <NavIcon name="body" /><span>Overview</span>
          </NavLink>
          <NavLink to="/flight"><NavIcon name="flight" /><span>Flight</span></NavLink>
          <NavLink to="/sources"><NavIcon name="sources" /><span>Sources</span></NavLink>
          <div className="nav-space" />
          <NavLink to="/emergency"><NavIcon name="emergency" /><span>Emergency</span></NavLink>
        </nav>
        <main className="main" ref={mainRef}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link className="btn btn-quiet back" to={to}>
      ← {children}
    </Link>
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
