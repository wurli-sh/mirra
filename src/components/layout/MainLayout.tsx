import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
