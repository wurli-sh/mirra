import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<div className="p-20">Home page coming soon</div>} />
          <Route path="/leaderboard" element={<div className="p-20">Leaderboard coming soon</div>} />
          <Route path="/trade" element={<div className="p-20">Trade coming soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
