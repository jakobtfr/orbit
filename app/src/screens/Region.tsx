import { useParams } from 'react-router-dom'
import { BackLink } from '../components/Shell'
import { StatusTile, SymptomTile } from '../components/Tiles'
import { REGIONS } from '../lib/indicators'
import { SEVERITY, canSee, judge, regionIndicators, seesEverything } from '../lib/judge'
import { useStore } from '../lib/store'
import type { RegionKey } from '../lib/types'
import { Missing, PrivacyLine, ScreenTitle, usePerson } from './common'

export function Region() {
  const person = usePerson()
  const { rid } = useParams()
  const { state, viewer } = useStore()
  if (!person || !rid || !(rid in REGIONS)) return <Missing />

  const region = REGIONS[rid as RegionKey]
  const keys = regionIndicators(region.key)
    .filter((k) => canSee(viewer, person, k))
    .map((k) => ({ k, sev: SEVERITY[judge(state, person, k).status] }))
    .sort((a, b) => b.sev - a.sev)
    .map((x) => x.k)
  const showSymptoms = canSee(viewer, person, 'symptoms')

  return (
    <div className="screen">
      <BackLink to={`/body/${person.id}`}>{viewer.id === person.id ? 'Your body' : person.name}</BackLink>
      <ScreenTitle sub={region.intro}>{region.name}</ScreenTitle>
      {keys.length === 0 && !showSymptoms ? (
        <p className="empty-line">Nothing in this region is shared with you.</p>
      ) : (
        <div className="tile-grid">
          {showSymptoms && <SymptomTile person={person} region={region.key} />}
          {keys.map((k) => (
            <StatusTile key={k} person={person} k={k} />
          ))}
        </div>
      )}
      {!seesEverything(viewer, person) && <PrivacyLine person={person} />}
    </div>
  )
}
