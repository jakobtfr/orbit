import { ORBIT_RADII, OUTBOUND_PATH, PHASES, RETURN_PATH, TRANSFER_DAYS, DEPARTURE_DAY, positionAt, type Point } from '../lib/mission'

const SIZE = 500
const C = SIZE / 2
const SCALE = 132

const sx = (p: Point) => C + p.x * SCALE
const sy = (p: Point) => C - p.y * SCALE
const line = (pts: Point[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p).toFixed(1)} ${sy(p).toFixed(1)}`).join(' ')

/** How far along a sampled path the spacecraft is, as a list of points already flown. */
function flown(path: Point[], fraction: number, craft: Point): Point[] {
  if (fraction <= 0) return []
  if (fraction >= 1) return path
  return [...path.slice(0, Math.floor(fraction * (path.length - 1)) + 1), craft]
}

/**
 * Top-down view of the inner solar system: where Earth, Mars, and the spacecraft are today.
 * Greyscale only. The path already flown is bright; the path still planned is dashed.
 */
export function Trajectory({ day }: { day: number }) {
  const pos = positionAt(day)
  const out = flown(OUTBOUND_PATH, day / TRANSFER_DAYS, pos.craft)
  const back = flown(RETURN_PATH, (day - DEPARTURE_DAY) / TRANSFER_DAYS, pos.craft)
  const onPlanet = PHASES.find((p) => day < p.end)?.key
  /** Puts a label next to a body, pushed away from or toward the Sun so labels do not collide. */
  const label = (p: Point, text: string, push: number, strong = false) => {
    const r = Math.hypot(p.x, p.y) || 1
    const x = sx(p) + (p.x / r) * push
    const y = sy(p) - (p.y / r) * push + 4
    return (
      <text className={`chart-label ${strong ? 'chart-label-strong' : ''}`} x={x} y={y} textAnchor={Math.abs(p.x / r) < 0.35 ? 'middle' : (p.x > 0) === push > 0 ? 'start' : 'end'}>
        {text}
      </text>
    )
  }
  const cruising = onPlanet === 'outbound' || onPlanet === 'return'
  return (
    <svg className="trajectory" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Spacecraft position on mission day ${day}`}>
      <circle cx={C} cy={C} r={ORBIT_RADII.earth * SCALE} fill="none" stroke="var(--border)" />
      <circle cx={C} cy={C} r={ORBIT_RADII.mars * SCALE} fill="none" stroke="var(--border)" />
      <path d={line(OUTBOUND_PATH)} fill="none" stroke="var(--border-control)" strokeDasharray="3 5" />
      <path d={line(RETURN_PATH)} fill="none" stroke="var(--border-control)" strokeDasharray="3 5" />
      {out.length > 1 && <path d={line(out)} fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />}
      {back.length > 1 && <path d={line(back)} fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />}

      <circle cx={C} cy={C} r="7" fill="var(--text-muted)" />
      <text className="chart-label" x={C} y={C + 22} textAnchor="middle">Sun</text>

      <line x1={sx(pos.earth)} y1={sy(pos.earth)} x2={sx(pos.craft)} y2={sy(pos.craft)} stroke="var(--border-control)" strokeDasharray="1 4" />

      <circle cx={sx(pos.earth)} cy={sy(pos.earth)} r="5.5" fill="var(--text-secondary)" />
      {label(pos.earth, onPlanet === 'home' ? 'Earth · crew' : 'Earth', -18, onPlanet === 'home')}
      <circle cx={sx(pos.mars)} cy={sy(pos.mars)} r="4.5" fill="var(--text-secondary)" />
      {label(pos.mars, onPlanet === 'surface' ? 'Mars · crew' : 'Mars', 18, onPlanet === 'surface')}

      <circle cx={sx(pos.craft)} cy={sy(pos.craft)} r="9" fill="var(--bg-canvas)" stroke="var(--text-primary)" strokeWidth="1.5" />
      <circle cx={sx(pos.craft)} cy={sy(pos.craft)} r="3.5" fill="var(--text-primary)" />
      {cruising && (
        <text
          className="chart-label chart-label-strong"
          x={sx(pos.craft) + (sx(pos.craft) < 110 ? 16 : -16)}
          y={sy(pos.craft) + (sx(pos.craft) < 110 ? 22 : 4)}
          textAnchor={sx(pos.craft) < 110 ? 'start' : 'end'}
        >
          Spacecraft
        </text>
      )}
    </svg>
  )
}
