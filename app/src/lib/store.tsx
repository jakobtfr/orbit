import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react'
import { readDiary, type ConnectionAnswers } from './diary'
import { LENA, initialState } from '../data/demo'
import type { AppState, CheckIn, IndicatorKey, Person, Reading } from './types'

type Act =
  | { type: 'reading'; personId: string; key: IndicatorKey; reading: Reading }
  | { type: 'checkin'; personId: string; checkin: CheckIn }

function reducer(state: AppState, a: Act): AppState {
  switch (a.type) {
    case 'reading': {
      if (a.key === 'cabin') {
        return { ...state, cabin: [...state.cabin, a.reading].sort((x, y) => x.t - y.t) }
      }
      const mine = state.readings[a.personId] ?? {}
      const list = [...(mine[a.key] ?? []), a.reading].sort((x, y) => x.t - y.t)
      return { ...state, readings: { ...state.readings, [a.personId]: { ...mine, [a.key]: list } } }
    }
    case 'checkin': {
      const list = [...(state.checkins[a.personId] ?? []), a.checkin].sort((x, y) => x.t - y.t)
      return { ...state, checkins: { ...state.checkins, [a.personId]: list } }
    }
  }
}

export interface MentalEntry { id: string; day: number; mood: number; energy: number; note: string; createdAt?: string; answers?: ConnectionAnswers }

interface Store {
  /** How far the person is through each next action in this session: the number of steps finished. */
  stepAt: Record<string, number>
  setStepAt: (action: string, step: number) => void
  mentalStorageStatus: 'loading' | 'ready' | 'unavailable'
  mentalEntries: MentalEntry[]
  setMentalEntries: Dispatch<React.SetStateAction<MentalEntry[]>>
  state: AppState
  dispatch: Dispatch<Act>
  viewer: Person
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [mentalEntries, setMentalEntries] = useState<MentalEntry[]>([])
  const [mentalStorageStatus, setMentalStorageStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  useEffect(() => {
    let active = true
    readDiary<MentalEntry>('entries').then((entries) => {
      if (!active) return
      setMentalEntries(entries.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')))
      setMentalStorageStatus('ready')
    }).catch(() => { if (active) setMentalStorageStatus('unavailable') })
    return () => { active = false }
  }, [])
  const [stepAt, setSteps] = useState<Record<string, number>>({})
  const setStepAt = useCallback((action: string, step: number) => setSteps((all) => ({ ...all, [action]: step })), [])
  const store = useMemo(() => ({ state, dispatch, viewer: LENA, mentalEntries, setMentalEntries, mentalStorageStatus, stepAt, setStepAt }), [state, mentalEntries, mentalStorageStatus, stepAt, setStepAt])
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider is missing')
  return s
}

export function personById(id: string | undefined): Person | undefined {
  return id === LENA.id ? LENA : undefined
}
