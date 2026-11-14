import { createContext, useContext, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react'
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

export type HealthSystem = 'planet' | 'flight'

export function applyHealthSystem(state: AppState, system: HealthSystem): AppState {
  return { ...state, place: system === 'planet' ? 'surface' : 'spacecraft' }
}

export interface MentalEntry { id: string; day: number; mood: number; energy: number; note: string }

interface Store {
  mentalEntries: MentalEntry[]
  setMentalEntries: Dispatch<React.SetStateAction<MentalEntry[]>>
  healthSystem: HealthSystem
  setHealthSystem: (system: HealthSystem) => void
  state: AppState
  dispatch: Dispatch<Act>
  viewer: Person
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [healthSystem, setHealthSystem] = useState<HealthSystem>('planet')
  const [mentalEntries, setMentalEntries] = useState<MentalEntry[]>([])
  const store = useMemo(() => ({ state: applyHealthSystem(state, healthSystem), dispatch, viewer: LENA, healthSystem, setHealthSystem, mentalEntries, setMentalEntries }), [state, healthSystem, mentalEntries])
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
