import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function MainLayout() {
  const location = useLocation()
  const isTradeRoute = location.pathname === '/trade'

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar connected={isTradeRoute} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
