import type { StatusKey } from '../lib/types'

export const STATUS: Record<StatusKey, { label: string; color: string }> = {
  ok: { label: 'In range', color: 'var(--status-ok)' },
  caution: { label: 'Caution', color: 'var(--status-caution)' },
  warning: { label: 'Warning', color: 'var(--status-warning)' },
  stale: { label: 'No recent data', color: 'var(--status-stale)' },
  unavailable: { label: 'Unavailable', color: 'var(--status-unavailable)' },
  repeat: { label: 'Repeat reading', color: 'var(--text-primary)' },
}

/** The shape half of a status. Colour is never used alone (D5). */
export function StatusShape({ status, size = 14 }: { status: StatusKey; size?: number }) {
  const c = STATUS[status].color
  return (
    <svg className="status-shape" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {status === 'ok' && <circle cx="8" cy="8" r="6" fill={c} />}
      {status === 'caution' && <path d="M8 1.5 15 14H1Z" fill={c} />}
      {status === 'warning' && <path d="M8 1 15 8 8 15 1 8Z" fill={c} />}
      {status === 'stale' && <circle cx="8" cy="8" r="5.5" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3.2 2.6" />}
      {status === 'unavailable' && <rect x="2" y="7" width="12" height="2" rx="1" fill={c} />}
      {status === 'repeat' && (
        <>
          <circle cx="8" cy="8" r="5.5" fill="none" stroke={c} strokeWidth="1.5" />
          <path d="M8 2.5a5.5 5.5 0 0 0 0 11Z" fill={c} />
        </>
      )}
    </svg>
  )
}

export function StatusMark({ status, size }: { status: StatusKey; size?: number }) {
  const s = STATUS[status]
  return (
    <span className="status-mark">
      <StatusShape status={status} size={size} />
      <span style={{ color: status === 'unavailable' ? 'var(--text-muted)' : s.color }}>{s.label}</span>
    </span>
  )
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>
}
