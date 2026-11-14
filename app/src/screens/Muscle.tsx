import { Link, useParams } from 'react-router-dom'
import { BackLink } from '../components/Shell'
import { StatusMark } from '../components/Status'
import { StatusTile, SymptomTile } from '../components/Tiles'
import { MUSCLE_GROUPS, UNLOADING, muscleStatus, type MuscleKey } from '../lib/anatomy'
import { useCall } from '../lib/call'
import { REGIONS } from '../lib/indicators'
import { SEVERITY, judge, regionIndicators } from '../lib/judge'
import { useStore } from '../lib/store'
import { Missing, ScreenTitle, usePerson } from './common'

export function Muscle() {
  const person = usePerson()
  const { muscleId } = useParams()
  const { state } = useStore()
  const { openCall } = useCall()
  if (!person || !muscleId || !Object.hasOwn(MUSCLE_GROUPS, muscleId)) return <Missing />
  const key = muscleId as MuscleKey
  const muscle = MUSCLE_GROUPS[key]
  const status = muscleStatus(state, person, key)
  // Everything ORBIT watches that bears on this part: its health region and the indicators that protect it. Most serious first.
  const keys = [...new Set([...regionIndicators(muscle.region), ...muscle.watch])]
    .map((k) => ({ k, sev: SEVERITY[judge(state, person, k).status] }))
    .sort((a, b) => b.sev - a.sev)
    .map((x) => x.k)
  const off = status === 'caution' || status === 'warning'
  return <div className="screen">
    <BackLink to={`/body/${person.id}`}>Body map</BackLink>
    <ScreenTitle sub={muscle.anatomy}>{muscle.name}</ScreenTitle>
    <div className="muscle-summary"><StatusMark status={status} /><span className="tag">{UNLOADING[muscle.unloading]}</span><span className="tag">{REGIONS[muscle.region].name}</span></div>
    <p className="body prose">{muscle.intro} {muscle.inFlight}</p>
    <section aria-label="What is watched for this part">
      <h2 className="title-3">What ORBIT watches here</h2>
      <div className="tile-grid">
        <SymptomTile person={person} region={muscle.region} />
        {keys.map((k) => <StatusTile key={k} person={person} k={k} />)}
      </div>
    </section>
    <section aria-label="Training">
      <h2 className="title-3">Trained by</h2>
      <ul className="muscle-training">{muscle.trainedBy.map((t) => <li key={t}>{t}</li>)}</ul>
    </section>
    <p className="note body-sm">No sensor measures a single muscle. The status above comes from the readings shown here; the effect of weightlessness is a general finding from spaceflight research, not a measurement of your own muscle.</p>
    <div className="choice-row">
      <Link className="btn btn-secondary" to={`/body/${person.id}/check-in`}>Report soreness or other symptoms</Link>
      <button className="btn btn-secondary" onClick={() => openCall(off ? muscle.region : undefined)}>Call the doctor</button>
    </div>
  </div>
}
