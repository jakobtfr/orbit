import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '../components/Status'
import { NextActionCard } from '../components/Tiles'
import { REGIONS, REGION_ORDER } from '../lib/indicators'
import { SYMPTOM_REGION, lastCheckIn, now, symptomNext } from '../lib/judge'
import { useStore } from '../lib/store'
import type { CheckIn as CheckInData, RegionKey, Symptom } from '../lib/types'
import { Missing, usePerson } from './common'

const FEEL: CheckInData['feel'][] = ['Fine', 'Not quite right', 'Unwell']
const SYMPTOMS = ['Headache', 'Skin rash', 'Cold or cough', 'Pain', 'Trouble sleeping', 'Dizziness', 'Stomach or digestion', 'Nausea or motion sickness', 'Vision change', 'Injury', 'Joint pain after suit work', 'Other']
const QUESTIONS = ['How do you feel today?', 'Any symptoms?', 'How are you and the crew?', 'Summary']

export function CheckIn() {
  const person = usePerson()
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [feel, setFeel] = useState<CheckInData['feel'] | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const [none, setNone] = useState(false)
  const [painRegion, setPainRegion] = useState<RegionKey | null>(null)
  const [pain, setPain] = useState<number | null>(null)
  const [mood, setMood] = useState<number | null>(null)
  const [team, setTeam] = useState<number | null>(null)
  if (!person) return <Missing />
  const home = `/body/${person.id}`

  const hasPain = chosen.includes('Pain')
  const previousTeam = lastCheckIn(state, person.id)?.team
  const tense = team !== null && team <= 2 && previousTeam !== undefined && previousTeam <= 2
  const symptoms: Symptom[] = chosen.map((name) =>
    name === 'Pain' ? { name, region: painRegion ?? 'whole', pain: pain ?? undefined } : { name, region: SYMPTOM_REGION[name] ?? 'whole' },
  )
  const ready = [
    feel !== null,
    none || (chosen.length > 0 && (!hasPain || (painRegion !== null && pain !== null))),
    mood !== null && team !== null,
    true,
  ][step]

  const toggle = (s: string) => {
    setNone(false)
    setChosen((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]))
  }
  const finish = () => {
    dispatch({ type: 'checkin', personId: person.id, checkin: { t: now(state), feel: feel!, symptoms, mood: mood!, team: team! } })
    nav(home)
  }

  return (
    <div className="screen flow-screen">
      <div className="step-head">
        <Tag>{step + 1} of 4</Tag>
        <h1 className="title-2">{QUESTIONS[step]}</h1>
      </div>

      {step === 0 && (
        <div className="choice-col" role="radiogroup" aria-label={QUESTIONS[0]}>
          {FEEL.map((f) => (
            <button key={f} role="radio" aria-checked={feel === f} className={`btn btn-secondary btn-large ${feel === f ? 'is-selected' : ''}`} onClick={() => setFeel(f)}>
              {f}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <>
          <p className="body">Choose any that apply.</p>
          <div className="chips">
            {SYMPTOMS.map((s) => (
              <button key={s} className={`chip ${chosen.includes(s) ? 'is-selected' : ''}`} aria-pressed={chosen.includes(s)} onClick={() => toggle(s)}>
                {chosen.includes(s) && <span aria-hidden="true">✓ </span>}
                {s}
              </button>
            ))}
            <button
              className={`chip ${none ? 'is-selected' : ''}`}
              aria-pressed={none}
              onClick={() => {
                setNone(!none)
                setChosen([])
              }}
            >
              {none && <span aria-hidden="true">✓ </span>}
              None
            </button>
          </div>
          {hasPain && (
            <div className="pain">
              <div className="label">Where is the pain?</div>
              <div className="choice-row" role="radiogroup" aria-label="Where is the pain?">
                {REGION_ORDER.map((r) => (
                  <button key={r} role="radio" aria-checked={painRegion === r} className={`btn btn-secondary ${painRegion === r ? 'is-selected' : ''}`} onClick={() => setPainRegion(r)}>
                    {REGIONS[r].name}
                  </button>
                ))}
              </div>
              <div className="label">How strong, from 0 (none) to 10 (worst)?</div>
              <div className="scale" role="radiogroup" aria-label="Pain from 0 to 10">
                {Array.from({ length: 11 }, (_, n) => (
                  <button key={n} role="radio" aria-checked={pain === n} className={`btn btn-secondary ${pain === n ? 'is-selected' : ''}`} onClick={() => setPain(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <div className="label">How is your mood?</div>
          <div className="scale scale-wide" role="radiogroup" aria-label="Mood from 1 to 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={mood === n} className={`btn btn-secondary btn-large ${mood === n ? 'is-selected' : ''}`} onClick={() => setMood(n)}>
                {n}
              </button>
            ))}
          </div>
          <div className="scale-ends label"><span>1 · Very low</span><span>5 · Very good</span></div>
          <div className="label">How is it going with the crew?</div>
          <div className="scale scale-wide" role="radiogroup" aria-label="Working with the crew from 1 to 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={team === n} className={`btn btn-secondary btn-large ${team === n ? 'is-selected' : ''}`} onClick={() => setTeam(n)}>
                {n}
              </button>
            ))}
          </div>
          <div className="scale-ends label"><span>1 · Tense</span><span>5 · Working well</span></div>
          <p className="body">Only you can see these answers.</p>
        </>
      )}

      {step === 3 && (
        <>
          <ul className="summary">
            <li><span>Feeling: {feel}</span></li>
            {symptoms.length === 0 && <li><span>No symptoms</span></li>}
            {symptoms.map((s) => (
              <li key={s.name}>
                <span>
                  {s.name}
                  {s.name === 'Pain' && `: ${REGIONS[s.region].name.toLowerCase()}, ${s.pain} of 10`}
                </span>
                
              </li>
            ))}
            <li><span>Mood: {mood} of 5 · crew: {team} of 5 · only you can see this</span></li>
          </ul>
          {tense && (
            <NextActionCard
              title="Tension in the crew"
              action={{
                observed: 'Working with the crew has felt tense on two check-ins in a row. Only you can see this.',
                next: 'Raise it early and in person. If it does not ease, ask the commander for a crew talk or the medical lead for a private one.',
              }}
            />
          )}
          {symptoms.length > 0 && (
            <NextActionCard
              title={symptoms.map((x) => x.name).join(', ')}
              action={{
                observed: `Logged: ${symptoms.map((s) => s.name.toLowerCase()).join(', ')}. ${symptoms.length === 1 ? 'It' : 'They'} will be marked on your body.`,
                next: symptomNext(symptoms.map((s) => s.name)),
              }}
            />
          )}
        </>
      )}

      <div className="flow-foot">
        <button className="btn btn-secondary" onClick={() => (step === 0 ? nav(home) : setStep(step - 1))}>
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        <button className="btn btn-primary" disabled={!ready} onClick={() => (step === 3 ? finish() : setStep(step + 1))}>
          {step === 3 ? 'Finish check-in' : 'Next'}
        </button>
      </div>
    </div>
  )
}
