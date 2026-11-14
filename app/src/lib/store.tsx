import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { LENA, initialState } from '../data/demo'
import { phaseFor } from './mission'
import type { AppState, CheckIn, IndicatorKey, Person, Reading } from './types'

type Act =
  | { type: 'day'; day: number }
  | { type: 'reading'; personId: string; key: IndicatorKey; reading: Reading }
  | { type: 'checkin'; personId: string; checkin: CheckIn }
  | { type: 'reset' }

function reducer(state: AppState, a: Act): AppState {
  switch (a.type) {
    case 'day':
      // The place follows from the mission plan.
      return { ...state, day: a.day, place: phaseFor(a.day).place }
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
    case 'reset':
      return initialState()
  }
}

interface Store {
  state: AppState
  dispatch: Dispatch<Act>
  viewer: Person
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const store = useMemo(() => ({ state, dispatch, viewer: LENA }), [state])
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
