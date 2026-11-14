import type { ReactNode } from 'react'
import type { SceneKey } from '../../lib/guides'

/**
 * One animated pictogram per step. Plain shapes, moved with CSS (guides.css), so they run with no
 * network and stop under reduced motion. `beat` restarts the push animation on every count.
 */

function Lying({ children }: { children?: ReactNode }) {
  return <g>
    <rect className="g-ground" x="24" y="148" width="272" height="5" rx="2.5" />
    <rect className="g-body" x="172" y="120" width="104" height="24" rx="12" />
    <rect className="g-body" x="84" y="112" width="100" height="34" rx="16" />
    <circle className="g-body" cx="62" cy="129" r="16" />
    {children}
  </g>
}

function Standing({ x, faded }: { x: number; faded?: boolean }) {
  return <g className={faded ? 'g-faded' : ''}>
    <rect className="g-body" x={x - 11} y="124" width="22" height="60" rx="11" />
    <rect className="g-body" x={x - 15} y="68" width="30" height="66" rx="15" />
    <circle className="g-body" cx={x} cy="48" r="15" />
  </g>
}

function Waves({ x, y }: { x: number; y: number }) {
  return <g className="g-accent-line">
    <path className="g-wave w1" d={`M${x} ${y - 10} a14 14 0 0 1 0 20`} />
    <path className="g-wave w2" d={`M${x + 10} ${y - 18} a25 25 0 0 1 0 36`} />
    <path className="g-wave w3" d={`M${x + 20} ${y - 26} a36 36 0 0 1 0 52`} />
  </g>
}

function Ring({ x, y, label }: { x: number; y: number; label: string }) {
  return <g>
    <circle className="g-ring-track" cx={x} cy={y} r="22" />
    <circle className="g-ring" cx={x} cy={y} r="22" transform={`rotate(-90 ${x} ${y})`} />
    <text className="g-text" x={x} y={y + 5} textAnchor="middle">{label}</text>
  </g>
}

const Ground = () => <rect className="g-ground" x="24" y="186" width="272" height="5" rx="2.5" />

const SCENES: Record<SceneKey, (beat?: number) => ReactNode> = {
  respond: () => <Lying>
    <rect className="g-accent g-tap" x="92" y="78" width="18" height="34" rx="9" />
    <rect className="g-accent g-tap t2" x="150" y="78" width="18" height="34" rx="9" />
    <g transform="rotate(180 34 110)"><Waves x={20} y={104} /></g>
  </Lying>,
  call: () => <>
    <Ground />
    <Standing x={96} />
    <Waves x={124} y={48} />
    <rect className="g-body" x="214" y="140" width="62" height="44" rx="8" />
    <path className="g-alert" d="M240 150h10v9h9v10h-9v9h-10v-9h-9v-10h9z" />
  </>,
  breathing: () => <Lying>
    <ellipse className="g-accent g-rise" cx="134" cy="112" rx="42" ry="9" />
    <Ring x={262} y={58} label="10 s" />
  </Lying>,
  restrain: () => <Lying>
    <rect className="g-board" x="40" y="146" width="250" height="9" rx="3" />
    <rect className="g-accent g-strap" x="104" y="106" width="12" height="46" rx="3" />
    <rect className="g-accent g-strap s2" x="150" y="106" width="12" height="46" rx="3" />
    <rect className="g-accent g-strap s3" x="218" y="114" width="12" height="38" rx="3" />
  </Lying>,
  compress: (beat) => <Lying>
    <g className="g-push" key={beat}>
      <circle className="g-helper" cx="150" cy="26" r="14" />
      <path className="g-helper" d="M136 40h28l-8 60h-24z" />
      <rect className="g-accent" x="118" y="96" width="40" height="14" rx="7" />
    </g>
    <circle className="g-alert g-beat" key={`b${beat}`} cx="270" cy="50" r="10" />
  </Lying>,
  aed: () => <>
    <circle className="g-body" cx="130" cy="38" r="19" />
    <rect className="g-body" x="78" y="62" width="104" height="126" rx="28" />
    <rect className="g-accent g-pad" x="90" y="78" width="34" height="24" rx="5" />
    <rect className="g-accent g-pad p2" x="140" y="132" width="34" height="24" rx="5" />
    <path className="g-wire" d="M124 90C190 70 236 90 250 120M174 144c30 10 50 4 62-8" />
    <rect className="g-body" x="232" y="118" width="62" height="52" rx="8" />
    <path className="g-alert g-flash" d="M266 126l-12 20h9l-4 16 14-22h-9z" />
  </>,
  rest: () => <>
    <rect className="g-ground" x="24" y="168" width="272" height="5" rx="2.5" />
    <rect className="g-body" x="150" y="140" width="110" height="24" rx="12" />
    <path className="g-board" d="M52 168h100L58 100z" />
    <g transform="rotate(32 160 152)">
      <rect className="g-body" x="62" y="134" width="104" height="34" rx="16" />
      <circle className="g-body" cx="42" cy="151" r="16" />
      <ellipse className="g-accent g-rise" cx="112" cy="134" rx="36" ry="7" />
    </g>
  </>,
  clock: () => <>
    <circle className="g-ring-track" cx="160" cy="100" r="68" />
    <path className="g-tick" d="M160 40v12M160 148v12M100 100h12M208 100h12" />
    <path className="g-hand slow" d="M160 100V70" />
    <path className="g-hand" d="M160 100V50" />
    <circle className="g-accent" cx="160" cy="100" r="5" />
  </>,
  monitor: () => <>
    <rect className="g-body" x="40" y="34" width="240" height="132" rx="14" />
    <path className="g-ecg" pathLength="100" d="M56 104h44l8-10 8 10h12l8-46 10 80 8-34h18l10-12 10 12h70" />
    <circle className="g-alert g-beat loop" cx="250" cy="60" r="8" />
  </>,
  cough: () => <>
    <Ground />
    <g transform="rotate(8 130 184)"><Standing x={130} /></g>
    <Waves x={166} y={50} />
  </>,
  backblows: () => <>
    <Ground />
    <Standing x={92} faded />
    <rect className="g-body" x="169" y="124" width="22" height="60" rx="11" />
    <g transform="rotate(38 180 132)">
      <rect className="g-body" x="165" y="68" width="30" height="66" rx="15" />
      <circle className="g-body" cx="180" cy="48" r="15" />
    </g>
    <rect className="g-accent g-blow" x="140" y="86" width="34" height="14" rx="7" />
    <g className="g-count">{[0, 1, 2, 3, 4].map((i) => <circle key={i} className={`c${i}`} cx={116 + i * 22} cy="20" r="6" />)}</g>
  </>,
  thrusts: () => <>
    <Ground />
    <Standing x={134} faded />
    <Standing x={170} />
    <path className="g-helper-line" d="M140 96h42" />
    <circle className="g-accent g-thrust" cx="186" cy="110" r="11" />
    <g className="g-count">{[0, 1, 2, 3, 4].map((i) => <circle key={i} className={`c${i}`} cx={116 + i * 22} cy="20" r="6" />)}</g>
  </>,
  press: () => <>
    <rect className="g-body" x="36" y="112" width="248" height="46" rx="23" />
    <circle className="g-alert" cx="160" cy="116" r="9" />
    <g className="g-press">
      <rect className="g-gauze" x="132" y="100" width="56" height="18" rx="4" />
      <rect className="g-accent" x="120" y="62" width="80" height="34" rx="17" />
    </g>
    <Ring x={262} y={52} label="10 min" />
  </>,
  bandage: () => <>
    <rect className="g-body" x="36" y="90" width="248" height="46" rx="23" />
    <rect className="g-gauze" x="132" y="84" width="56" height="18" rx="4" />
    <g className="g-wrap">{[0, 1, 2, 3].map((i) => <rect key={i} className={`g-gauze c${i}`} x={118 + i * 22} y="82" width="16" height="62" rx="4" transform={`rotate(14 ${126 + i * 22} 113)`} />)}</g>
  </>,
  legsup: () => <>
    <rect className="g-ground" x="24" y="148" width="272" height="5" rx="2.5" />
    <rect className="g-board" x="228" y="116" width="56" height="32" rx="6" />
    <g className="g-legs"><rect className="g-body" x="172" y="120" width="104" height="24" rx="12" /></g>
    <rect className="g-body" x="84" y="112" width="100" height="34" rx="16" />
    <circle className="g-body" cx="62" cy="129" r="16" />
  </>,
  drink: () => <>
    <path className="g-body" d="M118 50h84l-10 116a8 8 0 0 1-8 7h-48a8 8 0 0 1-8-7z" />
    <g className="g-sip"><path className="g-accent" d="M127 76h66l-8 88h-50z" /></g>
    <path className="g-tick" d="M176 30v40" />
  </>,
  stages: () => <>
    <Ground />
    <g className="g-stage c0"><rect className="g-body" x="30" y="166" width="78" height="18" rx="9" /><circle className="g-body" cx="24" cy="174" r="10" /></g>
    <g className="g-stage c1"><rect className="g-body" x="150" y="166" width="48" height="18" rx="9" /><rect className="g-body" x="140" y="124" width="22" height="60" rx="11" /><circle className="g-body" cx="151" cy="108" r="12" /></g>
    <g className="g-stage c2"><Standing x={252} /></g>
    <path className="g-tick" d="M112 150h18m-6-6 6 6-6 6M206 150h18m-6-6 6 6-6 6" />
  </>,
}

export function Scene({ scene, beat, label }: { scene: SceneKey; beat?: number; label?: string }) {
  return <svg className="guide-scene" viewBox="0 0 320 200" role="img" aria-label={label ?? ''} aria-hidden={label ? undefined : true}>{SCENES[scene](beat)}</svg>
}
