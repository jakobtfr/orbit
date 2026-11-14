import { StatusMark, Tag } from '../components/Status'
import { StatusTile } from '../components/Tiles'
import { Trajectory } from '../components/Trajectory'
import { SCENE_DAY } from '../data/demo'
import { INDICATORS, INDICATOR_ORDER } from '../lib/indicators'
import { unavailableReason } from '../lib/judge'
import { LANDING_DAY, PHASES, SIM_END, doseRate, nextMilestone, phaseFor, positionAt } from '../lib/mission'
import { useStore } from '../lib/store'
import { ScreenTitle } from './common'

export function Flight() {
  const { state, viewer, dispatch } = useStore()
  const phase = phaseFor(state.day)
  const pos = positionAt(state.day)
  const next = nextMilestone(state.day)
  const keys = INDICATOR_ORDER.filter((k) => k !== 'mood')
  const off = keys.filter((k) => unavailableReason(k, state.place))
  const on = keys.filter((k) => !unavailableReason(k, state.place))
  const how = (k: (typeof keys)[number]) => {
    const d = INDICATORS[k]
    if (d.provenance === 'MODELLED') return 'Estimated from exercise. Bone cannot be scanned in flight.'
    return d.auto ? `Arrives on its own from the ${d.source.toLowerCase()}.` : 'Entered by hand.'
  }
  const rate = doseRate(state.day)
  const delay = pos.delayMin < 1 ? 'Under 1 min' : `${pos.delayMin.toFixed(0)} min`

  return (
    <div className="screen">
      <ScreenTitle sub="Where the mission is today, how far help is, and which checks apply here.">Flight</ScreenTitle>

      <section className="flight-now">
        <Trajectory day={state.day} />
        <div className="flight-facts">
          <div><span className="label">Mission day</span><span className="reading">{state.day}<span className="unit">&nbsp;{state.day <= LANDING_DAY ? `of ${LANDING_DAY}` : `· landed on day ${LANDING_DAY}`}</span></span></div>
          <div><span className="label">Phase</span><span className="reading reading-text">{phase.label}</span></div>
          <div><span className="label">Place</span><span className="reading reading-text">{phase.placeLabel}</span></div>
          <div><span className="label">Distance from Earth</span><span className="reading">{pos.fromEarth.toFixed(pos.fromEarth < 10 ? 1 : 0)}<span className="unit">&nbsp;million km</span></span></div>
          <div>
            <span className="label">Signal delay, one way</span>
            <span className="reading reading-text">{delay}</span>
            <span className="body-sm">A question and its answer take {pos.delayMin < 1 ? 'under 2' : (pos.delayMin * 2).toFixed(0)} min.</span>
          </div>
          <div>
            <span className="label">Next</span>
            <span className="reading reading-text">{next ? next.label : 'Mission complete'}</span>
            {next && <span className="body-sm">In {next.inDays} {next.inDays === 1 ? 'day' : 'days'}.</span>}
          </div>
        </div>
      </section>

      <section>
        <div className="timeline" role="img" aria-label={`Mission day ${state.day}: ${phase.label}`}>
          {PHASES.map((p) => (
            <div key={p.key} className={`timeline-part ${p.key === phase.key ? 'is-current' : ''}`} style={{ flexGrow: p.end - p.start }}>
              <span className="label">{p.label}</span>
              <span className="data">Day {p.start}</span>
            </div>
          ))}
          <span className="timeline-now" style={{ left: `${(state.day / SIM_END) * 100}%` }} />
        </div>
        <label className="field">
          <span className="label">Move the simulation to another mission day</span>
          <input type="range" min={0} max={SIM_END} value={state.day} onChange={(e) => dispatch({ type: 'day', day: Number(e.target.value) })} />
        </label>
        <div>
          <button className="btn btn-secondary" disabled={state.day === SCENE_DAY} onClick={() => dispatch({ type: 'reset' })}>Return to day {SCENE_DAY}</button>
        </div>
      </section>

      <section>
        <h2 className="title-3">Cabin</h2>
        <div className="tile-grid">
          <StatusTile person={viewer} k="cabin" />
          <div className="tile tile-static">
            <div className="label">Radiation dose rate</div>
            <div className="reading">{rate.toFixed(rate === 0 ? 0 : 2)}<span className="unit">&nbsp;mSv per day</span></div>
            <StatusMark status="ok" />
            <div className="tags"><Tag>SIMULATED</Tag><Tag>HIGH</Tag><Tag>R8</Tag></div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="title-3">Checks here</h2>
        <div className="checks">
          <div>
            <div className="label">Available here</div>
            <ul className="check-list">
              {on.map((k) => (
                <li key={k}><span className="check-name">{INDICATORS[k].name}</span><span className="body-sm">{how(k)}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label">Not available here</div>
            {off.length === 0 ? (
              <p className="empty-line">Every check is available here.</p>
            ) : (
              <ul className="check-list">
                {off.map((k) => (
                  <li key={k}><span className="check-name">{INDICATORS[k].name}</span><span className="body-sm">{unavailableReason(k, state.place)}</span></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
