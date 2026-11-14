import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StatusShape } from '../components/Status'
import {
  SUBJECTS,
  VITALS,
  VITAL_INFO,
  earthLimit,
  judgeSubject,
  mainVital,
  personalLimit,
  subjectById,
  volunteerName,
  totals,
  type Judged,
  type Subject,
  type Vital,
} from '../lib/replay'
import { ScreenTitle } from './common'

/** Two volunteers that show the two halves of the story. Any other can be picked from the list. */
const FEATURED = [
  { id: 'UTMB-01', label: 'Normal runs high', story: 'This volunteer’s blood pressure is 132/80 before bed rest: right on Earth’s line of 130/80. Even with the same two-day check, Earth limits raise an alarm on a third of the days. Against their own normal, almost nothing is unusual.' },
  { id: 'UTMB-40', label: 'Slow heart-rate rise', story: 'Resting heart rate creeps up from 55 as the body gets used to lying still. It never comes near Earth’s line of 100, so Earth limits stay silent. ORBIT sees a rise of more than 20% against this volunteer’s own normal.' },
]

const ALL = totals()
const pct = (n: number, d: number) => `${((n / d) * 100).toFixed(1)}%`
const per180 = (n: number, d: number) => Math.round((n / d) * 180)
const fmt = (v: Vital, x: number) => x.toFixed(VITAL_INFO[v].decimals)

export function Replay() {
  const [params, setParams] = useSearchParams()
  const subject = subjectById(params.get('s') ?? '') ?? subjectById(FEATURED[0].id)!
  const judged = useMemo(() => judgeSubject(subject), [subject])
  const [vital, setVital] = useState<Vital>(() => mainVital(judged))
  const [index, setIndex] = useState(judged.length - 1)
  const [playing, setPlaying] = useState(false)

  const pick = (id: string) => {
    const s = subjectById(id)!
    const j = judgeSubject(s)
    setParams({ s: id }, { replace: true })
    setVital(mainVital(j))
    setIndex(0)
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setIndex((i) => {
        if (i >= judged.length - 1) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, 90)
    return () => clearInterval(id)
  }, [playing, judged.length])

  const shown = judged.slice(0, index + 1)
  const earth = shown.filter((d) => d.earthConfirmed).length
  const orbit = shown.filter((d) => d.orbitAlarm).length
  const today = judged[index]
  const featured = FEATURED.find((f) => f.id === subject.id)

  const play = () => {
    if (index >= judged.length - 1) setIndex(0)
    setPlaying((p) => !p)
  }

  return (
    <div className="screen replay-screen">
      <ScreenTitle sub="Real NASA bed-rest data. Healthy volunteers lay tilted head-down for 60 to 90 days, the standard way to imitate weightlessness on the ground. Every day is judged twice with the same rule, an alarm only when two days in a row are over the line: once by Earth’s fixed limits, once by ORBIT against the person’s own values from before.">
        Earth’s normal or yours?
      </ScreenTitle>

      <section className="replay-totals" aria-label="All volunteers">
        <Total title="Earth limits, 2 days in a row" share={pct(ALL.earthConfirmed, ALL.days)} per={per180(ALL.earthConfirmed, ALL.days)} />
        <Total title="ORBIT, 2 days in a row" share={pct(ALL.orbit, ALL.days)} per={per180(ALL.orbit, ALL.days)} />
        <p className="body-sm note replay-totals-note">
          All {ALL.subjects} volunteers, {ALL.days.toLocaleString('en')} days. Same rule on both sides: {(ALL.earthConfirmed / ALL.orbit).toFixed(1)} times fewer alarms. Everyone was healthy, so an alarm here is almost always a false one.
        </p>
        <table className="table replay-compare">
          <caption className="label">Every way of counting, share of days with an alarm</caption>
          <thead>
            <tr><th scope="col">Rule</th><th scope="col">Any single day</th><th scope="col">2 days in a row</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row" className="cell-name">Earth limits (100 bpm, 130/80, 38.0 °C)</th><td className="cell-value">{pct(ALL.earth, ALL.days)}</td><td className="cell-value">{pct(ALL.earthConfirmed, ALL.days)}</td></tr>
            <tr><th scope="row" className="cell-name">Stricter Earth limits (140/90)</th><td className="cell-value">{pct(ALL.earthStrict, ALL.days)}</td><td className="cell-value">–</td></tr>
            <tr><th scope="row" className="cell-name">ORBIT, your own normal</th><td className="cell-value">{pct(ALL.orbitSingle, ALL.days)}</td><td className="cell-value">{pct(ALL.orbit, ALL.days)}</td></tr>
          </tbody>
        </table>
        <p className="body-sm note replay-totals-note">
          A stricter Earth cutoff of 140/90 alarms less often, but it is still one line for everyone: it misses the slow heart-rate rise below, which stays far under 100 bpm.
        </p>
      </section>

      <section>
        <div className="section-row">
          <h2 className="title-2">One volunteer, day by day</h2>
          <div className="segmented" role="group" aria-label="Volunteer">
            {FEATURED.map((f) => (
              <button key={f.id} className={`btn btn-secondary ${subject.id === f.id ? 'is-selected' : ''}`} aria-pressed={subject.id === f.id} onClick={() => pick(f.id)}>
                {f.label}
              </button>
            ))}
            <select className="input replay-select" aria-label="Other volunteer" value={featured ? '' : subject.id} onChange={(e) => e.target.value && pick(e.target.value)}>
              <option value="">Other volunteer…</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>{volunteerName(s.id)}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="body prose">{featured?.story ?? `${volunteerName(subject.id)}, ${judged.length} days in bed rest.`}</p>
      </section>

      <section className="replay-player">
        <div className="replay-controls">
          <button className="btn btn-primary" onClick={play}>{playing ? 'Pause' : index >= judged.length - 1 ? 'Replay' : 'Play'}</button>
          <input
            type="range"
            min={0}
            max={judged.length - 1}
            value={index}
            aria-label="Day"
            onChange={(e) => {
              setPlaying(false)
              setIndex(Number(e.target.value))
            }}
          />
          <span className="data replay-day">Day {today.day} of {judged[judged.length - 1].day}</span>
        </div>

        <Lane title="Earth limits" count={earth} days={judged} index={index} alarm={(d) => d.earthConfirmed} />
        <Lane title="ORBIT" count={orbit} days={judged} index={index} alarm={(d) => d.orbitAlarm} />

        <Today subject={subject} day={today} />
      </section>

      <section>
        <div className="section-row">
          <h2 className="title-3">{VITAL_INFO[vital].name}</h2>
          <div className="segmented" role="group" aria-label="Vital sign">
            {VITALS.map((v) => (
              <button key={v} className={`btn btn-secondary ${vital === v ? 'is-selected' : ''}`} aria-pressed={vital === v} onClick={() => setVital(v)}>
                {VITAL_INFO[v].name.replace('Blood pressure, ', 'BP ')}
              </button>
            ))}
          </div>
        </div>
        <ReplayChart subject={subject} days={judged} index={index} vital={vital} />
      </section>

      <p className="body-sm note">
        Earth limits: heart rate over 100, blood pressure 130/80 or more, temperature 38.0 °C or more, on two days in a row. ORBIT: heart rate 20% above the person’s own value, upper or lower blood pressure 20 or 15 mmHg above, or temperature 0.5 °C above, on two days in a row. Own values are the average of the days before bed rest. Source: NASA bed-rest study records. Bed rest is a ground stand-in for flight, and this data has no confirmed illness, so it shows fewer false alarms, not that real problems are caught.
      </p>
    </div>
  )
}

function Total({ title, share, per }: { title: string; share: string; per: number }) {
  return (
    <div className="tile replay-total">
      <div className="label">{title}</div>
      <div className="reading-xl">{share}</div>
      <div className="body-sm">of days raised an alarm · about {per} alarms per person in 180 days</div>
    </div>
  )
}

function Lane({ title, count, days, index, alarm }: { title: string; count: number; days: Judged[]; index: number; alarm: (d: Judged) => boolean }) {
  const W = 900
  const H = 28
  const step = W / days.length
  return (
    <div className="lane">
      <div className="lane-head">
        <span className="label">{title}</span>
        <span className="reading">{count}</span>
        <span className="data">{count === 1 ? 'alarm' : 'alarms'}</span>
      </div>
      <svg className="lane-strip" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${title}: ${count} alarms so far`}>
        {days.map((d, i) => {
          const x = i * step
          if (i > index) return <rect key={i} x={x + 1} y={H / 2 - 1} width={Math.max(step - 2, 1)} height={2} fill="var(--border)" />
          if (!alarm(d)) return <rect key={i} x={x + 1} y={H / 2 - 3} width={Math.max(step - 2, 1)} height={6} rx={1} fill="var(--bg-hover)" />
          return <rect key={i} x={x + 1} y={2} width={Math.max(step - 2, 1)} height={H - 4} rx={1} fill="var(--status-warning)" />
        })}
      </svg>
    </div>
  )
}

function Today({ subject, day }: { subject: Subject; day: Judged }) {
  const lines = VITALS.filter((v) => day.values[v] !== null).map((v) => {
    const x = day.values[v]!
    const own = subject.baseline[v]
    return (
      <div key={v} className="today-row">
        <span className="label">{VITAL_INFO[v].name}</span>
        <span className="data today-value">{fmt(v, x)} {VITAL_INFO[v].unit}</span>
        <span className={`data ${day.earth.includes(v) ? 'is-over' : ''}`}>Earth: {day.earth.includes(v) ? 'over the line' : 'fine'}</span>
        <span className={`data ${day.over.includes(v) ? 'is-over' : ''}`}>
          {own === null ? 'Yours: no value from before' : `Yours: ${fmt(v, own)}, ${day.over.includes(v) ? 'well above' : 'usual'}`}
        </span>
      </div>
    )
  })
  return (
    <div className="today">
      <div className="today-verdicts">
        <Verdict who="Earth limits" alarm={day.earthConfirmed} note={!day.earthConfirmed && day.earthAlarm ? 'Over once. Repeat the reading before raising an alarm.' : undefined} />
        <Verdict who="ORBIT" alarm={day.orbitAlarm} note={!day.orbitAlarm && day.over.length > 0 ? 'Over once. Repeat the reading before raising an alarm.' : undefined} />
      </div>
      {lines}
    </div>
  )
}

function Verdict({ who, alarm, note }: { who: string; alarm: boolean; note?: string }) {
  return (
    <div className="verdict">
      <span className="label">{who}</span>
      <span className="status-mark">
        <StatusShape status={alarm ? 'warning' : note ? 'repeat' : 'ok'} />
        <span style={{ color: alarm ? 'var(--status-warning)' : note ? 'var(--text-primary)' : 'var(--status-ok)' }}>
          {alarm ? 'Alarm' : note ? 'Repeat reading' : 'No alarm'}
        </span>
      </span>
      {note && <span className="body-sm">{note}</span>}
    </div>
  )
}

/** Follows the chart rules in DESIGN.md: plain line, limits as labelled 1 px lines, colour only on alarm points. */
function ReplayChart({ subject, days, index, vital }: { subject: Subject; days: Judged[]; index: number; vital: Vital }) {
  const W = 900
  const H = 260
  const M = { top: 16, right: 150, bottom: 30, left: 48 }
  const pts = days.filter((d) => d.values[vital] !== null)
  if (pts.length < 2) return <p className="empty-line">This volunteer has too few readings of this kind to draw a chart.</p>

  const own = subject.baseline[vital]
  const mine = personalLimit(vital, subject.baseline)
  const earth = earthLimit(vital)
  const values = pts.map((d) => d.values[vital]!)
  const refs = [earth, own, mine].filter((v): v is number => v !== null)
  let lo = Math.min(...values, ...refs)
  let hi = Math.max(...values, ...refs)
  const pad = (hi - lo || 1) * 0.08
  lo -= pad
  hi += pad
  const first = days[0].day
  const last = days[days.length - 1].day
  const x = (t: number) => M.left + ((t - first) / (last - first || 1)) * (W - M.left - M.right)
  const y = (v: number) => M.top + (1 - (v - lo) / (hi - lo)) * (H - M.top - M.bottom)
  const seen = pts.filter((d) => d.day <= days[index].day)
  const path = seen.map((d, i) => `${i ? 'L' : 'M'}${x(d.day).toFixed(1)} ${y(d.values[vital]!).toFixed(1)}`).join(' ')
  const info = VITAL_INFO[vital]

  // Labels sit right of the plot; push apart any that would overlap.
  const lines = [
    { v: earth, label: `Earth ${fmt(vital, earth)}` },
    ...(own !== null ? [{ v: own, label: `Your normal ${fmt(vital, own)}`, dash: '2 4' }] : []),
    ...(mine !== null ? [{ v: mine, label: 'Your limit' }] : []),
  ]
    .map((l) => ({ ...l, ly: y(l.v) + 4 }))
    .sort((a, b) => a.ly - b.ly)
  lines.forEach((l, i) => {
    if (i && l.ly - lines[i - 1].ly < 14) l.ly = lines[i - 1].ly + 14
  })

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${info.name} over bed rest, with Earth's limit and the volunteer's own limit`}>
      {own !== null && mine !== null && (
        <rect x={M.left} y={y(mine)} width={W - M.left - M.right} height={y(own) - y(mine)} fill="var(--bg-surface)" />
      )}
      {lines.map((l) => (
        <g key={l.label}>
          <line x1={M.left} x2={W - M.right} y1={y(l.v)} y2={y(l.v)} stroke="var(--border-control)" strokeDasharray={l.dash} />
          <text className="chart-label" x={W - M.right + 8} y={l.ly}>{l.label}</text>
        </g>
      ))}
      {[first, Math.round((first + last) / 2), last].map((t) => (
        <text key={t} className="chart-label" x={x(t)} y={H - 8} textAnchor="middle">{t}</text>
      ))}
      <text className="chart-label" x={W - M.right + 32} y={H - 8}>Bed-rest day</text>
      <text className="chart-label" x={M.left - 8} y={y(hi - pad) + 4} textAnchor="end">{fmt(vital, hi - pad)}</text>
      <text className="chart-label" x={M.left - 8} y={y(lo + pad) + 4} textAnchor="end">{fmt(vital, lo + pad)}</text>
      <path d={path} fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinejoin="round" />
      {seen.map((d) => {
        const cx = x(d.day)
        const cy = y(d.values[vital]!)
        if (d.orbitAlarm && d.over.includes(vital)) {
          return <path key={d.day} d={`M${cx} ${cy - 6} ${cx + 6} ${cy} ${cx} ${cy + 6} ${cx - 6} ${cy}Z`} fill="var(--status-warning)" stroke="var(--bg-canvas)" />
        }
        return <circle key={d.day} cx={cx} cy={cy} r="2.5" fill="var(--text-primary)" />
      })}
      {index < days.length - 1 && (
        <line x1={x(days[index].day)} x2={x(days[index].day)} y1={M.top} y2={H - M.bottom} stroke="var(--accent)" />
      )}
    </svg>
  )
}
