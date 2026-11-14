import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PaperPlot } from '../components/research/PaperPlot'
import { downloadResearch, RESEARCH_LABELS, RESEARCH_VITALS, researchSummary } from '../lib/research'
import { SUBJECTS, VITAL_INFO, volunteerName } from '../lib/replay'
import '../research.css'

export function DeepData() {
  const [subjectId, setSubjectId] = useState('UTMB-01')
  const [days, setDays] = useState(28)
  const subject = SUBJECTS.find((s) => s.id === subjectId) ?? SUBJECTS[0]
  const lastDay = Math.max(...subject.days.map((d) => d.day))
  const [selectedEnd, setSelectedEnd] = useState<number | null>(null)
  const end = Math.min(selectedEnd ?? lastDay, lastDay)
  const start = Math.max(1, end - days + 1)
  const reviews = RESEARCH_VITALS.map((vital) => ({ vital, ...researchSummary(subject, vital, start, end) }))
  const flagged = reviews.filter((r) => r.over !== undefined && r.over > 0)
  const exportCsv = () => {
    const rows = [['subject', 'bed_rest_day', 'heart_rate_bpm', 'systolic_mmhg', 'temperature_c'], ...subject.days.filter((d) => d.day >= start && d.day <= end).map((d) => [subject.id, d.day, d.values.hr ?? '', d.values.sys ?? '', d.values.temp ?? ''])]
    downloadResearch(rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv;charset=utf-8', `${subject.id}-D${start}-${end}.csv`)
  }
  return <div className="planet-page research-page">
    <header className="planet-page-title"><h1>Deep Data</h1><div className="data-page-actions"><Link className="btn btn-secondary" to="/replay">Earth limits vs. your normal ↗</Link><button className="btn btn-secondary" onClick={exportCsv}>Download data ↓</button></div></header>
    <div className="research-toolbar">
      <label>Volunteer<select value={subject.id} onChange={(e) => { setSubjectId(e.target.value); setSelectedEnd(null) }}>{SUBJECTS.map((s) => <option key={s.id} value={s.id}>{volunteerName(s.id)}</option>)}</select></label>
      <div className="research-ranges" role="group" aria-label="Data time range">{[7, 28, 90].map((d) => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>{d} days</button>)}</div>
      <label>End day<input aria-label="End bed-rest day" type="number" min={1} max={lastDay} value={end} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) setSelectedEnd(Math.max(1, Math.min(lastDay, Math.round(n)))) }} /></label>
      <span className="research-interval">Days {start}–{end} of bed rest</span>
    </div>
    <div className="research-layout">
      <section className="research-figures" aria-label="Three scientific study plots">
        
        {RESEARCH_VITALS.map((vital) => <PaperPlot key={`${subject.id}-${vital}`} subject={subject} vital={vital} start={start} end={end} />)}
        <details className="research-method"><summary>How these figures are made</summary><p>These are real daily readings from a NASA study in which healthy volunteers stayed in bed, tilted slightly head-down, for up to 90 days. This imitates weightlessness on the ground. The volunteer is a study participant, not you.</p><p>White squares are the daily readings; days without a reading are left empty. The blue line is the average of the last 7 days, and the shaded area shows how much the readings usually vary. The grey line is the volunteer’s normal before bed rest. The yellow line is ORBIT’s personal limit: heart rate 20% above normal, upper blood pressure 20 mmHg above, or temperature 0.5 °C above. These are prototype limits, not medical cut-offs.</p><a href="https://doi.org/10.83263/wjw1-ta27" target="_blank" rel="noreferrer">Source: NASA bed-rest study records ↗</a></details>
      </section>
      <aside className="research-sidebar" aria-label="Medical summary and mental health tips">
        <section className="clinical-summary"><header><h2>Medical summary</h2><span className="clinical-draft">Automated draft</span></header><p className="review-context">{volunteerName(subject.id)} · days {start}–{end}</p><div className={`review-conclusion ${flagged.length ? 'needs-review' : ''}`}><strong>{flagged.length ? `${flagged.length} ${flagged.length === 1 ? 'measurement' : 'measurements'} to review` : reviews.every((r) => r.stats.n) ? 'Nothing above the personal limits' : 'Incomplete measurements'}</strong><p>{flagged.length ? 'Some readings went above this volunteer’s personal limits. Look at those days in the figures.' : 'This describes recorded signals only; it does not establish overall health.'}</p></div>
          {reviews.map((r) => <article key={r.vital} className="clinical-vital"><div><h3>{RESEARCH_LABELS[r.vital]}</h3><span className={r.over ? 'review-flag' : ''}>{r.stats.n ? r.over === undefined ? 'No earlier value' : `${r.over} of ${r.stats.n} days above limit` : 'No data'}</span></div><p>{r.stats.mean === undefined ? 'No observations in this interval.' : `Average ${r.stats.mean.toFixed(r.vital === 'temp' ? 2 : 1)} ${VITAL_INFO[r.vital].unit}${r.delta === undefined ? '' : `, ${r.delta >= 0 ? '+' : '−'}${Math.abs(r.delta).toFixed(r.vital === 'temp' ? 2 : 1)} compared with before bed rest`}.`}</p><small>{r.latest ? `Last reading: ${r.latest.value} ${VITAL_INFO[r.vital].unit} on day ${r.latest.day}` : 'Missing days are not counted as normal.'}</small></article>)}
          <div className="clinical-next"><strong>Suggested follow-up</strong><p>{flagged.length ? 'Talk to the medical lead about readings that stay above the limit, together with any symptoms.' : 'Continue the planned check schedule and record any new symptoms.'}</p></div><p className="clinical-note">Written automatically from the readings. No doctor has reviewed it.</p>
        </section>
        <section className="research-wellbeing"><h2>Between check-ins</h2><p className="wellbeing-context">General prompts. Mood and sleep were not measured in these plotted records.</p><div><p><strong>Protect a regular sleep window.</strong><small>Keep rest on the schedule, especially during busy work periods.</small></p></div><div><p><strong>Stay connected.</strong><small>Make time for a private conversation with someone you trust.</small></p></div><div><p><strong>Record how you feel.</strong><small>Use a short check-in to notice changes in mood and energy.</small></p></div><Link className="wellbeing-link" to="/mental-health">Open personal diary <span>↗</span></Link><a className="wellbeing-reference" href="https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/" target="_blank" rel="noreferrer">NASA · wellbeing in isolation ↗</a></section>
      </aside>
    </div>
  </div>
}
