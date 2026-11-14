import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { judgeSubject, subjectById, totals, type Judged } from '../../lib/replay'

/** The volunteer the card replays: normal blood pressure right on Earth's line. */
const SUBJECT = 'UTMB-01'
const DURATION_MS = 1600

const ALL = totals()
const per180 = (n: number) => Math.round((n / ALL.days) * 180)

/** Days shown so far: fills once on mount and again on request. Reduced motion shows the end at once. */
function useReveal(total: number): [number, () => void] {
  const [shown, setShown] = useState(total)
  const [run, setRun] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(total)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION_MS, 1)
      setShown(Math.round(total * (1 - (1 - p) ** 2)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    setShown(0)
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [total, run])
  return [shown, () => setRun((r) => r + 1)]
}

/** Earth's fixed limits against the person's own normal, on one real bed-rest volunteer. */
export function LimitsCard() {
  const days = useMemo(() => judgeSubject(subjectById(SUBJECT)!), [])
  const [shown, replay] = useReveal(days.length)
  const seen = days.slice(0, shown)
  const earth = seen.filter((d) => d.earthAlarm).length
  const orbit = seen.filter((d) => d.orbitAlarm).length
  const plural = (n: number) => (n === 1 ? 'alarm' : 'alarms')

  return (
    <article className="dashboard-card limits-card">
      <header><h2>Earth limits vs. your normal</h2><span className="card-note">NASA data</span></header>
      <button className="limits-lanes" onClick={replay} aria-label={`Replay: ${earth} Earth ${plural(earth)}, ${orbit} ORBIT ${plural(orbit)} in ${days.length} days`}>
        <Lane label="Earth limits" count={earth} days={days} shown={shown} alarm={(d) => d.earthAlarm} />
        <Lane label="Your normal" count={orbit} days={days} shown={shown} alarm={(d) => d.orbitAlarm} />
      </button>
      <p className="limits-caption">One healthy volunteer, {days.length} days of bed rest. Each bar is an alarm.</p>
      <Link className="limits-link" to={`/replay?s=${SUBJECT}`}>
        <span>All {ALL.subjects}: {per180(ALL.earth)} vs {per180(ALL.orbit)} alarms in 6 months</span>
        <span aria-hidden="true">↗</span>
      </Link>
    </article>
  )
}

function Lane({ label, count, days, shown, alarm }: {
  label: string
  count: number
  days: Judged[]
  shown: number
  alarm: (d: Judged) => boolean
}) {
  return (
    <span className="limits-lane">
      <span className="limits-lane-head"><span>{label}</span><strong>{count}</strong></span>
      <span className="limits-bars" aria-hidden="true">
        {days.map((d, i) => <i key={d.day} className={i >= shown ? 'is-future' : alarm(d) ? 'is-alarm' : ''} />)}
      </span>
    </span>
  )
}
