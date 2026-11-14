import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PaperPlot } from '../components/research/PaperPlot'
import { downloadResearch, RESEARCH_LABELS, RESEARCH_VITALS, researchSummary } from '../lib/research'
import { SUBJECTS, VITAL_INFO } from '../lib/replay'
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
    <header className="planet-page-title"><div><p className="eyebrow">NASA UTMB / OBSERVATIONAL RECORDS</p><h1>Deep Data</h1></div><div className="data-page-actions"><Link className="btn btn-secondary" to="/replay">Compare rule sets ↗</Link><button className="btn btn-secondary" onClick={exportCsv}>Export CSV ↓</button></div></header>
    <div className="research-toolbar">
      <label>Study participant<select value={subject.id} onChange={(e) => { setSubjectId(e.target.value); setSelectedEnd(null) }}>{SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.id} · {s.campaign}</option>)}</select></label>
      <div className="research-ranges" role="group" aria-label="Data time range">{[7, 28, 90].map((d) => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>{d} days</button>)}</div>
      <label>End day<input aria-label="End bed-rest day" type="number" min={1} max={lastDay} value={end} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) setSelectedEnd(Math.max(1, Math.min(lastDay, Math.round(n)))) }} /></label>
      <span className="research-interval">Days {start}–{end} · {subject.id} · ground study</span>
    </div>
    <div className="research-layout">
      <section className="research-figures" aria-label="Three scientific study plots">
        <div className="research-legend"><span><i className="legend-observation" />Daily observation</span><span><i className="legend-mean" />7-day mean ±1 SD</span><span><i className="legend-baseline" />Pre-bed-rest mean</span><span><i className="legend-limit" />Personal review threshold</span></div>
        {RESEARCH_VITALS.map((vital, index) => <PaperPlot key={`${subject.id}-${vital}`} subject={subject} vital={vital} start={start} end={end} index={index} />)}
        <details className="research-method"><summary>Methods & data provenance</summary><p>Daily values are unaltered observations from NASA UTMB head-down bed-rest extracts. This participant is a study subject, not the signed-in astronaut. Black squares and thin lines show the daily observations; gaps are not interpolated. Blue curves are trailing seven-day arithmetic means; the shaded band is ±1 sample SD with n−1 denominator. It describes temporal variability, not a confidence interval or instrument error. Overlapping windows are correlated. SD bands are omitted where fewer than two observations are available.</p><p>Green lines are the subject’s pre-bed-rest means ({subject.baseline.days} baseline days in the source). Orange lines are ORBIT prototype review thresholds: heart rate +20%, systolic BP +20 mmHg, and temperature +0.5 °C relative to baseline. They are not validated diagnostic limits. No flight temperature adjustment is applied to these ground observations. Plot footer statistics use only observed values in the selected interval. Y-axes are scaled independently and need not start at zero.</p><p>Selected interval: {start}–{end}. A 90-day selection shows only available days; no observations are fabricated. SVG exports preserve the full vector figure. CSV exports preserve missing values as empty cells.</p><a href="https://doi.org/10.83263/wjw1-ta27" target="_blank" rel="noreferrer">NASA UTMB Case Report Form · DOI 10.83263/wjw1-ta27 ↗</a></details>
      </section>
      <aside className="research-sidebar" aria-label="Medical summary and mental health tips">
        <section className="clinical-summary"><header><span className="eyebrow">RECORD REVIEW</span><span className="clinical-draft">AUTOMATED DRAFT</span></header><h2>Medical summary</h2><p className="review-context">{subject.id} · days {start}–{end}</p><div className={`review-conclusion ${flagged.length ? 'needs-review' : ''}`}><strong>{flagged.length ? `${flagged.length} ${flagged.length === 1 ? 'signal' : 'signals'} to review` : reviews.every((r) => r.stats.n) ? 'No upper-limit crossings' : 'Incomplete measurements'}</strong><p>{flagged.length ? 'Personal review thresholds were crossed in this interval. Review the daily values and context.' : 'This describes recorded signals only; it does not establish overall health.'}</p></div>
          {reviews.map((r) => <article key={r.vital} className="clinical-vital"><div><h3>{RESEARCH_LABELS[r.vital]}</h3><span className={r.over ? 'review-flag' : ''}>{r.stats.n ? r.over === undefined ? 'No baseline' : `${r.over}/${r.stats.n} above limit` : 'No data'}</span></div><p>{r.stats.mean === undefined ? 'No observations in this interval.' : `Mean ${r.stats.mean.toFixed(r.vital === 'temp' ? 2 : 1)} ${VITAL_INFO[r.vital].unit}${r.delta === undefined ? '' : `; ${r.delta >= 0 ? '+' : '−'}${Math.abs(r.delta).toFixed(r.vital === 'temp' ? 2 : 1)} from baseline`}.`}</p><small>{r.latest ? `Last observed: ${r.latest.value} ${VITAL_INFO[r.vital].unit} · day ${r.latest.day}` : 'Missing values are not treated as normal.'}</small></article>)}
          <div className="clinical-next"><strong>Suggested follow-up</strong><p>{flagged.length ? 'Review repeated threshold crossings with the medical lead. Interpret alongside symptoms, activity, and measurement conditions.' : 'Continue the planned check schedule and record any new symptoms.'}</p></div><p className="clinical-note">Rule-based research summary. No clinician has reviewed it; this dataset contains no confirmed illness outcomes.</p>
        </section>
        <section className="research-wellbeing"><header><span className="eyebrow">MENTAL HEALTH</span><h2>Between check-ins</h2></header><p className="wellbeing-context">General prompts. Mood and sleep were not measured in these plotted records.</p><div><span>01</span><p><strong>Protect a regular sleep window.</strong><small>Keep rest on the schedule, especially during busy work periods.</small></p></div><div><span>02</span><p><strong>Stay connected.</strong><small>Make time for a private conversation with someone you trust.</small></p></div><div><span>03</span><p><strong>Record how you feel.</strong><small>Use a short check-in to notice changes in mood and energy.</small></p></div><Link className="wellbeing-link" to="/mental-health">Open private check-in <span>↗</span></Link><a className="wellbeing-reference" href="https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/" target="_blank" rel="noreferrer">NASA · wellbeing in isolation ↗</a></section>
      </aside>
    </div>
  </div>
}
