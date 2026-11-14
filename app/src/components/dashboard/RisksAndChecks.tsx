import { Link } from 'react-router-dom'
import { useCall } from '../../lib/call'
import { radiationToday } from '../../lib/dashboard'
import { EXERCISE_PLAN_MIN, actionFor, attention, checkedInToday, readingsFor } from '../../lib/judge'
import { actionDone } from '../../lib/procedures'
import { useStore } from '../../lib/store'
import type { Action, AppState, Person } from '../../lib/types'

interface Row {
  kind: 'warning' | 'caution' | 'check'
  title: string
  detail: string
  hint?: string
  /** Risks open a call with the doctor; checks go to where the check is done. */
  about?: string
  to?: string
  /** The next action behind a risk, to tell whether its steps were done today. */
  action?: Action
}

const ORDER = { warning: 0, caution: 1, check: 2 }

/** Only what needs the person today: risks in red, then yellow, then the checks still open. */
export function risksAndChecks(state: AppState, person: Person): Row[] {
  const base = `/body/${person.id}`
  const rows: Row[] = []
  for (const item of attention(state, person)) {
    const action = actionFor(state, person, item)
    if (item.status === 'warning' || item.status === 'caution') {
      rows.push({ kind: item.status, title: item.label, detail: action.next, hint: 'Call the doctor about this', about: item.key ?? item.region, action })
    } else {
      // A reading that is missing, too old, or needs repeating is a check to do, not a risk.
      rows.push({ kind: 'check', title: item.label, detail: action.observed, hint: action.button?.label, to: action.button?.to ?? `${base}/check-in` })
    }
  }

  // Today's radiation against the daily limit. The career total is judged separately, above.
  const dose = radiationToday(state, person)
  if (dose && !rows.some((r) => r.about === 'radiation')) {
    rows.push({ kind: 'warning', title: 'Radiation exposure', detail: `${dose.rate.toFixed(2)} mSv today · limit ${dose.limit} a day`, hint: 'See what to do', to: `${base}/indicator/radiation` })
  }

  const exercised = readingsFor(state, person.id, 'exercise').filter((r) => Math.floor(r.t) === state.day).reduce((sum, r) => sum + r.v, 0)
  if (exercised < EXERCISE_PLAN_MIN && !rows.some((r) => r.about === 'exercise')) {
    rows.push({ kind: 'check', title: 'Exercise session', detail: `${Math.round(exercised)} of ${EXERCISE_PLAN_MIN} minutes done today`, to: `${base}/indicator/exercise` })
  }
  if (!checkedInToday(state, person.id)) {
    rows.push({ kind: 'check', title: 'Daily check-in', detail: 'Two minutes: how you feel and any symptoms', to: `${base}/check-in` })
  }
  return rows.sort((a, b) => ORDER[a.kind] - ORDER[b.kind])
}

export function RisksAndChecks({ state, person }: { state: AppState; person: Person }) {
  const { openCall } = useCall()
  const { stepAt } = useStore()
  const rows = risksAndChecks(state, person)
  return <div className="dashboard-card reminders risks-checks" aria-label="Risks and checks for today">
    <header><h2>Risks & checks</h2></header>
    {rows.length === 0 && <p className="reminders-empty">No risks, and every check for today is done.</p>}
    {rows.map((row) => {
      const tone = `reminder-row ${row.kind === 'warning' ? 'priority-high' : row.kind === 'caution' ? 'priority-soon' : 'is-check'}`
      const label = row.kind === 'warning' ? 'Warning' : row.kind === 'caution' ? 'Caution' : 'To do today'
      const inside = <><span className="reminder-icon" title={label}>{row.kind === 'check' ? '' : '!'}<span className="sr-only">{label}</span></span><div><strong>{row.title}</strong><small>{row.detail}</small>{row.action && actionDone(state.day, row.action, stepAt) ? <em className="is-done">✓ Steps done today</em> : row.hint && <em>{row.hint}</em>}</div><span className="check-arrow">↗</span></>
      return row.to
        ? <Link key={row.kind + row.title} className={tone} to={row.to}>{inside}</Link>
        : <button key={row.kind + row.title} className={tone} onClick={() => openCall(row.about)}>{inside}</button>
    })}
  </div>
}
