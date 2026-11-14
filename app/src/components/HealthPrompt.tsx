import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCall } from '../lib/call'
import { focusOn } from '../lib/doctor'
import { actionFor, attention } from '../lib/judge'
import { useStore } from '../lib/store'
import { StatusShape } from './Status'

/**
 * Shown on the dashboard when something is off: says what, and offers an immediate call with
 * the doctor. It works for any reading or logged symptom.
 */
export function HealthPrompt() {
  const { state, viewer } = useStore()
  const { call, prompted, setPrompted, openCall } = useCall()
  const focus = focusOn(state, viewer)
  const open = !!focus && !prompted && !call
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setPrompted(true) }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [open, setPrompted])
  if (!focus || !open) return null
  const item = attention(state, viewer).find((i) => i.status === focus.status && (focus.key ? i.key === focus.key : i.kind === 'symptom'))
  const check = item ? actionFor(state, viewer, item).button : undefined
  const name = focus.title.replace(/^(your|the) /, '')
  return (
    <div className="health-prompt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPrompted(true)}>
      <div className="health-prompt" role="alertdialog" aria-modal="true" aria-labelledby="health-prompt-title" aria-describedby="health-prompt-finding">
        <button className="health-prompt-close" aria-label="Close" onClick={() => setPrompted(true)}>
          <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12" /></svg>
        </button>
        <h2 id="health-prompt-title"><StatusShape status={focus.status} size={12} />{name.charAt(0).toUpperCase() + name.slice(1)} needs attention</h2>
        <p id="health-prompt-finding">{focus.finding}</p>
        <div className="health-prompt-actions">
          {check && <Link className="health-prompt-quiet" to={check.to} onClick={() => setPrompted(true)}>{check.label}</Link>}
          <button className="health-prompt-call" autoFocus onClick={() => openCall(focus.key ?? item?.region)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3h3l1.5 4.5-2 1.6a12 12 0 0 0 5.8 5.8l1.6-2L21 14.4v3A3.6 3.6 0 0 1 17.4 21 14.4 14.4 0 0 1 3 6.6 3.6 3.6 0 0 1 6.6 3Z" /></svg>
            Call the doctor
          </button>
        </div>
      </div>
    </div>
  )
}
