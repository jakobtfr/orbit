import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BodyFigure } from '../components/BodyFigure'
import { HealthPrompt } from '../components/HealthPrompt'
import { FamilyTeaser } from '../components/FamilyTeaser'
import { ActivityPanel } from '../components/dashboard/ActivityPanel'
import { ScientificPlot } from '../components/dashboard/ScientificPlot'
import { MUSCLE_GROUPS, muscleStatus, type MuscleKey } from '../lib/anatomy'
import { metrics } from '../lib/dashboard'
import { regionSummaries } from '../lib/judge'
import { useStore } from '../lib/store'
import type { RegionKey } from '../lib/types'
import { Missing, usePerson } from './common'

export function Body() {
  const person = usePerson()
  const { state } = useStore()
  const nav = useNavigate()
  const [active, setActive] = useState<RegionKey | null>(null)
  if (!person) return <Missing />
  const summaries = regionSummaries(state, person)
  const base = `/body/${person.id}`
  const muscleStatuses = Object.fromEntries((Object.keys(MUSCLE_GROUPS) as MuscleKey[]).map((k) => [k, muscleStatus(state, person, k)])) as Record<MuscleKey, ReturnType<typeof muscleStatus>>
  return <div className="screen dashboard-screen">
    <HealthPrompt />
    <FamilyTeaser />
    <div className="dashboard-grid">
      <section className="dashboard-column body-column" aria-label="Interactive body map">
        <BodyFigure muscleStatuses={muscleStatuses} summaries={summaries} active={active} onActive={setActive} onSelect={(r) => nav(`${base}/region/${r}`)} onMuscleSelect={(m) => nav(`${base}/muscle/${m}`)} />
      </section>
      <ActivityPanel state={state} person={person} />
      <section className="dashboard-column science-column" aria-label="Three health trend plots">
        {metrics(state, person).filter((m) => ['hr', 'temp', 'radiation'].includes(m.key)).map((m) => <ScientificPlot key={m.key} metric={m} state={state} person={person} days={28} />)}
      </section>
    </div>
  </div>
}
