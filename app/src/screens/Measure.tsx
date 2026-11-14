import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackLink } from '../components/Shell'
import { Tag } from '../components/Status'
import { age, stamp } from '../lib/format'
import { INDICATORS, VISION_LABELS } from '../lib/indicators'
import { now, readingsFor, unavailableReason } from '../lib/judge'
import { useStore } from '../lib/store'
import type { Activity, IndicatorKey } from '../lib/types'
import { Missing, usePerson } from './common'

const ACTIVITIES: { key: Activity; label: string }[] = [
  { key: 'rest', label: 'Resting' },
  { key: 'during', label: 'During exercise' },
  { key: 'after', label: 'After exercise' },
]

export function Measure() {
  const person = usePerson()
  const { key } = useParams()
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [activity, setActivity] = useState<Activity>('rest')
  const [v, setV] = useState('')
  const [v2, setV2] = useState('')
  const [error, setError] = useState('')
  if (!person || !key || !(key in INDICATORS)) return <Missing />

  const k = key as IndicatorKey
  const def = INDICATORS[k]
  const indicatorPath = `/body/${person.id}/indicator/${k}`
  const back = <BackLink to={indicatorPath}>{def.name}</BackLink>
  const title = <h1 className="title-1">Measure {def.name.toLowerCase()}</h1>
  const reason = unavailableReason(k, state.place)
  if (reason || !def.inputLabel) {
    return (
      <div className="screen">
        {back}
        {title}
        <p className="empty-line">{reason ? `Not available here. ${reason}` : 'This value cannot be entered by hand.'}</p>
      </div>
    )
  }

  const t = now(state)
  const all = readingsFor(state, person.id, k)
  const last = all[all.length - 1]

  const save = () => {
    const n = Number(v.replace(',', '.'))
    const n2 = Number(v2.replace(',', '.'))
    if (v.trim() === '' || !Number.isFinite(n) || (def.input2Label && (v2.trim() === '' || !Number.isFinite(n2)))) {
      setError(def.input2Label ? 'Enter both values as numbers.' : 'Enter the value as a number.')
      return
    }
    dispatch({
      type: 'reading',
      personId: person.id,
      key: k,
      reading: { t, v: n, v2: def.input2Label ? n2 : undefined, activity, source: 'Entered by hand', provenance: 'SIMULATED' },
    })
    nav(indicatorPath)
  }

  return (
    <div className="screen measure-screen">
      {back}
      {title}

      <section>
        <div className="label">Where it comes from</div>
        <p className="body">
          {def.auto
            ? `Arrives on its own from the ${def.source.toLowerCase()}.${last ? ` Last arrival: ${age(t, last.t)}.` : ''} Enter it by hand only if the device is not in use.`
            : 'Entered by hand.'}
        </p>
      </section>

      <section>
        <div className="label">Steps</div>
        <ol className="steps">
          {def.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </section>

      <section>
        <div className="label">Context</div>
        <div className="choice-row" role="radiogroup" aria-label="Activity">
          {ACTIVITIES.map((a) => (
            <button key={a.key} role="radio" aria-checked={activity === a.key} className={`btn btn-secondary ${activity === a.key ? 'is-selected' : ''}`} onClick={() => setActivity(a.key)}>
              {a.label}
            </button>
          ))}
          <Tag>{stamp(t)}</Tag>
        </div>
        {activity !== 'rest' && (
          <p className="body-sm note">This reading is stored, but resting rules ignore it. Readings are only compared with readings taken in the same context.</p>
        )}
      </section>

      <form
        className="measure-form"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        {k === 'vision' ? (
          <div className="field">
            <span className="label">{def.inputLabel}</span>
            <div className="choice-row" role="radiogroup" aria-label={def.inputLabel}>
              {VISION_LABELS.map((l, i) => (
                <button type="button" key={l} role="radio" aria-checked={v === String(i)} className={`btn btn-secondary ${v === String(i) ? 'is-selected' : ''}`} onClick={() => setV(String(i))}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="field-row">
            <label className="field">
              <span className="label">{def.inputLabel}</span>
              <span className="input-wrap">
                <input className="input" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} autoComplete="off" />
                {!def.input2Label && <span className="data">{def.unit}</span>}
              </span>
            </label>
            {def.input2Label && (
              <label className="field">
                <span className="label">{def.input2Label}</span>
                <span className="input-wrap">
                  <input className="input" inputMode="decimal" value={v2} onChange={(e) => setV2(e.target.value)} autoComplete="off" />
                  <span className="data">{def.unit}</span>
                </span>
              </label>
            )}
          </div>
        )}
        {error && <p className="body-sm form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary">Save reading</button>
      </form>
    </div>
  )
}
