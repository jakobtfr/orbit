import { Link } from 'react-router-dom'
import { StatusMark } from '../components/Status'
import { CREW } from '../data/demo'
import { clock, dayLabel } from '../lib/format'
import { attention, lastCheckIn, overallStatus } from '../lib/judge'
import { useStore } from '../lib/store'
import { ScreenTitle } from './common'

export function Crew() {
  const { state, viewer } = useStore()
  const people = [viewer, ...CREW.filter((p) => p.id !== viewer.id)]
  return (
    <div className="screen">
      <ScreenTitle>Crew</ScreenTitle>
      <div className="crew-grid">
        {people.map((p) => {
          const n = attention(state, p).length
          const c = lastCheckIn(state, p.id)
          const today = c && Math.floor(c.t) === state.day
          return (
            <Link key={p.id} className="crew-card" to={`/body/${p.id}`}>
              <div className="crew-top">
                <span className="title-3">{p.name}</span>
                {p.id === viewer.id && <span className="tag">You</span>}
              </div>
              <div className="label">{p.role}</div>
              <StatusMark status={overallStatus(state, p)} size={16} />
              <div className="body-sm">{n === 0 ? 'Nothing needs attention' : `${n} ${n === 1 ? 'needs' : 'need'} attention`}</div>
              <div className="data crew-checkin">
                Last check-in: {c ? `${today ? 'Today' : dayLabel(c.t)}, ${clock(c.t)}` : 'none'}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
