import { statistics } from './dashboard'
import { personalLimit, type Subject, type Vital } from './replay'

export const RESEARCH_VITALS: Vital[] = ['hr', 'sys', 'temp']
export const RESEARCH_LABELS: Record<string, string> = { hr: 'Resting heart rate', sys: 'Systolic blood pressure', temp: 'Body temperature' }
export function researchSeries(subject: Subject, vital: Vital, start: number, end: number) {
  return subject.days.filter((d) => d.day >= start && d.day <= end).flatMap((d) => {
    const value = d.values[vital]
    if (value === null || !Number.isFinite(value)) return []
    const previous = subject.days.filter((r) => r.day > d.day - 7 && r.day <= d.day).flatMap((r) => r.values[vital] === null ? [] : [r.values[vital]!])
    return [{ day: d.day, value, rolling: statistics(previous) }]
  })
}
export function researchSummary(subject: Subject, vital: Vital, start: number, end: number) {
  const series = researchSeries(subject, vital, start, end)
  const stats = statistics(series.map((p) => p.value))
  const baseline = subject.baseline[vital]
  const limit = personalLimit(vital, subject.baseline)
  const over = limit === null ? undefined : series.filter((p) => p.value >= limit).length
  const delta = baseline === null || stats.mean === undefined ? undefined : stats.mean - baseline
  return { series, stats, baseline, limit, over, delta, latest: series.at(-1) }
}

/** Download self-contained CSV or SVG without sending study records to a service. */
export function downloadResearch(text: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
