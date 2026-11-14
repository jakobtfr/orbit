import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { judgeSubject, subjectById, totals, type Judged } from '../../lib/replay'

/** The volunteer the strip replays: normal blood pressure right on Earth's line. */
const SUBJECT = 'UTMB-01'
const DURATION_MS = 2600

const ALL = totals()
const per180 = (n: number) => Math.round((n / ALL.days) * 180)
const oneIn = (n: number) => Math.round(ALL.days / n)

/** Days shown so far: counts up once on mount, and again on request. Reduced motion shows the end at once. */
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

export function WhyOrbit() {
  const days = useMemo(() => judgeSubject(subjectById(SUBJECT)!), [])
  const [shown, replay] = useReveal(days.length)
  const seen = days.slice(0, shown)
  const earth = seen.filter((d) => d.earthAlarm).length
  const orbit = seen.filter((d) => d.orbitAlarm).length

  return (
    <section className="why-orbit" aria-label="Why ORBIT">
      <div className="why-copy">
        <p className="eyebrow">WHY ORBIT · REAL NASA DATA</p>
        <h2>Judged against <em>your</em> normal, not Earth’s.</h2>
        <p>
          In space the body runs differently, so Earth’s limits cry wolf. In NASA bed-rest data from {ALL.subjects} healthy
          volunteers, Earth limits raised an alarm on 1 day in {oneIn(ALL.earth)}. Against each person’s own normal: 1 in {oneIn(ALL.orbit)}.
        </p>
      </div>

      <button className="why-lanes" onClick={replay} aria-label={`Replay ${SUBJECT}: ${earth} Earth ${earth === 1 ? 'alarm' : 'alarms'} against ${orbit} ORBIT ${orbit === 1 ? 'alarm' : 'alarms'}`}>
        <Lane label="Earth limits" count={earth} days={days} shown={shown} alarm={(d) => d.earthAlarm} />
        <Lane label="ORBIT" count={orbit} days={days} shown={shown} alarm={(d) => d.orbitAlarm} calm />
        <span className="why-caption">
          <span>Volunteer {SUBJECT} · day {Math.max(shown, 1)} of {days.length} · each bar is one real alarm</span>
          <span className="why-again" aria-hidden="true">↻ Play again</span>
        </span>
      </button>

      <div className="why-result">
        <div className="why-numbers" aria-label={`About ${per180(ALL.earth)} alarms per person in 6 months with Earth limits, ${per180(ALL.orbit)} with ORBIT`}>
          <span className="why-from">{per180(ALL.earth)}</span>
          <span className="why-arrow" aria-hidden="true">→</span>
          <span className="why-to">{per180(ALL.orbit)}</span>
        </div>
        <p>alarms for a healthy person in 6 months</p>
        <Link className="why-link" to={`/replay?s=${SUBJECT}`}>Explore the replay <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  )
}

function Lane({ label, count, days, shown, alarm, calm }: {
  label: string
  count: number
  days: Judged[]
  shown: number
  alarm: (d: Judged) => boolean
  calm?: boolean
}) {
  return (
    <span className={`why-lane ${calm ? 'is-calm' : ''}`}>
      <span className="why-lane-head">
        <span>{label}</span>
        <strong>{count}</strong>
      </span>
      <span className="why-bars" aria-hidden="true">
        {days.map((d, i) => (
          <i key={d.day} className={i >= shown ? 'is-future' : alarm(d) ? 'is-alarm' : ''} />
        ))}
      </span>
    </span>
  )
}
