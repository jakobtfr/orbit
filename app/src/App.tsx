import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Measurements } from './screens/Measurements'
import { MentalHealth } from './screens/MentalHealth'
import { Shell } from './components/Shell'
import { useStore } from './lib/store'
import { Body } from './screens/Body'
import { Family } from './screens/Family'
import { CheckIn } from './screens/CheckIn'
import { Indicator, Symptoms } from './screens/Indicator'
import { Measure } from './screens/Measure'
import { Muscle } from './screens/Muscle'
import { Replay } from './screens/Replay'
import { Region } from './screens/Region'
import { ProcedurePlayer, Resources } from './screens/Resources'

function Home() {
  const { viewer } = useStore()
  return <Navigate to={`/body/${viewer.id}`} replace />
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/replay" element={<Replay />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/resources/:id" element={<ProcedurePlayer />} />
          <Route path="/measurements" element={<Measurements />} />
          <Route path="/deep-data" element={<Navigate to="/measurements" replace />} />
          <Route path="/mental-health" element={<MentalHealth />} />
          <Route path="/family" element={<Family />} />
          <Route path="/reference/*" element={<Navigate to="/resources" replace />} />
          <Route path="/body/:pid" element={<Body />} />
          <Route path="/body/:pid/muscle/:muscleId" element={<Muscle />} />
          <Route path="/body/:pid/region/:rid" element={<Region />} />
          <Route path="/body/:pid/indicator/:key" element={<Indicator />} />
          <Route path="/body/:pid/symptoms/:rid" element={<Symptoms />} />
          <Route path="/body/:pid/measure/:key" element={<Measure />} />
          <Route path="/body/:pid/check-in" element={<CheckIn />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
