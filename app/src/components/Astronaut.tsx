import type { ReactNode } from 'react'
import { SCENE_LABEL, type Scene } from '../lib/procedures'
import '../astronaut.css'

/** One astronaut. The class decides who it is in the scene: the one acting, or the one being helped. */
function Figure({ who, children, right, left }: { who: 'figure' | 'patient'; children?: ReactNode; right?: ReactNode; left?: ReactNode }) {
  return (
    <g className={`astro-${who}`}>
      <rect className="astro-pack" x="66" y="70" width="16" height="42" rx="6" />
      <g className="astro-leg astro-leg-l"><path d="M91 110 L88 134 L84 150" /></g>
      <g className="astro-leg astro-leg-r"><path d="M109 110 L112 134 L116 150" /></g>
      <g className="astro-arm astro-arm-l"><path d="M82 78 L68 94 L62 110" />{left}</g>
      <rect className="astro-torso" x="78" y="66" width="44" height="50" rx="15" />
      <rect className="astro-panel" x="90" y="80" width="20" height="11" rx="3" />
      <g className="astro-arm astro-arm-r"><path d="M118 78 L132 94 L138 110" />{right}</g>
      <circle className="astro-helmet" cx="100" cy="44" r="25" />
      <rect className="astro-visor" x="84" y="32" width="32" height="24" rx="12" />
      <path className="astro-glint" d="M91 39 q4 -4 9 -4" />
      {children}
    </g>
  )
}

/** Scenes with a second astronaut lying down, being helped. */
const LYING: Scene[] = ['respond', 'breathing', 'restrain', 'compress', 'aed', 'press', 'bandage']
/** Scenes where the one lying down is alone. */
const ALONE: Scene[] = ['restrain', 'aed']
/** Scenes with a second astronaut upright, being helped. */
const UPRIGHT: Scene[] = ['backblows', 'thrusts']

/**
 * A small astronaut acting out one step of a procedure. One drawing, posed and animated by the
 * scene. With reduced motion it holds the pose and does not move.
 */
export function Astronaut({ scene, size = 160, still = false }: { scene: Scene; size?: number; still?: boolean }) {
  const lying = LYING.includes(scene)
  return (
    <svg className={`astro scene-${scene} ${still ? 'is-still' : ''}`} viewBox="0 -12 200 184" width={size} height={size * 0.92} role="img" aria-label={SCENE_LABEL[scene]}>
      {scene === 'shelter' && (
        <g className="astro-shelter">
          <path className="astro-dome" d="M22 156 A78 78 0 0 1 178 156" />
          <circle className="astro-ray astro-ray-1" cx="20" cy="6" r="3" />
          <circle className="astro-ray astro-ray-2" cx="100" cy="-6" r="3" />
          <circle className="astro-ray astro-ray-3" cx="182" cy="10" r="3" />
        </g>
      )}
      {scene === 'air' && (
        <g className="astro-air">
          <path d="M6 30 q12 -8 24 0 t24 0 t24 0" />
          <path d="M120 16 q12 -8 24 0 t24 0 t24 0" />
          <path d="M126 140 q12 -8 24 0 t24 0 t24 0" />
        </g>
      )}
      {scene === 'legsup' && <rect className="astro-box" x="128" y="128" width="46" height="40" rx="6" />}

      {(lying || UPRIGHT.includes(scene)) && <Figure who="patient" />}
      {scene === 'restrain' && <g className="astro-straps"><path d="M78 116 v52" /><path d="M118 116 v52" /><path d="M150 120 v44" /></g>}
      {scene === 'aed' && (
        <g className="astro-aed">
          <rect className="astro-pad" x="80" y="124" width="16" height="13" rx="3" />
          <rect className="astro-pad" x="104" y="146" width="16" height="13" rx="3" />
          <path className="astro-lead" d="M88 124 C88 96 120 96 126 80 M112 146 C140 140 146 100 136 80" />
          <rect className="astro-aed-box" x="108" y="34" width="50" height="46" rx="9" />
          <path className="astro-bolt" d="M136 42 l-10 17 h8 l-4 14 l12 -19 h-8 z" />
        </g>
      )}
      {(scene === 'press' || scene === 'bandage') && <circle className="astro-wound" cx="136" cy="132" r="7" />}
      {scene === 'bandage' && <g className="astro-bandage"><path d="M126 120 v46" /><path d="M134 120 v46" /><path d="M142 120 v46" /></g>}

      {!ALONE.includes(scene) && (
        <Figure
          who="figure"
          left={scene === 'measure' ? <path className="astro-cuff" d="M79 81.5 L71 90.5" /> : undefined}
          right={scene === 'drink' ? <rect className="astro-pouch" x="131" y="104" width="14" height="17" rx="4" /> : undefined}
        />
      )}

      {scene === 'measure' && <polyline className="astro-pulse" points="6,34 26,34 33,20 42,48 49,34 68,34" />}
      {(scene === 'report' || scene === 'respond') && (
        <g className="astro-radio">
          <path d="M136 14 A10 10 0 0 1 146 24" />
          <path d="M136 5 A19 19 0 0 1 155 24" />
          <path d="M136 -4 A28 28 0 0 1 164 24" />
        </g>
      )}
      {scene === 'cough' && <g className="astro-cough"><path d="M128 38 h14" /><path d="M130 48 h20" /><path d="M128 58 h12" /></g>}
      {scene === 'backblows' && <g className="astro-hit"><path d="M96 58 l-8 -8 M100 70 h-12 M96 82 l-8 8" /></g>}
      {scene === 'sleep' && (
        <g className="astro-zzz">
          <text x="140" y="60">z</text>
          <text x="154" y="42">z</text>
          <text x="170" y="22">z</text>
        </g>
      )}
      {(scene === 'rest' || scene === 'breathing') && <circle className="astro-timer" cx="166" cy="30" r="14" pathLength={100} />}
      {scene === 'look' && (
        <g className="astro-chart">
          <rect x="150" y="26" width="38" height="52" rx="5" />
          <path d="M159 38 h20 M161 48 h16 M163 57 h12 M165 65 h8" />
          <path className="astro-scan" d="M154 38 h30" />
        </g>
      )}
    </svg>
  )
}
