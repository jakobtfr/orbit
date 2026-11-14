import { Navigate, useParams } from 'react-router-dom'
import { personById, useStore } from '../lib/store'
import type { Person } from '../lib/types'

export function usePerson(): Person | undefined {
  const { pid } = useParams()
  return personById(pid)
}

export function Missing() {
  const { viewer } = useStore()
  return <Navigate to={`/body/${viewer.id}`} replace />
}

export function PrivacyLine({ person }: { person: Person }) {
  return <p className="privacy-line">Other details are private to {person.name} and the medical lead.</p>
}

export function ScreenTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header className="screen-head">
      <h1 className="title-1">{children}</h1>
      {sub && <p className="body screen-sub">{sub}</p>}
    </header>
  )
}
