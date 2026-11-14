import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { useStore } from './lib/store'
import { Body } from './screens/Body'
import { CheckIn } from './screens/CheckIn'
import { Emergency } from './screens/Emergency'
import { Indicator, Symptoms } from './screens/Indicator'
import { Measure } from './screens/Measure'
import { Region } from './screens/Region'
import { Replay } from './screens/Replay'

function Home() {
  const { viewer } = useStore()
  return <Navigate to={`/body/${viewer.id}`} replace />
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/emergency" element={<Emergency />} />
        <Route element={<Shell />}>
          <Route path="/body/:pid" element={<Body />} />
          <Route path="/body/:pid/region/:rid" element={<Region />} />
          <Route path="/body/:pid/indicator/:key" element={<Indicator />} />
          <Route path="/body/:pid/symptoms/:rid" element={<Symptoms />} />
          <Route path="/body/:pid/measure/:key" element={<Measure />} />
          <Route path="/body/:pid/check-in" element={<CheckIn />} />
          <Route path="/replay" element={<Replay />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
