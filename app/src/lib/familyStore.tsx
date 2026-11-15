import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { OPT_IN_DEFAULT, type OptIn } from './family'
import { readPrivate, writePrivate, type PrivateLine } from './familyPrivate'

/** The family call's own state: who opted in, the private conversation, and the call that is open. None of it is in the health record. */
interface FamilyStore {
  optIn: OptIn
  setOptIn: (next: OptIn) => void
  /** The private conversation, newest last. */
  log: PrivateLine[]
  addLines: (lines: PrivateLine[]) => void
  clearLog: () => void
  /** 'device' when the conversation is stored encrypted on this device, 'session' when the browser has no private storage. */
  kept: 'loading' | 'device' | 'session'
  /** The message whose call is open, by id. */
  calling: string | null
  openFamilyCall: (messageId: string) => void
  closeFamilyCall: () => void
  /** True once the astronaut has answered or put off today's incoming call. */
  answered: boolean
  setAnswered: (done: boolean) => void
}

const Ctx = createContext<FamilyStore>({ optIn: OPT_IN_DEFAULT, setOptIn: () => {}, log: [], addLines: () => {}, clearLog: () => {}, kept: 'session', calling: null, openFamilyCall: () => {}, closeFamilyCall: () => {}, answered: false, setAnswered: () => {} })

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [optIn, setOptInState] = useState<OptIn>(OPT_IN_DEFAULT)
  const [log, setLog] = useState<PrivateLine[]>([])
  const [kept, setKept] = useState<FamilyStore['kept']>('loading')
  const [calling, setCalling] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  useEffect(() => {
    let active = true
    Promise.all([readPrivate<OptIn>('optin', OPT_IN_DEFAULT), readPrivate<PrivateLine[]>('log', [])])
      .then(([o, l]) => { if (active) { setOptInState({ astronaut: o.astronaut, people: { ...OPT_IN_DEFAULT.people, ...o.people } }); setLog((now) => [...l, ...now]); setKept('device') } })
      .catch(() => { if (active) setKept('session') })
    return () => { active = false }
  }, [])
  const setOptIn = useCallback((next: OptIn) => { setOptInState(next); writePrivate('optin', next).catch(() => {}) }, [])
  const addLines = useCallback((lines: PrivateLine[]) => {
    if (!lines.length) return
    setLog((now) => { const next = [...now, ...lines]; writePrivate('log', next).catch(() => {}); return next })
  }, [])
  const clearLog = useCallback(() => { setLog([]); writePrivate('log', []).catch(() => {}) }, [])
  const value = useMemo<FamilyStore>(() => ({
    optIn, setOptIn, log, addLines, clearLog, kept, calling, answered, setAnswered,
    openFamilyCall: (id) => { setAnswered(true); setCalling(id) },
    closeFamilyCall: () => setCalling(null),
  }), [optIn, setOptIn, log, addLines, clearLog, kept, calling, answered])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFamily(): FamilyStore {
  return useContext(Ctx)
}
