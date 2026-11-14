import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { RegionKey } from '../lib/types'

/**
 * The body figure, built from cross-sections instead of loaded from a model file.
 * Each part is a stack of ellipses from bottom to top, smoothed and skinned into one surface.
 * Units are metres; the figure stands 1.8 m tall with its feet at y = 0.
 */

/** One ellipse: height, half-width, half-depth, and where its centre sits. */
type Section = [y: number, rx: number, rz: number, cx?: number, cz?: number]

const RADIAL = 28
const STEPS = 5

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t3)
}

/** Adds rings between the given sections so the surface curves instead of creasing. */
function smooth(sections: Section[]): number[][] {
  const full = sections.map((s) => [s[0], s[1], s[2], s[3] ?? 0, s[4] ?? 0])
  const out: number[][] = []
  for (let i = 0; i < full.length - 1; i++) {
    const p0 = full[Math.max(0, i - 1)]
    const p1 = full[i]
    const p2 = full[i + 1]
    const p3 = full[Math.min(full.length - 1, i + 2)]
    for (let s = 0; s < STEPS; s++) {
      const t = s / STEPS
      out.push(p1.map((_, k) => (k === 0 ? p1[0] + (p2[0] - p1[0]) * t : Math.max(k < 3 ? 0.001 : -9, catmull(p0[k], p1[k], p2[k], p3[k], t)))))
    }
  }
  out.push(full[full.length - 1])
  return out
}

function loft(sections: Section[]): BufferGeometry {
  const rings = smooth(sections)
  const pos: number[] = []
  const idx: number[] = []
  for (const [y, rx, rz, cx, cz] of rings) {
    for (let j = 0; j < RADIAL; j++) {
      const a = (j / RADIAL) * Math.PI * 2
      pos.push(cx + rx * Math.cos(a), y, cz + rz * Math.sin(a))
    }
  }
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const a = i * RADIAL + j
      const b = (i + 1) * RADIAL + j
      const c = i * RADIAL + ((j + 1) % RADIAL)
      const d = (i + 1) * RADIAL + ((j + 1) % RADIAL)
      idx.push(a, b, c, b, d, c)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const HEAD: Section[] = [
  [1.535, 0.05, 0.054, 0, -0.004],
  [1.565, 0.051, 0.057, 0, 0],
  [1.59, 0.06, 0.074, 0, 0.012],
  [1.625, 0.071, 0.09, 0, 0.008],
  [1.675, 0.077, 0.098, 0, 0],
  [1.725, 0.075, 0.095, 0, -0.004],
  [1.765, 0.062, 0.08, 0, -0.006],
  [1.79, 0.036, 0.047, 0, -0.006],
  [1.8, 0.004, 0.005, 0, -0.006],
]

const CHEST: Section[] = [
  [1.07, 0.146, 0.098, 0, 0.004],
  [1.13, 0.139, 0.094, 0, 0.006],
  [1.22, 0.152, 0.104, 0, 0.01],
  [1.32, 0.172, 0.118, 0, 0.014],
  [1.4, 0.183, 0.112, 0, 0.006],
  [1.445, 0.172, 0.094, 0, 0],
  [1.475, 0.118, 0.07, 0, -0.004],
  [1.5, 0.062, 0.058, 0, -0.006],
  [1.535, 0.05, 0.054, 0, -0.004],
]

const HIPS: Section[] = [
  [0.79, 0.03, 0.03, 0, 0],
  [0.83, 0.115, 0.085, 0, 0],
  [0.88, 0.162, 0.11, 0, -0.004],
  [0.94, 0.172, 0.118, 0, -0.006],
  [1.0, 0.163, 0.111, 0, -0.002],
  [1.07, 0.146, 0.098, 0, 0.004],
]

function leg(s: number): Section[] {
  return [
    [0.025, 0.02, 0.024, s * 0.097, -0.004],
    [0.05, 0.036, 0.042, s * 0.097, -0.004],
    [0.1, 0.035, 0.039, s * 0.097, -0.006],
    [0.22, 0.047, 0.054, s * 0.097, -0.014],
    [0.34, 0.058, 0.064, s * 0.097, -0.02],
    [0.44, 0.051, 0.056, s * 0.096, -0.012],
    [0.51, 0.053, 0.058, s * 0.095, 0],
    [0.62, 0.065, 0.071, s * 0.094, 0.004],
    [0.76, 0.081, 0.087, s * 0.093, 0.002],
    [0.86, 0.086, 0.09, s * 0.09, -0.002],
    [0.92, 0.07, 0.078, s * 0.086, -0.004],
    [0.96, 0.03, 0.035, s * 0.08, -0.004],
  ]
}

function arm(s: number): Section[] {
  return [
    [0.855, 0.012, 0.016, s * 0.35, 0.012],
    [0.87, 0.025, 0.03, s * 0.348, 0.012],
    [0.91, 0.028, 0.031, s * 0.341, 0.01],
    [1.0, 0.038, 0.041, s * 0.326, 0.004],
    [1.08, 0.04, 0.043, s * 0.312, 0],
    [1.135, 0.036, 0.04, s * 0.303, -0.004],
    [1.22, 0.044, 0.048, s * 0.287, -0.004],
    [1.33, 0.05, 0.055, s * 0.264, -0.002],
    [1.4, 0.056, 0.06, s * 0.243, 0],
    [1.44, 0.052, 0.056, s * 0.226, 0],
    [1.468, 0.022, 0.03, s * 0.21, 0],
  ]
}

function hand(s: number): Section[] {
  return [
    [0.75, 0.006, 0.012, s * 0.366, 0.02],
    [0.77, 0.016, 0.034, s * 0.364, 0.02],
    [0.81, 0.019, 0.042, s * 0.359, 0.018],
    [0.845, 0.02, 0.036, s * 0.354, 0.014],
    [0.87, 0.022, 0.028, s * 0.349, 0.012],
  ]
}

function foot(s: number): Section[] {
  return [
    [0.0, 0.03, 0.09, s * 0.099, 0.05],
    [0.012, 0.044, 0.118, s * 0.099, 0.05],
    [0.035, 0.043, 0.11, s * 0.098, 0.042],
    [0.058, 0.036, 0.07, s * 0.097, 0.012],
    [0.075, 0.03, 0.04, s * 0.097, -0.004],
  ]
}

export interface BodyPart {
  id: string
  region: RegionKey
  geometry: BufferGeometry
}

let cache: BodyPart[] | null = null

export function bodyParts(): BodyPart[] {
  if (cache) return cache
  const part = (id: string, region: RegionKey, s: Section[]): BodyPart => ({ id, region, geometry: loft(s) })
  cache = [
    part('head', 'head', HEAD),
    part('chest', 'chest', CHEST),
    part('hips', 'hips', HIPS),
    ...[-1, 1].flatMap((s) => [
      part(`leg${s}`, 'skin', leg(s)),
      part(`foot${s}`, 'skin', foot(s)),
      part(`arm${s}`, 'skin', arm(s)),
      part(`hand${s}`, 'skin', hand(s)),
    ]),
  ]
  return cache
}
