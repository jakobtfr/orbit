import { Link } from 'react-router-dom'
import { MESSAGES, arrived, familyLock, memberOf } from '../lib/family'
import { useFamily } from '../lib/familyStore'
import { useStore } from '../lib/store'
import '../family.css'
import '../family-lock.css'

/** On the dashboard, where the incoming call will ring: a message from home is waiting, and what unlocks it. */
export function FamilyTeaser() {
  const { state, viewer } = useStore()
  const { optIn } = useFamily()
  const inbox = arrived(state, MESSAGES, optIn)
  const lock = familyLock(state, viewer)
  if (!optIn.astronaut || !inbox.length || !lock.locked) return null
  const who = memberOf(inbox[0])
  const first = who.name.split(' ')[0]
  const more = inbox.length - 1
  return (
    <aside className="family-waiting" aria-label="A message from home is waiting">
      <span className="family-face" aria-hidden="true">{who.name.split(' ').map((w) => w[0]).join('')}</span>
      <div><strong>{first} recorded a message for you</strong><span>{more > 0 ? `${more} more from home · ` : ''}{lock.why || 'Locked until your health check is done'}</span></div>
      <Link className="btn btn-primary" to={lock.to}>{lock.button || 'Do the health check'}</Link>
    </aside>
  )
}
