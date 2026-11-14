import type { Place } from './types'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Mission elapsed time in NASA's display format: MET 100/08:15:00. */
export function met(t: number): string {
  const day = Math.floor(t)
  const secs = Math.round((t - day) * 86400)
  return `MET ${day}/${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`
}

export function clock(t: number): string {
  const day = Math.floor(t)
  const mins = Math.round((t - day) * 1440)
  return `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`
}

export function dayLabel(t: number): string {
  const day = Math.floor(t)
  return day < 0 ? `${-day} days before launch` : `Day ${day}`
}

export function stamp(t: number): string {
  return `${dayLabel(t)}, ${clock(t)}`
}

/** Age of a reading, for the age tag: "45 MIN", "3 H", "12 D". */
export function age(nowT: number, t: number): string {
  const mins = Math.max(0, Math.round((nowT - t) * 1440))
  if (mins < 60) return `${mins} min ago`
  if (mins < 48 * 60) return `${Math.round(mins / 60)} h ago`
  return `${Math.round(mins / 1440)} days ago`
}

export function signed(v: number, decimals: number): string {
  const s = Math.abs(v).toFixed(decimals)
  if (Number(s) === 0) return '0'
  return `${v > 0 ? '+' : '−'}${s}`
}
