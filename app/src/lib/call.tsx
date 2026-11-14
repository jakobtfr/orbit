import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/** The procedure the doctor is going through with the person, and the step they are on. */
export interface Guide { id: string; at: number }

/**
 * The call with the virtual doctor. It opens as a pop-up over whatever screen is showing,
 * so nobody has to leave the dashboard to get help.
 */
interface Call {
  /** The open call and what it is about: an indicator key, a body region, or nothing in particular. */
  call: { about?: string } | null
  openCall: (about?: string) => void
  closeCall: () => void
  /** True once the person has answered the prompt on the dashboard, so it does not come back on every visit. */
  prompted: boolean
  setPrompted: (done: boolean) => void
  /** Set while the doctor walks through a procedure: which one, and the step it is on. */
  guide: Guide | null
  setGuide: (guide: Guide | null) => void
  /** A procedure someone asked the doctor to go through, by id, until the call picks it up. */
  wanted: string | null
  /** Asks the doctor to go through a procedure, opening a call first when none is on. */
  askFor: (id: string | null, about?: string) => void
}

const Ctx = createContext<Call>({ call: null, openCall: () => {}, closeCall: () => {}, prompted: true, setPrompted: () => {}, guide: null, setGuide: () => {}, wanted: null, askFor: () => {} })

export function CallProvider({ children }: { children: ReactNode }) {
  const [call, setCall] = useState<Call['call']>(null)
  const [prompted, setPrompted] = useState(false)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [wanted, setWanted] = useState<string | null>(null)
  const value = useMemo<Call>(() => ({
    call,
    prompted,
    setPrompted,
    guide,
    setGuide,
    wanted,
    openCall: (about) => { setPrompted(true); setCall({ about }) },
    closeCall: () => { setCall(null); setGuide(null); setWanted(null) },
    askFor: (id, about) => { setWanted(id); if (id) { setPrompted(true); setCall((c) => c ?? { about }) } },
  }), [call, prompted, guide, wanted])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCall(): Call {
  return useContext(Ctx)
}
