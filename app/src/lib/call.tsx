import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

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
}

const Ctx = createContext<Call>({ call: null, openCall: () => {}, closeCall: () => {}, prompted: true, setPrompted: () => {} })

export function CallProvider({ children }: { children: ReactNode }) {
  const [call, setCall] = useState<Call['call']>(null)
  const [prompted, setPrompted] = useState(false)
  const value = useMemo<Call>(() => ({
    call,
    prompted,
    setPrompted,
    openCall: (about) => { setPrompted(true); setCall({ about }) },
    closeCall: () => setCall(null),
  }), [call, prompted])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCall(): Call {
  return useContext(Ctx)
}
