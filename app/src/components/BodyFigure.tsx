import { Line, Outlines } from '@react-three/drei'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { BufferGeometry } from 'three'
import { REGIONS } from '../lib/indicators'
import type { RegionSummary } from '../lib/judge'
import type { RegionKey, StatusKey } from '../lib/types'
import { bodyParts } from './bodyShape'
import { StatusMark } from './Status'

export interface BodyProps {
  summaries: RegionSummary[]
  active: RegionKey | null
  onActive: (r: RegionKey | null) => void
  onSelect: (r: RegionKey) => void
}

/** A region gets a marker only when it needs attention (D1). */
const MARKED: StatusKey[] = ['warning', 'caution', 'repeat', 'stale']

const FIGURE = '#4A4E58'
const FIGURE_ACTIVE = '#6B717C'
const ACCENT = '#A3A6FF'
const LINE = '#6B717C'

export function webglAvailable(): boolean {
  if (new URLSearchParams(window.location.search).has('flat')) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function MarkerButton({ region, status, onSelect }: { region: RegionKey; status: StatusKey; onSelect: (r: RegionKey) => void }) {
  return (
    <button className="marker" onClick={() => onSelect(region)}>
      <span className="label">{REGIONS[region].name}</span>
      <StatusMark status={status} />
    </button>
  )
}

/* ---------- 3D ---------- */

/** Where each marker sits, and the point on the body its line starts from. */
const ANCHOR: Record<RegionKey, { from: [number, number, number]; to: [number, number, number]; turns: boolean }> = {
  head: { from: [0, 1.68, 0], to: [0.6, 1.72, 0], turns: false },
  chest: { from: [0, 1.3, 0], to: [-0.66, 1.4, 0], turns: false },
  hips: { from: [0, 0.95, 0], to: [0.66, 0.98, 0], turns: false },
  skin: { from: [-0.32, 1.03, 0], to: [-0.7, 0.72, 0], turns: true },
  whole: { from: [0.4, 0.0, 0], to: [0.72, 0.2, 0], turns: false },
}

function Part({ region, active, onActive, onSelect, children, position, rotation, geometry }: {
  region: RegionKey
  active: boolean
  onActive: (r: RegionKey | null) => void
  onSelect: (r: RegionKey) => void
  children?: ReactNode
  position?: [number, number, number]
  rotation?: [number, number, number]
  geometry?: BufferGeometry
}) {
  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onActive(region)
      }}
      onPointerOut={() => onActive(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        // A drag that turns the body is not a tap.
        if (e.delta <= 6) onSelect(region)
      }}
    >
      {children}
      <meshStandardMaterial color={active ? FIGURE_ACTIVE : FIGURE} roughness={0.82} metalness={0} />
      {active && <Outlines thickness={2.5} color={ACCENT} />}
    </mesh>
  )
}

function Figure({ active, onActive, onSelect }: Pick<BodyProps, 'active' | 'onActive' | 'onSelect'>) {
  const parts = useMemo(bodyParts, [])
  return (
    <>
      {parts.map((p) => (
        <Part key={p.id} region={p.region} active={active === p.region} onActive={onActive} onSelect={onSelect} geometry={p.geometry} />
      ))}
      <Part region="whole" active={active === 'whole'} onActive={onActive} onSelect={onSelect} position={[0, -0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.44, 72]} />
      </Part>
    </>
  )
}

const CAMERA_Z = 4.2
const FOV = 30
const LIFT = -0.9

/** Screen position, in percent of the canvas, of a point at depth 0 in the scene. */
function project(point: [number, number, number], aspect: number): { left: string; top: string } {
  const half = CAMERA_Z * Math.tan((FOV / 2) * (Math.PI / 180))
  const nx = point[0] / (half * aspect)
  const ny = (point[1] + LIFT) / half
  return { left: `${((nx + 1) / 2) * 100}%`, top: `${((1 - ny) / 2) * 100}%` }
}

function Body3D({ summaries, active, onActive, onSelect }: BodyProps) {
  const [angle, setAngle] = useState(0)
  const drag = useRef<{ x: number; angle: number } | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = useState(1.2)
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => setAspect(el.clientWidth / Math.max(1, el.clientHeight))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const marked = summaries.filter((s) => MARKED.includes(s.status))

  const lines = useMemo(
    () =>
      marked.map((s) => {
        const a = ANCHOR[s.region]
        const [fx, fy, fz] = a.from
        const from: [number, number, number] = a.turns
          ? [fx * Math.cos(angle) + fz * Math.sin(angle), fy, -fx * Math.sin(angle) + fz * Math.cos(angle)]
          : a.from
        return { region: s.region, status: s.status, from, to: a.to }
      }),
    [marked, angle],
  )

  return (
    <div className="body-stage">
      <div
        className="body-canvas"
        ref={stage}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, angle }
        }}
        onPointerMove={(e) => {
          if (drag.current && e.buttons) setAngle(drag.current.angle + (e.clientX - drag.current.x) * 0.012)
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
      >
        <Canvas frameloop="demand" dpr={[1, 2]} camera={{ position: [0, 0, CAMERA_Z], fov: FOV }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[2.5, 3, 4]} intensity={2.2} />
          <directionalLight position={[-3, 1.5, 2]} intensity={0.7} />
          <directionalLight position={[0, 2, -4]} intensity={1.1} />
          <group position={[0, LIFT, 0]}>
            <group rotation={[0, angle, 0]}>
              <Figure active={active} onActive={onActive} onSelect={onSelect} />
            </group>
            {lines.map((l) => (
              <Line key={l.region} points={[l.from, l.to]} color={LINE} lineWidth={1} />
            ))}
          </group>
        </Canvas>
        {lines.map((l) => (
          <div
            key={l.region}
            className={`flat-marker ${l.to[0] < 0 ? 'flat-marker-left' : 'flat-marker-right'}`}
            style={project(l.to, aspect)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <MarkerButton region={l.region} status={l.status} onSelect={onSelect} />
          </div>
        ))}
      </div>
      <div className="body-turn">
        <button className="btn btn-secondary" onClick={() => setAngle(0)}>Front</button>
        <button className="btn btn-secondary" onClick={() => setAngle(Math.PI)}>Back</button>
        <span className="body-hint">Drag to turn</span>
      </div>
    </div>
  )
}

/* ---------- flat fallback ---------- */

const FLAT_ANCHOR: Record<RegionKey, { from: [number, number]; to: [number, number]; side: 'left' | 'right' }> = {
  head: { from: [150, 42], to: [232, 34], side: 'right' },
  chest: { from: [150, 120], to: [68, 100], side: 'left' },
  hips: { from: [150, 196], to: [232, 200], side: 'right' },
  skin: { from: [98, 170], to: [62, 270], side: 'left' },
  whole: { from: [196, 414], to: [236, 380], side: 'right' },
}

function BodyFlat({ summaries, active, onActive, onSelect }: BodyProps) {
  const marked = summaries.filter((s) => MARKED.includes(s.status))
  const part = (region: RegionKey) => ({
    className: `flat-part ${active === region ? 'is-active' : ''}`,
    onPointerEnter: () => onActive(region),
    onPointerLeave: () => onActive(null),
    onClick: () => onSelect(region),
  })
  return (
    <div className="body-stage">
      <div className="body-flat">
        <svg viewBox="0 0 300 440" aria-hidden="true">
          <g {...part('whole')}>
            <ellipse cx="150" cy="414" rx="70" ry="13" fill="none" strokeWidth="10" stroke="currentColor" />
          </g>
          <g {...part('skin')}>
            <rect x="90" y="88" width="20" height="150" rx="10" />
            <rect x="190" y="88" width="20" height="150" rx="10" />
            <rect x="120" y="228" width="27" height="180" rx="13" />
            <rect x="153" y="228" width="27" height="180" rx="13" />
          </g>
          <g {...part('hips')}>
            <rect x="116" y="168" width="68" height="62" rx="24" />
          </g>
          <g {...part('chest')}>
            <rect x="140" y="62" width="20" height="18" />
            <rect x="112" y="76" width="76" height="96" rx="26" />
          </g>
          <g {...part('head')}>
            <circle cx="150" cy="42" r="26" />
          </g>
          {marked.map((s) => {
            const a = FLAT_ANCHOR[s.region]
            return <line key={s.region} x1={a.from[0]} y1={a.from[1]} x2={a.to[0]} y2={a.to[1]} stroke={LINE} strokeWidth="1" />
          })}
        </svg>
        {marked.map((s) => {
          const a = FLAT_ANCHOR[s.region]
          return (
            <div
              key={s.region}
              className={`flat-marker flat-marker-${a.side}`}
              style={{ left: `${(a.to[0] / 300) * 100}%`, top: `${(a.to[1] / 440) * 100}%` }}
            >
              <MarkerButton region={s.region} status={s.status} onSelect={onSelect} />
            </div>
          )
        })}
      </div>
      <div className="body-turn">
        <span className="body-hint">Flat view: this device cannot show the 3D body</span>
      </div>
    </div>
  )
}

export function BodyFigure(props: BodyProps) {
  const [is3d] = useState(webglAvailable)
  return is3d ? <Body3D {...props} /> : <BodyFlat {...props} />
}
