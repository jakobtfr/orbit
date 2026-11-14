import { Link, useParams } from 'react-router-dom'
import { BackLink } from '../components/Shell'
import { StatusTile } from '../components/Tiles'
import { MUSCLE_GROUPS, type MuscleKey } from '../lib/anatomy'
import { Missing, ScreenTitle, usePerson } from './common'

export function Muscle() {
  const person = usePerson()
  const { muscleId } = useParams()
  if (!person || !muscleId || !Object.hasOwn(MUSCLE_GROUPS, muscleId)) return <Missing />
  const muscle = MUSCLE_GROUPS[muscleId as MuscleKey]
  return <div className="screen">
    <BackLink to={`/body/${person.id}`}>Body map</BackLink>
    <ScreenTitle sub={muscle.anatomy}>{muscle.name}</ScreenTitle>
    <p className="body prose">{muscle.intro}</p>
    <p className="note body-sm">Exercise completion is tracked for the whole body. No local muscle strength or blood-flow measurement is available.</p>
    <div className="tile-grid"><StatusTile person={person} k="exercise" /><StatusTile person={person} k="bone" /></div>
    <Link className="btn btn-secondary" to={`/body/${person.id}/check-in`}>Report soreness or other symptoms</Link>
  </div>
}
