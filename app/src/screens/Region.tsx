import { useParams } from 'react-router-dom'
import { BackLink } from '../components/Shell'
import { StatusTile, SymptomTile } from '../components/Tiles'
import { REGIONS } from '../lib/indicators'
import { SEVERITY, judge, regionIndicators } from '../lib/judge'
import { useStore } from '../lib/store'
import type { RegionKey } from '../lib/types'
import { Missing, ScreenTitle, usePerson } from './common'

export function Region() {
  const person = usePerson()
  const { rid } = useParams()
  const { state } = useStore()
  if (!person || !rid || !(rid in REGIONS)) return <Missing />

  const region = REGIONS[rid as RegionKey]
  const keys = regionIndicators(region.key)
    .map((k) => ({ k, sev: SEVERITY[judge(state, person, k).status] }))
    .sort((a, b) => b.sev - a.sev)
    .map((x) => x.k)

  return (
    <div className="screen">
      <BackLink to={`/body/${person.id}`}>Your body</BackLink>
      <ScreenTitle sub={region.intro}>{region.name}</ScreenTitle>
      <div className="tile-grid">
        <SymptomTile person={person} region={region.key} />
        {keys.map((k) => (
          <StatusTile key={k} person={person} k={k} />
        ))}
      </div>
    </div>
  )
}
