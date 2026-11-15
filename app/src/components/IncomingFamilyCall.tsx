import { useCall } from '../lib/call'
import { MESSAGES, arrived, memberOf, offDuty, recordedLabel } from '../lib/family'
import { useFamily } from '../lib/familyStore'
import { now } from '../lib/judge'
import { useStore } from '../lib/store'
import '../family.css'

/** The incoming family call: a card in the corner, in off-duty time only, never over a call that is already on. */
export function IncomingFamilyCall() {
  const { state } = useStore()
  const { optIn, calling, answered, setAnswered, openFamilyCall } = useFamily()
  const { call, setPrompted } = useCall()
  const message = arrived(state, MESSAGES, optIn)[0]
  if (!message || answered || calling || call || !offDuty(now(state))) return null
  const who = memberOf(message)
  return (
    <aside className="family-incoming" role="dialog" aria-label={`Incoming family call from ${who.name}`}>
      <span className="family-face" aria-hidden="true">{who.name.split(' ').map((w) => w[0]).join('')}</span>
      <div><strong>{who.name} <span className="family-ai">AI call</span></strong><span>{who.relation} · {recordedLabel(state, message)}</span></div>
      <button className="btn btn-secondary" onClick={() => setAnswered(true)}>Later</button>
      <button className="btn btn-primary" onClick={() => { setPrompted(true); openFamilyCall(message.id) }}>Answer</button>
    </aside>
  )
}
