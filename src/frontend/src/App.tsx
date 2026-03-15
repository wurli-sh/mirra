import { BrowserRouter, Routes, Route } from 'react-router-dom'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/leaderboard" element={<div>Leaderboard</div>} />
        <Route path="/trade" element={<div>Trade</div>} />
      </Routes>
    </BrowserRouter>
  )
}
