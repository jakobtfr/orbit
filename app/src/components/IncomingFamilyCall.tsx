import { useCall } from '../lib/call'
import { incomingCall, memberOf, recordedLabel } from '../lib/family'
import { useFamily } from '../lib/familyStore'
import { useStore } from '../lib/store'
import '../family.css'
import '../family-lock.css'

/** The incoming family call: a card in the corner, in off-duty time only, never over a call that is already on. */
export function IncomingFamilyCall() {
  const { state, viewer } = useStore()
  const { optIn, calling, answered, setAnswered, openFamilyCall } = useFamily()
  const { call, setPrompted } = useCall()
  // Rings only once today's check is done: the call is the reward for it.
  const message = incomingCall(state, viewer, optIn)
  if (!message || answered || calling || call) return null
  const who = memberOf(message)
  return (
    <aside className="family-incoming is-unlocked" role="dialog" aria-label={`Incoming family call from ${who.name}`}>
      <span className="family-face" aria-hidden="true">{who.name.split(' ').map((w) => w[0]).join('')}</span>
      <div><strong>{who.name} <span className="family-ai">AI call</span></strong><span>{who.relation} · {recordedLabel(state, message)}</span><span className="family-unlocked">Unlocked by today's check</span></div>
      <button className="btn btn-secondary" onClick={() => setAnswered(true)}>Later</button>
      <button className="btn btn-primary" onClick={() => { setPrompted(true); openFamilyCall(message.id) }}>Answer</button>
    </aside>
  )
}
